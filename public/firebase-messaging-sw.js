importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');
importScripts('/firebase-config.js');

const config = self.FIREBASE_CONFIG || {};

if (
  config.apiKey &&
  config.authDomain &&
  config.projectId &&
  config.storageBucket &&
  config.messagingSenderId &&
  config.appId
) {
  firebase.initializeApp(config);

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload?.notification?.title || payload?.data?.title || 'Digivasity';
    const body = payload?.notification?.body || payload?.data?.body || payload?.data?.message || '';
    const url = payload?.data?.link || payload?.data?.url || '/';

    self.registration.showNotification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: {
        url,
      },
    });
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || '/';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            if (client.url.includes(url) || url === '/') {
              return client.focus();
            }
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url.startsWith('http') ? url : new URL(url, self.location.origin).href);
        }
        return null;
      }),
  );
});
