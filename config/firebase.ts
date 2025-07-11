// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAVrMKmVHOcksh3s4rs7bj6RWWNaYXMAj4',
  authDomain: 'expense-tracker-f8904.firebaseapp.com',
  projectId: 'expense-tracker-f8904',
  storageBucket: 'expense-tracker-f8904.firebasestorage.app',
  messagingSenderId: '534548375473',
  appId: '1:534548375473:web:d07f41bdeb6f055d2c3f90',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

//db
export const firestore = getFirestore(app);
