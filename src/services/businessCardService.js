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
                  text: `





If validation passes, analyze the business card and provide:

1. Extract the following information: name, company, emails (as array), phones (as array), title, websites (as array), address, and any other relevant information.

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
}
If no relevant information is found, return ONLY this error object:
{
  "error": true,
  "message": "Specific reason why image is invalid"
}  
`
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
      
      // Prepare update data with style checking to avoid undefined values
      const updateData = {
        name: cardData.name,
        title: cardData.title,
        company: cardData.company,
        emails: cardData.emails,
        phones: cardData.phones,
        websites: cardData.websites,
        eventId: cardData.eventId || null,
        updatedAt: serverTimestamp()
      };

      // Only include style if it exists to avoid undefined field errors
      if (cardData.style) {
        updateData.style = cardData.style;
      }
      
      await updateDoc(cardRef, updateData);
      return cardData;
    } catch (error) {
      console.error('Error updating business card:', error);
      throw error;
    }
  },

  async uploadMultipleCards(files, eventId = null, onStatusUpdate = null) {
    try {
      if (!storage || !db) {
        throw new Error('Firebase not initialized');
      }

      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User must be logged in to upload cards');
      }

      // Check if there are files to process
      if (!files || files.length === 0) {
        throw new Error('No files selected for upload');
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

      // Check if adding these files would exceed the limit
      if (currentUsage.cards + files.length > userLimits.maxCards) {
        throw new Error(`You have reached your plan's limit of ${userLimits.maxCards} business cards. You can upload ${userLimits.maxCards - currentUsage.cards} more cards. Please upgrade your plan to add more.`);
      }

      if (onStatusUpdate) onStatusUpdate(`Processing ${files.length} business cards...`);

      // Process each file in sequence
      const results = [];
      const errors = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          if (onStatusUpdate) onStatusUpdate(`Processing card ${i + 1} of ${files.length}: ${file.name}`);
          
          // Use the existing uploadCard method to process each file
          const result = await this.uploadCard(file, eventId, (status) => {
            if (onStatusUpdate) onStatusUpdate(`Card ${i + 1} of ${files.length}: ${status}`);
          });
          
          results.push(result);
        } catch (error) {
          console.error(`Error processing card ${i + 1} (${file.name}):`, error);
          errors.push({
            fileName: file.name,
            error: error.message || 'Unknown error'
          });
        }
      }

      if (onStatusUpdate) onStatusUpdate(`Completed processing ${results.length} of ${files.length} cards successfully`);

      return {
        success: results,
        errors,
        message: `Successfully processed ${results.length} of ${files.length} business cards.${errors.length > 0 ? ` Failed to process ${errors.length} cards.` : ''}`
      };
    } catch (error) {
      console.error('Error uploading multiple business cards:', error);
      
      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to upload cards. Please make sure you are logged in.');
      }
      throw error;
    }
  },

  async importVCard(file, eventId = null) {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User must be logged in to import contacts');
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

      // Read the vCard file content
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const vcardData = e.target.result;
            
            // Split the file content into individual vCard blocks
            const vcardBlocks = vcardData.split(/BEGIN:VCARD/i).filter(block => block.trim());
            
            // If no valid vCard blocks found, reject
            if (vcardBlocks.length === 0) {
              reject(new Error('No valid vCard data found in file'));
              return;
            }
            
            // Process only the first vCard in the file
            // (If we need to support multiple cards in future, we can modify this)
            const firstBlock = 'BEGIN:VCARD' + vcardBlocks[0];
            
            // Basic parsing of vCard data
            const lines = firstBlock.split(/\r\n|\r|\n/);
            const cardInfo = {
              name: '',
              company: '',
              title: '',
              emails: [],
              phones: [],
              websites: [],
              address: ''
            };
            
            // Parse vCard fields
            let currentLine = '';
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              
              // Handle folded lines (RFC 2425)
              if (line.match(/^\s/) && currentLine) {
                currentLine += line.trim();
                continue;
              } else {
                if (currentLine) {
                  processVCardLine(currentLine, cardInfo);
                }
                currentLine = line;
              }
            }
            // Process the last line
            if (currentLine) {
              processVCardLine(currentLine, cardInfo);
            }
            
            // Validate that we got at least a name
            if (!cardInfo.name) {
              cardInfo.name = "Imported Contact";
            }
            
            // Create default styling for imported contacts
            const style = {
              backgroundColor: '#ffffff',
              primaryColor: '#1f2937',
              secondaryColor: '#4B5563',
              fontStyle: 'modern',
              layoutStyle: 'minimal',
              contrastInfo: 'Primary text contrast ratio: 10:1, Secondary text contrast ratio: 7:1',
              designNotes: 'Imported contact with default styling'
            };
            
            // Save to Firestore with user ID and style information
            const cardData = {
              ...cardInfo,
              style,
              eventId,
              userId: user.uid,
              createdAt: new Date(),
              importedContact: true
            };

            // Create the card document
            const docRef = await addDoc(collection(db, 'business-cards'), cardData);

            // Update usage stats
            try {
              await updateDoc(usageRef, {
                cards: (currentUsage.cards || 0) + 1,
                updatedAt: new Date()
              });
            } catch (usageError) {
              console.error('Error updating usage stats:', usageError);
              // Continue with the card creation even if usage stats update fails
            }

            // Return success data
            resolve({ 
              id: docRef.id, 
              ...cardData,
              message: `Successfully imported contact for ${cardData.name}!`
            });
          } catch (error) {
            console.error('Error parsing vCard:', error);
            reject(error);
          }
        };
        reader.onerror = (error) => {
          console.error('Error reading file:', error);
          reject(new Error('Error reading vCard file'));
        };
        reader.readAsText(file);
      });
    } catch (error) {
      console.error('Error importing vCard:', error);
      throw error;
    }
  }
};

// Helper function to process a vCard line
function processVCardLine(line, cardInfo) {
  if (!line || line.startsWith('BEGIN:') || line.startsWith('END:') || line.startsWith('VERSION:')) {
    return;
  }
  
  const [fullKey, value] = line.split(':', 2);
  if (!fullKey || !value) return;
  
  // Split the key and parameters
  const [key] = fullKey.split(';');
  const keyUpper = key.toUpperCase();
  
  // Helper function to process and add a valid URL
  const addValidUrl = (url) => {
    const urlValue = url.trim();
    // Only add non-empty URLs and filter out incomplete URLs like just "https" or "http"
    if (urlValue && 
        urlValue !== 'http://' && 
        urlValue !== 'https://' && 
        urlValue !== 'http' && 
        urlValue !== 'https' && 
        urlValue !== 'www') {
      // Ensure URL has a proper protocol and domain
      let formattedUrl = urlValue;
      
      if (formattedUrl.startsWith('www.')) {
        formattedUrl = `https://${formattedUrl}`;
      } else if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `https://${formattedUrl}`;
      }
      
      // Basic validation - URL should at least have a domain after protocol
      try {
        const urlObj = new URL(formattedUrl);
        // Only add if it has a proper domain
        if (urlObj.hostname && urlObj.hostname.includes('.')) {
          // Avoid duplicates
          if (!cardInfo.websites.includes(formattedUrl)) {
            cardInfo.websites.push(formattedUrl);
          }
        }
      } catch (e) {
        // Invalid URL, don't add it
        console.log(`Skipping invalid URL: ${formattedUrl}`);
      }
    }
  };
  
  switch (keyUpper) {
    case 'FN':
      cardInfo.name = value.trim();
      break;
    case 'N':
      // If we don't have a name yet, construct it from N
      if (!cardInfo.name) {
        const parts = value.split(';');
        // Reverse the parts to get "First Last" instead of "Last;First"
        cardInfo.name = [parts[1], parts[0]].filter(Boolean).join(' ').trim();
      }
      break;
    case 'ORG':
      cardInfo.company = value.split(';')[0].trim();
      break;
    case 'TITLE':
      cardInfo.title = value.trim();
      break;
    case 'EMAIL':
      if (value.trim()) cardInfo.emails.push(value.trim());
      break;
    case 'TEL':
      if (value.trim()) cardInfo.phones.push(value.trim());
      break;
    // Handle various URL-related properties
    case 'URL':
    case 'X-URL':
    case 'WORK-URL':
    case 'HOME-URL':
      addValidUrl(value);
      break;
    // Handle social profiles that might contain URLs
    case 'X-SOCIALPROFILE':
    case 'IMPP':
      // Some social profiles might be encoded differently, try to extract URLs
      if (value.includes('http')) {
        const urlMatch = value.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          addValidUrl(urlMatch[1]);
        }
      }
      break;
    case 'ADR':
      const adrParts = value.split(';');
      // Typically, ADR format is: PO Box;Extended Address;Street;City;Region;Postal Code;Country
      const addressParts = adrParts.slice(2).filter(Boolean);
      if (addressParts.length) {
        cardInfo.address = addressParts.join(', ').trim();
      }
      break;
  }
} 