import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC1pdIsYkHVFu8vLFzuOT6jhbGpiq0Z97s",
  authDomain: "pbbts-b49a4.firebaseapp.com",
  projectId: "pbbts-b49a4",
  storageBucket: "pbbts-b49a4.firebasestorage.app",
  messagingSenderId: "593502746057",
  appId: "1:593502746057:web:296bd8ceafcc7c1b822418",
  measurementId: "G-L71LFMQ764"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);