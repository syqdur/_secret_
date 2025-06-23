import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCqDlIxPDp-QU6mzthkWnmzM6rZ8rnJdiI",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "dev1-b3973"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dev1-b3973",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "dev1-b3973"}.firebasestorage.app`,
  messagingSenderId: "658150387877",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:658150387877:web:ac90e7b1597a45258f5d4c",
  measurementId: "G-7W2BNH8MQ7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
