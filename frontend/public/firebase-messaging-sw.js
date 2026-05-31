importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCo4DSsdcfEYFeg7XQrnCwMi3a7vIkdDYM",
  authDomain: "elite-nursing-cbt.firebaseapp.com",
  projectId: "elite-nursing-cbt",
  storageBucket: "elite-nursing-cbt.firebasestorage.app",
  messagingSenderId: "18123266651",
  appId: "1:18123266651:web:7632db14d93727bec47d7e"
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  console.log('Background message:', payload);
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/favicon.ico'
  });
});