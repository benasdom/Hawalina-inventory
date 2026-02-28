// Firebase Configuration
// Replace the config values below with your actual Firebase project credentials
// Get these from: Firebase Console > Project Settings > Your apps > Web app

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDrZqTcg071nqzPC4Shvb72BIU2HQSkqNU",
  authDomain: "hawalina-ventures.firebaseapp.com",
  projectId: "hawalina-ventures",
  storageBucket: "hawalina-ventures.firebasestorage.app",
  messagingSenderId: "365644588920",
  appId: "1:365644588920:web:ab489d77eeae3a7b234a8d",
  measurementId: "G-GDS4Z0J9X1"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export app for use in other modules
export default app;

