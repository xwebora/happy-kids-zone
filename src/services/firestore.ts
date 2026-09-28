import { getFirestore } from 'firebase/firestore';
import { getApps, getApp } from 'firebase/app';

const app = getApps().length ? getApp() : null;

if (!app) {
  throw new Error('Firebase app is not initialized');
}

export const db = getFirestore(app);
