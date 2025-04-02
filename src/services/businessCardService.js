import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { storage, db } from '../config/firebase';
import OpenAI from 'openai';
import { authService } from './authService';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const businessCardService = {
  async uploadCard(file, eventId = null, onStatusUpdate = null) {
    try {
      if (!storage || !db) {
        throw new Error('Firebase not initialized');
      }

      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User must be logged in to upload cards');
      }

      // Upload image to Firebase Storage
      if (onStatusUpdate) onStatusUpdate('Uploading image...');
      const storageRef = ref(storage, `business-cards/${user.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

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
                text: `Analyze this business card and provide two things:
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

Return a JSON object with two main sections:
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
        max_tokens: 1000
      });

      if (onStatusUpdate) onStatusUpdate('Saving card data...');
      
      // Clean the response content to handle potential markdown formatting
      let content = response.choices[0].message.content;
      content = content.replace(/```json\n?|\n?```/g, '').trim();
      
      try {
        const parsedData = JSON.parse(content);
        
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

        const docRef = await addDoc(collection(db, 'business-cards'), cardData);
        return { id: docRef.id, ...cardData };
      } catch (parseError) {
        console.error('Error parsing GPT response:', parseError);
        console.error('Raw response:', content);
        throw new Error('Failed to parse business card data');
      }
    } catch (error) {
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

      // Generate the draft content
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert at writing concise, personalized messages. Create only the body of the message - no subject line, no signature. Focus on creating a clear, friendly message that demonstrates knowledge of both parties' professional context."
          },
          {
            role: "user",
              content: `Write a concise message using these details:

Sender: ${user.displayName}
Recipient: ${card.name}
Recipient's Company: ${card.company}
Recipient's Title: ${card.title || 'not specified'}
Recipient's Role/Context: ${card.eventId ? `Met at ${card.eventId}` : 'Recent business connection'}

Guidelines:
- Start directly with the message content (no greeting)
- Reference their role and company naturally in the text
- Keep it brief but warm and professional
- End with a clear next step or call to action
- Do not add any signature`
          }
        ],
      });

      const draftContent = response.choices[0].message.content;
      console.log('Generated draft content:', draftContent); // Debug log

      // Save the draft to Firestore
      const draftData = {
        content: draftContent,
        cardId: card.id,
        userId: user.uid,
        createdAt: new Date(),
        recipientName: card.name,
        recipientCompany: card.company,
        recipientEmail: card.email
      };

      const docRef = await addDoc(collection(db, 'email-drafts'), draftData);
      console.log('Successfully saved draft with ID:', docRef.id); // Debug log

      return {
        content: draftContent,
        id: docRef.id,
        ...draftData
      };
    } catch (error) {
      console.error('Error in generateEmailDraft:', error);
      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to save drafts. Please make sure you are logged in.');
      }
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

      console.log('Fetching drafts for card:', cardId, 'user:', user.uid); // Debug log

      const q = query(
        collection(db, 'email-drafts'),
        where('cardId', '==', cardId),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const drafts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Found drafts:', drafts); // Debug log
      return drafts;
    } catch (error) {
      console.error('Error getting email drafts:', error);
      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to view drafts. Please make sure you are logged in.');
      }
      return [];
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
  }
}; 