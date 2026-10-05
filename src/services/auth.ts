import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '@/firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Firebase Authentication uses an email internally.
// The admin UI intentionally exposes only username + password.
const AUTH_EMAIL_DOMAIN = 'happy-kids-zone.firebaseapp.com';

const usernameToAuthEmail = (username: string) =>
  `${username.trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;

export const loginWithUsername = async (username: string, password: string) => {
  const email = usernameToAuthEmail(username);
  return signInWithEmailAndPassword(auth, email, password);
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

export const logout = async () => {
  await signOut(auth);
};
