import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// Replace these with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKGxepvoQFKFdnz5K6BEVf_kCXIKklokQ",
  authDomain: "gym-tracking-5bfb4.firebaseapp.com",
  projectId: "gym-tracking-5bfb4",
  storageBucket: "gym-tracking-5bfb4.firebasestorage.app",
  messagingSenderId: "857601111992",
  appId: "1:857601111992:web:73263b6fd1fd33b81f014d",
  measurementId: "G-HCKRV1H580"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app); 