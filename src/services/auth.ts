import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '@/firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

/**
 * Firebase Authentication state listener.
 * Google Drive OAuth scopes and access-token handling are intentionally removed.
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
