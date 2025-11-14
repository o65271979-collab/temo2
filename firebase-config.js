// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyAtCV2XfOJwLy050kHg5y_Oqy-9NfKyOlc",
  authDomain: "temo-a8e65.firebaseapp.com",
  projectId: "temo-a8e65",
  storageBucket: "temo-a8e65.firebasestorage.app",
  messagingSenderId: "897974034557",
  appId: "1:897974034557:web:fcb74ee2c9e9b73def1114",
  measurementId: "G-EVZ5JG42TS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
