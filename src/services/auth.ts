import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '@/firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Firebase Authentication uses the real email address entered by the admin.
export const loginWithEmail = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email.trim(), password);
};

/**
 * Firebase Authentication state listener.
 */
export const initAuth = (
  onAuthSuccess?: (user: User) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      onAuthSuccess?.(user);
    } else {
      onAuthFailure?.();
    }
  });
};

/**
 * Send a password reset link to the currently signed-in admin email.
 */
export const sendCurrentUserPasswordResetEmail = async () => {
  const email = auth.currentUser?.email;
  if (!email) {
    throw new Error('AUTH_EMAIL_NOT_AVAILABLE');
  }

  await sendPasswordResetEmail(auth, email);
  return email;
};

export const logout = async () => {
  await signOut(auth);
};
