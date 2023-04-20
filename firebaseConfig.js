// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyA1N635-zWY_JlgP4w7n6NM8Q7pDYMcKRY",
    authDomain: "scorepad-with-rounds.firebaseapp.com",
    databaseURL: "https://scorepad-with-rounds-default-rtdb.firebaseio.com",
    projectId: "scorepad-with-rounds",
    storageBucket: "scorepad-with-rounds.appspot.com",
    messagingSenderId: "774305501031",
    appId: "1:774305501031:web:86b4d739d967e2fef7e9c2",
    measurementId: "G-0ZELRGE0CK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
