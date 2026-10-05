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
export const sendCurrentUserPasswordResetEmail = async (language: 'ar' | 'en' | 'ku' = 'ar') => {
  const email = auth.currentUser?.email?.trim();
  if (!email) {
    throw new Error('AUTH_EMAIL_NOT_AVAILABLE');
  }

  // Keep the Firebase email action localized to the dashboard language.
  auth.languageCode = language === 'ar' ? 'ar' : language === 'ku' ? 'ku' : 'en';

  // After the password is changed, Firebase can return the user to the admin portal.
  // The continue URL domain must be added to Firebase Authentication > Settings > Authorized domains.
  const continueUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#/admin`
      : undefined;

  const actionCodeSettings = continueUrl
    ? { url: continueUrl }
    : undefined;

  await sendPasswordResetEmail(auth, email, actionCodeSettings);
  return email;
};

export const logout = async () => {
  await signOut(auth);
};
