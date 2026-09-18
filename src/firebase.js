import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: 'AIzaSyBs6voO04CRk5Dwnj8rdF2YIP7cDrwf6fY',
  authDomain: 'shopmanagement-38307.firebaseapp.com',
  projectId: 'shopmanagement-38307',
  storageBucket: 'shopmanagement-38307.firebasestorage.app',
  messagingSenderId: '318785451777',
  appId: '1:318785451777:web:6e1577a35dbf65dca80d00',
};
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
