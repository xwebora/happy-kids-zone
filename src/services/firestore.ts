import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';

import { getFirestore } from 'firebase/firestore';
import { getApps, getApp } from 'firebase/app';

const app = !getApps().length ? getApp() : getApp();

export const db = getFirestore(app);

// Collections
export const menuItemsCollection = collection(db, 'menuItems');
export const categoriesCollection = collection(db, 'categories');
