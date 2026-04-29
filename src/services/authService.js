import { 
  getAuth, 
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUser,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordReset,
  sendEmailVerification as firebaseSendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { SUBSCRIPTION_PLANS } from '../config/stripe';

const auth = getAuth();
const googleProvider = new GoogleAuthProvider();

// Keep track of auth state observers
let unsubscribeAuthObserver = null;

// Get user roles
async function getUserRoles(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data().roles || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
}

// Check if user has analytics access
async function hasAnalyticsAccess(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.isAdmin || (userData.roles || []).includes('analytics');
    }
    return false;
  } catch (error) {
    console.error('Error checking analytics access:', error);
    return false;
  }
}

// Subscribe to auth state changes with enhanced user data
function onAuthStateChanged(callback) {
  if (unsubscribeAuthObserver) {
    unsubscribeAuthObserver();
  }
  
  unsubscribeAuthObserver = firebaseOnAuthStateChanged(auth, async (user) => {
    if (user) {
      const roles = await getUserRoles(user.uid);
      const hasAnalytics = await hasAnalyticsAccess(user.uid);
      callback({
        ...user,
        roles,
        isAdmin: hasAnalytics
      });
    } else {
      callback(null);
    }
  });
  
  return unsubscribeAuthObserver;
}

export const authService = {
  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  },

  // Get user profile from Firestore
  async getUserProfile() {
    try {
      const user = this.getCurrentUser();
      if (!user) return null;

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return null;
      }

      return userDoc.data();
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  // Update user profile in Firestore
  async saveUserProfile(profileData) {
    try {
      const user = this.getCurrentUser();
      if (!user) throw new Error('User must be logged in');

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: new Date()
      });
      
      return true;
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  },

  // Update user profile in Firebase Auth
  async updateProfile({ displayName, photoURL }) {
    try {
      const user = this.getCurrentUser();
      if (!user) throw new Error('User must be logged in');

      await updateProfile(user, {
        displayName,
        photoURL
      });

      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Sign in with email and password
  async signInWithEmailAndPassword(email, password) {
    try {
      const userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // If email is verified and user doesn't exist in Firestore yet, create it
      if (user.emailVerified) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          await this.initializeUserData(user);
        }
      }

      return user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw this.handleAuthError(error);
    }
  },

  // Create new user with email and password
  async createUserWithEmailAndPassword(email, password) {
    try {
      const userCredential = await firebaseCreateUser(auth, email, password);
      // Only send verification email, don't initialize user data yet
      await this.sendEmailVerification(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw this.handleAuthError(error);
    }
  },

  // Sign in with Google
  async signInWithGoogle() {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      // Google sign-in automatically verifies email, so we can create the user data
      await this.initializeUserData(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw this.handleAuthError(error);
    }
  },

  // Sign out
  async signOut() {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw this.handleAuthError(error);
    }
  },

  // Send password reset email
  async sendPasswordResetEmail(email) {
    try {
      await firebaseSendPasswordReset(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw this.handleAuthError(error);
    }
  },

  // Send email verification
  async sendEmailVerification(user = null) {
    try {
      const currentUser = user || this.getCurrentUser();
      if (!currentUser) throw new Error('User must be logged in');
      
      await firebaseSendEmailVerification(currentUser, {
        url: window.location.origin + '/auth?verified=true',
        handleCodeInApp: true
      });
      
      return true;
    } catch (error) {
      console.error('Email verification error:', error);
      throw this.handleAuthError(error);
    }
  },

  // Check if email is verified
  isEmailVerified() {
    const user = this.getCurrentUser();
    return user?.emailVerified || false;
  },

  // Initialize user data in Firestore
  async initializeUserData(user) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Create new user document with default data
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          emailVerified: user.emailVerified,
          createdAt: new Date(),
          updatedAt: new Date(),
          plan: 'FREE',
          limits: SUBSCRIPTION_PLANS.FREE.limits
        });

        // Create usage stats document
        const usageRef = doc(db, 'usage_stats', user.uid);
        await setDoc(usageRef, {
          cards: 0,
          events: 0,
          draftsPerCard: {},
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error initializing user data:', error);
      throw error;
    }
  },

  // Handle authentication errors
  handleAuthError(error) {
    let message = 'Something went wrong signing you in. Please try again.';

    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        message =
          'That email and password do not match. Try again, use “Forgot password”, or sign in with Google if you created the account that way.';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email. Sign up first, or check for a typo.';
        break;
      case 'auth/invalid-email':
        message = 'That email address does not look valid.';
        break;
      case 'auth/email-already-in-use':
        message = 'An account already exists with this email. Sign in instead.';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters.';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Sign-in was cancelled.';
        break;
      case 'auth/popup-blocked':
        message = 'Your browser blocked the sign-in popup. Allow popups for this site or try again.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Check your connection and try again.';
        break;
      case 'auth/too-many-requests':
        message = 'Too many attempts. Wait a few minutes, then try again.';
        break;
      case 'auth/auth-domain-config-required':
        message =
          'Firebase auth domain is not set up for this URL. In Firebase Console → Authentication → Settings, add this site to “Authorized domains”, and confirm VITE_FIREBASE_AUTH_DOMAIN in your .env matches your project (usually your-project.firebaseapp.com).';
        break;
      case 'auth/operation-not-allowed':
        message = 'This sign-in method is disabled in the Firebase project. Ask the admin to enable Email/Password or Google.';
        break;
      case 'auth/account-exists-with-different-credential':
        message = 'An account already exists with this email using a different sign-in method. Try “Sign in with Google” or reset your password.';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled. Contact support.';
        break;
      case 'auth/invalid-api-key':
        message = 'App configuration error (invalid API key). Check Firebase web config in your environment variables.';
        break;
      default:
        if (error.message && !String(error.message).startsWith('Firebase:')) {
          message = error.message;
        } else if (error.code) {
          message = `Sign-in error (${error.code}). Check Firebase settings and try again.`;
        }
    }

    return new Error(message);
  },

  getUserRoles,
  hasAnalyticsAccess,
  onAuthStateChanged
}; 