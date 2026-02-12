import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDqovOFrpId2OeYXd9E-vamrG4KZyCb0VI",
  authDomain: "voetbal-mobile-app.firebaseapp.com",
  projectId: "voetbal-mobile-app",
  storageBucket: "voetbal-mobile-app.firebasestorage.app",
  messagingSenderId: "1018444115266",
  appId: "1:1018444115266:web:d702b84a1c7877289f6cdb",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialiseer services
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
