import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBBjIq2rnRenTXndUvBeyRIcGCW2n4hLwI",
  authDomain: "spincash-4922b.firebaseapp.com",
  projectId: "spincash-4922b",
  storageBucket: "spincash-4922b.firebasestorage.app",
  messagingSenderId: "1034326114270",
  appId: "1:1034326114270:web:255ca1d5257c8ee721274f"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
