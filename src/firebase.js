// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAbaPEKk0b5lMrP2OD0i7gcp3uOFVwbbxo",
  authDomain: "soullog-9ece4.firebaseapp.com",
  projectId: "soullog-9ece4",
  storageBucket: "soullog-9ece4.firebasestorage.app",
  messagingSenderId: "283111450333",
  appId: "1:283111450333:web:d32c5e9106c8f1ef9cdd34",
  measurementId: "G-Z827NFRWWP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and Export the services SoulLog actually uses
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Create a safe folder name from your appId
export const appId = String(firebaseConfig.appId).replace(/[^a-zA-Z0-9]/g, '_');