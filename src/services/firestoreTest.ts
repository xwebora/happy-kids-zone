import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';

import { db } from './firestore';

export async function testFirestore() {
  console.log('🔥 Testing Firestore connection...');

  const testCollection = collection(db, 'firestoreConnectionTest');

  // كتابة سجل تجريبي
  const testDoc = await addDoc(testCollection, {
    message: 'Firestore connection OK',
    createdAt: new Date().toISOString(),
  });

  console.log('✅ Write successful:', testDoc.id);

  // قراءة السجل
  const snapshot = await getDocs(testCollection);

  console.log('✅ Read successful:', snapshot.size);

  // حذف السجل التجريبي
  await deleteDoc(doc(db, '__connection_test__', testDoc.id));

  console.log('✅ Delete successful');

  return true;
}
