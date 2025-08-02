
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/*
Firebase: Utilizes config for active usage of firebase auth, firestore, and storage
*/

const firebaseConfig = {
    apiKey: "AIzaSyA6aI2Din_SnAdXyI5gCxv_R8g78myV0R0",
    authDomain: "focus-flow-d98eb.firebaseapp.com",
    projectId: "focus-flow-d98eb",
    storageBucket: "focus-flow-d98eb.firebasestorage.app",
    messasgingSenderId: "356330549578",
    appId: "1:356330549578:web:71693d05f63116f93151b3"
};

//console.log("Application is connected to Firebase Project ID:", firebaseConfig.projectId);

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

export const db = getFirestore(app);

export const storage = getStorage(app);