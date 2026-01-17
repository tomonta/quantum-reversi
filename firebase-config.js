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

// App Check - Smart configuration (auto-enables on GitHub Pages, disables on localhost)
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const appCheck = firebase.appCheck();
    appCheck.activate('6LdW6U0sAAAAAOADVKXDefpkIwLdSgRevSvJBZI5', true);
    console.log('App Check enabled for production');
} else {
    console.log('App Check disabled for local development');
}

