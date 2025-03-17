// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAKWQ07i9TN1Q8K4n6pz5UsWF_jF7AP5c4",
    authDomain: "ml-pdf-chatbot.firebaseapp.com",
    projectId: "ml-pdf-chatbot",
    storageBucket: "ml-pdf-chatbot.firebasestorage.app",
    messagingSenderId: "496291856445",
    appId: "1:496291856445:web:5047f3783fb8b6430f6a54",
    measurementId: "G-MF12RMYCBR"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
