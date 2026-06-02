import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
  type MessagePayload,
} from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY || '';

export const isFirebasePushConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    vapidKey,
);

let serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;
let messagingPromise: Promise<Messaging | null> | null = null;

export const getFirebaseApp = () => {
  if (!isFirebasePushConfigured) return null;
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
};

export const registerFirebaseMessagingServiceWorker = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  if (!serviceWorkerRegistrationPromise) {
    serviceWorkerRegistrationPromise = navigator.serviceWorker
      .register('/firebase-messaging-sw.js', { scope: '/' })
      .catch((err) => {
        console.warn('Firebase messaging service worker registration failed:', err);
        return null;
      });
  }

  return serviceWorkerRegistrationPromise;
};

const getFirebaseMessaging = async () => {
  if (!isFirebasePushConfigured) return null;
  if (typeof window === 'undefined') return null;
  if (!(await isSupported())) return null;

  if (!messagingPromise) {
    messagingPromise = Promise.resolve(
      (() => {
        const app = getFirebaseApp();
        return app ? getMessaging(app) : null;
      })(),
    );
  }

  return messagingPromise;
};

export const getWebPushToken = async () => {
  if (!isFirebasePushConfigured || typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;

  if (Notification.permission === 'default') {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return null;
    } catch {
      return null;
    }
  }

  if (Notification.permission !== 'granted') return null;

  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  const serviceWorkerRegistration = await registerFirebaseMessagingServiceWorker();
  if (!serviceWorkerRegistration) return null;

  try {
    return await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration,
    });
  } catch (err) {
    console.warn('Could not get Firebase web push token:', err);
    return null;
  }
};

export const onForegroundPushMessage = async (
  callback: (payload: MessagePayload) => void,
) => {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;
  return onMessage(messaging, callback);
};
