// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDmo51jDkFz24XcuE1p1nA0a_J4memXEIs",
  authDomain: "intense-climber-400415.firebaseapp.com",
  projectId: "intense-climber-400415",
  storageBucket: "intense-climber-400415.firebasestorage.app",
  messagingSenderId: "984329853365",
  appId: "1:984329853365:web:211d876e8def60ce7fa1fc"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Digivasity Update';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update!',
    icon: '/favicon.svg',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
