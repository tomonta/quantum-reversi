const firebaseConfig = {
    apiKey: "AIzaSyDkMT6P3c0_THxzLO2Rk0u3XoaxYFqsWW8",
    authDomain: "reversi-online-ead54.firebaseapp.com",
    databaseURL: "https://reversi-online-ead54-default-rtdb.firebaseio.com",
    projectId: "reversi-online-ead54",
    storageBucket: "reversi-online-ead54.firebasestorage.app",
    messagingSenderId: "1096402453434",
    appId: "1:1096402453434:web:024cedfedaa7b2ddfd5383",
    measurementId: "G-REKQ2BLC1Z"
};

// Initialize Firebase (Compat mode)
firebase.initializeApp(firebaseConfig);
window.db = firebase.database();
window.auth = firebase.auth();

// App Check - Smart configuration
// API Key limitation logic: Only enable App Check if we are ON GitHub Pages.
// This prevents errors on localhost, file://, or other dev environments.
/*
const hostname = window.location.hostname;
if (hostname && hostname.includes('github.io')) {
    const appCheck = firebase.appCheck();
    appCheck.activate('6LdW6U0sAAAAAOADVKXDefpkIwLdSgRevSvJBZI5', true);
    console.log('App Check enabled for production (GitHub Pages)');
} else {
    console.log('App Check disabled for local development');
}
*/

