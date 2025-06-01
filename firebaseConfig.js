// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyD9v9XV-IDKUpI_w9DXAn58HFqh6nGSv7g",
  authDomain: "syllabusdb-a9cc8.firebaseapp.com",
  projectId: "syllabusdb-a9cc8",
  storageBucket: "syllabusdb-a9cc8.firebasestorage.app",
  messagingSenderId: "263369392238",
  appId: "1:263369392238:web:8b92a0bf941f4d0181267f",
  measurementId: "G-B305GZ3T5F",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
