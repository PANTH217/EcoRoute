import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app\'s Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD6TX57qbjRFb4vU55RtqZ_diBZLMa_0JU",
    authDomain: "hacka-07.firebaseapp.com",
    projectId: "hacka-07",
    storageBucket: "hacka-07.firebasestorage.app",
    messagingSenderId: "91431332042",
    appId: "1:91431332042:web:5fa20041e259e29edb2c33",
    measurementId: "G-EV25THRG76"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
