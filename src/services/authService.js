import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  onAuthStateChanged as firebaseOnAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const authService = {
  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Check if this is a new user
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    if (!userDoc.exists()) {
      // Create initial user document
      await setDoc(doc(db, 'users', result.user.uid), {
        createdAt: new Date(),
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        profileCompleted: true
      });
    }
    
    return result.user;
  },

  async signOut() {
    await firebaseSignOut(auth);
  },

  getCurrentUser() {
    return auth.currentUser;
  },

  onAuthStateChange(callback) {
    return firebaseOnAuthStateChanged(auth, callback);
  },

  async updateProfile(profileData) {
    const user = this.getCurrentUser();
    if (!user) throw new Error('No user logged in');

    await firebaseUpdateProfile(user, {
      displayName: profileData.displayName,
      photoURL: profileData.photoURL,
      email: profileData.email
    });
  },

  async saveUserProfile(profileData) {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('User must be logged in to save profile');
      }

      // Create or update user profile in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      const profileDataWithUid = {
        ...profileData,
        uid: user.uid,
        updatedAt: new Date()
      };

      if (userDoc.exists()) {
        await updateDoc(userRef, profileDataWithUid);
      } else {
        await setDoc(userRef, {
          ...profileDataWithUid,
          createdAt: new Date(),
          profileCompleted: true
        });
      }

      return { uid: user.uid, ...profileDataWithUid };
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  },

  async getUserProfile() {
    const user = this.getCurrentUser();
    if (!user) throw new Error('No user logged in');

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    return userDoc.exists() ? userDoc.data() : null;
  }
}; 