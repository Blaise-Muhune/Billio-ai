import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  onAuthStateChanged as firebaseOnAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
        photoURL: result.user.photoURL
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
    const user = this.getCurrentUser();
    if (!user) throw new Error('No user logged in');

    await setDoc(doc(db, 'users', user.uid), {
      ...profileData,
      updatedAt: new Date()
    }, { merge: true });
  },

  async getUserProfile() {
    const user = this.getCurrentUser();
    if (!user) throw new Error('No user logged in');

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    return userDoc.exists() ? userDoc.data() : null;
  }
}; 