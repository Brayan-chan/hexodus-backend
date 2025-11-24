import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4qznu3hKRByQRSIm4pkc__-J6e8JqTPk",
  authDomain: "hexodusgym.firebaseapp.com",
  projectId: "hexodusgym",
  storageBucket: "hexodusgym.firebasestorage.app",
  messagingSenderId: "575555434492",
  appId: "1:575555434492:web:af4584fcfc3c424d74e479"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;