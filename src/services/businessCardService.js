import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, updateDoc, deleteDoc, increment, setDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../config/firebase';
import { SUBSCRIPTION_PLANS } from '../config/plans';
import OpenAI from 'openai';
import { authService } from './authService';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const businessCardService = {
  async uploadCard(file, eventId = null, onStatusUpdate = null) {
    let storageRef = null;
    let imageDeleted = false; // Flag to track if image has been deleted

    // Helper function to safely delete the image
    const safeDeleteImage = async () => {
      if (storageRef && !imageDeleted) {
        try {
          await deleteObject(storageRef);
          imageDeleted = true;
        } catch (deleteError) {
          // Only log if it's not a 'not-found' error
          if (deleteError.code !== 'storage/object-not-found') {
            console.error('Error deleting image:', deleteError);
          }
        }
      }
    };

    try {
      if (!storage || !db) {
        throw new Error('Firebase not initialized');
      }

      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User must be logged in to upload cards');
      }

      // Check usage limits before proceeding
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          createdAt: new Date(),
          updatedAt: new Date(),
          plan: 'FREE',
          limits: SUBSCRIPTION_PLANS.FREE.limits
        });
      }

      const userData = userDoc.exists() ? userDoc.data() : { limits: SUBSCRIPTION_PLANS.FREE.limits };
      const userLimits = userData.limits || SUBSCRIPTION_PLANS.FREE.limits;

      // Get or create usage stats
      const usageRef = doc(db, 'usage_stats', user.uid);
      const usageDoc = await getDoc(usageRef);
      
      if (!usageDoc.exists()) {
        // Create usage stats document if it doesn't exist
        await setDoc(usageRef, {
          cards: 0,
          events: 0,
          draftsPerCard: {},
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      const currentUsage = usageDoc.exists() ? usageDoc.data() : { cards: 0 };

      if (currentUsage.cards >= userLimits.maxCards) {
        throw new Error(`You have reached your plan's limit of ${userLimits.maxCards} business cards. Please upgrade your plan to add more cards.`);
      }

      // Upload image to Firebase Storage
      if (onStatusUpdate) onStatusUpdate('Uploading image...');
      storageRef = ref(storage, `business-cards/${user.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      try {
        // Extract text using GPT-4 Vision
        if (onStatusUpdate) onStatusUpdate('Processing image with AI...');
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `First, validate if this image is a clear, readable business card:

1. Validation Checks (return error object if ANY of these fail):
   - Confirm this is a business card image or picture with contact information (not a random photo, document, or other item)
   - Verify the image is clear enough to read text 
   - Check if there is visible contact information

If validation fails, return ONLY this error object:
{
  "error": true,
  "message": "Specific reason why image is invalid (e.g., 'Not a business card', 'Image too blurry', etc.)"
}

If validation passes, analyze the business card and provide:

1. Extract the following information: name, company, emails (as array), phones (as array) return well formatted phone numbers, title, websites (as array), address, and any other relevant information.

2. Analyze the visual style and ensure high contrast readability:
   - Determine the dominant background color of the card
   - Choose text colors that provide excellent contrast against the background:
     * primaryColor: for main text (name, contact info) - MUST have contrast ratio at least 4.5:1
     * secondaryColor: for secondary text (titles, additional info) - MUST have contrast ratio at least 3:1
   - If the background is very light, use darker text colors
   - If the background is dark or vibrant, use light text colors
   - For white/very light backgrounds, use dark grays or navy instead of pure black
   - For dark backgrounds, use off-white or light gray instead of pure white

Return a JSON object with two main sections (ONLY if validation passes):
{
  "info": {
    "name": "...",
    "company": "...",
    "emails": ["email1@example.com"],
    "phones": ["+1234567890"],
    "title": "...",
    "websites": ["website1.com"],
    "address": "..."
  },
  "style": {
    "cardBackgroundColor": "#HEXCODE",
    "mainTextColor": "#HEXCODE",
    "secondaryTextColor": "#HEXCODE",
    "fontStyle": "modern/traditional/elegant",
    "layoutStyle": "minimal/complex/traditional",
    "contrastInfo": "Primary text contrast ratio: X:1, Secondary text contrast ratio: Y:1",
    "designNotes": "Description of notable design elements and style choices"
  }
}`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          response_format: { type: "json_object" }
        });

        if (onStatusUpdate) onStatusUpdate('Saving card data...');
        
        try {
          const parsedData = JSON.parse(response.choices[0].message.content);
          
          // Check if the response contains an error
          if (parsedData.error) {
            await safeDeleteImage();
            throw new Error(parsedData.message || 'Invalid business card image');
          }
          
          // Rename style properties to match our expected format
          const style = {
            ...parsedData.style,
            backgroundColor: parsedData.style.cardBackgroundColor,
            primaryColor: parsedData.style.mainTextColor,
            secondaryColor: parsedData.style.secondaryTextColor
          };
          delete style.cardBackgroundColor;
          delete style.mainTextColor;
          delete style.secondaryTextColor;
          
          // Save to Firestore with user ID and style information
          const cardData = {
            ...parsedData.info,
            style,
            imageUrl,
            eventId,
            userId: user.uid,
            createdAt: new Date(),
          };

          // Create the card document
          const docRef = await addDoc(collection(db, 'business-cards'), cardData);

          // Update usage stats
          try {
            const usageRef = doc(db, 'usage_stats', user.uid);
            const usageDoc = await getDoc(usageRef);
            
            if (!usageDoc.exists()) {
              // Create initial usage stats document
              await setDoc(usageRef, {
                cards: 1,
                events: 0,
                draftsPerCard: {},
                createdAt: new Date(),
                updatedAt: new Date()
              });
            } else {
              // Update existing usage stats
              await updateDoc(usageRef, {
                cards: (usageDoc.data().cards || 0) + 1,
                updatedAt: new Date()
              });
            }
          } catch (usageError) {
            console.error('Error updating usage stats:', usageError);
            // Continue with the card creation even if usage stats update fails
          }

          // Return success data with message
          return { 
            id: docRef.id, 
            ...cardData,
            message: `Successfully processed business card for ${cardData.name}! Added to your collection.`
          };
        } catch (parseError) {
          await safeDeleteImage();
          console.error('Error parsing GPT response:', parseError);
          console.error('Raw response:', response.choices[0].message.content);
          throw new Error('Failed to parse business card data');
        }
      } catch (error) {
        await safeDeleteImage();
        throw error;
      }
    } catch (error) {
      await safeDeleteImage();
      console.error('Error uploading business card:', error);
      
      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to upload cards. Please make sure you are logged in.');
      }
      throw error;
    }
  },

  async getCards(eventId = null) {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User must be logged in to get cards');
      }

      let q = query(
        collection(db, 'business-cards'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      if (eventId) {
        q = query(q, where('eventId', '==', eventId));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting business cards:', error);
      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to view these cards. Please make sure you are logged in.');
      }
      throw error;
    }
  },

  async generateEmailDraft(card) {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User must be logged in to generate email drafts');
      }

      // Validate card data
      if (!card || !card.id) {
        throw new Error('Invalid card data');
      }

      // Get primary email from the emails array
      const recipientEmail = card.emails && card.emails.length > 0 ? card.emails[0] : null;
      if (!recipientEmail) {
        throw new Error('No email address found on the business card');
      }

      // Check usage limits BEFORE making GPT call
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();
      const userLimits = userData.limits || SUBSCRIPTION_PLANS.FREE.limits;

      // Get current drafts for this card
      const draftsQuery = query(
        collection(db, 'email-drafts'),
        where('cardId', '==', card.id),
        where('userId', '==', user.uid)
      );
      const draftsSnapshot = await getDocs(draftsQuery);
      const currentDrafts = draftsSnapshot.size;

      if (currentDrafts >= userLimits.maxDraftsPerCard) {
        throw {
          type: 'PLAN_LIMIT',
          message: `You have reached your plan's limit of ${userLimits.maxDraftsPerCard} email drafts per card. Please upgrade your plan to create more drafts.`
        };
      }

      // Get event details if card has an eventId
      let eventContext = 'Recent business connection';
      if (card.eventId) {
        const eventRef = doc(db, 'events', card.eventId);
        const eventDoc = await getDoc(eventRef);
        if (eventDoc.exists()) {
          const eventData = eventDoc.data();
          eventContext = `Met at ${eventData.name}`;
        }
      }

      // Only proceed with GPT call if all checks pass
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert at writing professional, personalized emails for business networking. Generate three components: 1) A compelling subject line, 2) The email body and 3) A professional signature. The email should be concise, friendly, and focused on building a professional connection."
          },
          {
            role: "user",
            content: `Write an email with the following details:

Sender: ${user.displayName}
Sender's Title: ${user.title || 'Professional'}
Recipient: ${card.name}
Recipient's Company: ${card.company}
Recipient's Title: ${card.title || 'not specified'}
Context: ${eventContext}

Guidelines:
- Generate a compelling subject line that encourages opening the email
- include small introduction of yourself of name and any relevant information
- Keep the body brief but warm and professional
- the body should be a single paragraph cuase it could be sent as a text message too.
- Include a clear next step or call to action
- the call to action should be something that is easy to do and not too pushy cause they might be in other city so thing like  "let's keep in touch" should be fine and not "let grab a coffee"
- Add a professional signature with sender's name and title
- Format the response as a JSON object with subject, body, and signature fields
- generate a complete email that wont require any additional edits
- make the email sound human and not robotic and a bit casual
- make the email sound like you met them at an event and you are reaching out to them


return a json object with the following fields:
{
  "subject": "...",
  "body": "...",
  "signature": "..."
}
`
          }
        ],
        response_format: { type: "json_object" }
      });

      const emailData = JSON.parse(response.choices[0].message.content);
      const body = `${emailData.body}`;

      // Save the draft to Firestore with validated data
      const draftData = {
        subject: emailData.subject,
        content: body,
        signature: emailData.signature,
        cardId: card.id,
        userId: user.uid,
        createdAt: new Date(),
        recipientName: card.name || 'Unknown',
        recipientCompany: card.company || 'Unknown',
        recipientEmail: recipientEmail,
        recipientTitle: card.title || 'Unknown',
        status: 'draft'
      };

      const docRef = await addDoc(collection(db, 'email-drafts'), draftData);
      console.log('Successfully saved draft with ID:', docRef.id);

      // Update usage stats
      try {
        const usageRef = doc(db, 'usage_stats', user.uid);
        const usageDoc = await getDoc(usageRef);
        
        if (!usageDoc.exists()) {
          // Create initial usage stats document
          await setDoc(usageRef, {
            cards: 0,
            events: 0,
            draftsPerCard: {
              [card.id]: 1
            },
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else {
          // Get current drafts for this card
          const currentDrafts = usageDoc.data().draftsPerCard?.[card.id] || 0;
          
          // Update only the specific card's draft count
          const update = {
            [`draftsPerCard.${card.id}`]: currentDrafts + 1,
            updatedAt: new Date()
          };
          
          await updateDoc(usageRef, update);
        }
      } catch (usageError) {
        console.error('Error updating usage stats:', usageError);
        // Continue even if usage stats update fails
      }

      return {
        id: docRef.id,
        ...draftData
      };
    } catch (error) {
      console.error('Error in generateEmailDraft:', error);
      throw error;
    }
  },

  async getEmailDrafts(cardId) {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User must be logged in to view drafts');
      }

      // First verify the card belongs to the user
      const cardRef = doc(db, 'business-cards', cardId);
      const cardDoc = await getDoc(cardRef);
      
      if (!cardDoc.exists() || cardDoc.data().userId !== user.uid) {
        throw new Error('You do not have permission to view drafts for this card');
      }

      const q = query(
        collection(db, 'email-drafts'),
        where('cardId', '==', cardId),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting email drafts:', error);
      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to view drafts. Please make sure you are logged in.');
      }
      throw error;
    }
  },

  async getEvents() {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User must be logged in to get events');
      }

      // Query events for the current user
      const q = query(
        collection(db, 'events'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting events:', error);
      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to view events. Please make sure you are logged in.');
      }
      throw error;
    }
  },

  async createEvent(eventData) {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User must be logged in to create events');
      }

      // Check usage limits before creating event
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();
      const userLimits = userData.limits || SUBSCRIPTION_PLANS.FREE.limits;

      // Get current usage stats
      const usageRef = doc(db, 'usage_stats', user.uid);
      const usageDoc = await getDoc(usageRef);
      
      if (!usageDoc.exists()) {
        // Create initial usage stats document
        await setDoc(usageRef, {
          cards: 0,
          events: 1,
          draftsPerCard: {},
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        const currentEvents = usageDoc.data().events || 0;
        
        // Check if user has reached event limit
        if (currentEvents >= userLimits.maxEvents) {
          throw {
            type: 'PLAN_LIMIT',
            message: `You have reached your plan's limit of ${userLimits.maxEvents} events. Please upgrade your plan to create more events.`
          };
        }

        // Update event count
        await updateDoc(usageRef, {
          events: increment(1),
          updatedAt: new Date()
        });
      }

      // Add user ID and creation timestamp
      const eventWithMetadata = {
        ...eventData,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'events'), eventWithMetadata);
      
      // Return the event with its ID
      return {
        id: docRef.id,
        ...eventWithMetadata
      };
    } catch (error) {
      console.error('Error creating event:', error);
      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to create events. Please make sure you are logged in.');
      }
      throw error;
    }
  },

  async updateCardEvent(cardId, eventId) {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User must be logged in to update cards');
      }

      // Get the card to verify ownership
      const cardRef = doc(db, 'business-cards', cardId);
      const cardDoc = await getDoc(cardRef);
      
      if (!cardDoc.exists()) {
        throw new Error('Card not found');
      }

      if (cardDoc.data().userId !== user.uid) {
        throw new Error('You do not have permission to update this card');
      }

      // Update the card's event
      await updateDoc(cardRef, {
        eventId: eventId || null,
        updatedAt: new Date()
      });

      return { id: cardId, eventId };
    } catch (error) {
      console.error('Error updating card event:', error);
      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to update this card. Please make sure you are logged in.');
      }
      throw error;
    }
  },

  async deleteCard(cardId) {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User must be logged in to delete cards');
      }

      // Get the card to verify ownership
      const cardRef = doc(db, 'business-cards', cardId);
      const cardDoc = await getDoc(cardRef);
      
      if (!cardDoc.exists()) {
        throw new Error('Card not found');
      }

      if (cardDoc.data().userId !== user.uid) {
        throw new Error('You do not have permission to delete this card');
      }

      // Delete the card
      await deleteDoc(cardRef);

      // If there's an image URL, delete it from storage
      const imageUrl = cardDoc.data().imageUrl;
      if (imageUrl) {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (storageError) {
          console.error('Error deleting image from storage:', storageError);
          // Continue even if storage deletion fails
        }
      }

      return { id: cardId };
    } catch (error) {
      console.error('Error deleting business card:', error);
      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to delete this card. Please make sure you are logged in.');
      }
      throw error;
    }
  },

  async updateCard(cardData) {
    try {
      const cardRef = doc(db, 'business-cards', cardData.id);
      await updateDoc(cardRef, {
        name: cardData.name,
        title: cardData.title,
        company: cardData.company,
        emails: cardData.emails,
        phones: cardData.phones,
        websites: cardData.websites,
        updatedAt: serverTimestamp()
      });
      return cardData;
    } catch (error) {
      console.error('Error updating business card:', error);
      throw error;
    }
  }
}; 