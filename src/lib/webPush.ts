import { createUserDocument, ensureNewsUpdatesTopicSubscription, type AppUser } from './appwrite';
import { getWebPushToken, onForegroundPushMessage } from './firebase';

export const syncBrowserNewsUpdatesSubscription = async (user: AppUser | null) => {
  if (!user) return null;

  const token = await getWebPushToken();
  if (!token) return null;

  try {
    await createUserDocument(user, { pushToken: token });
  } catch (err) {
    console.error('Could not save the browser push token to the user profile:', err);
  }

  return ensureNewsUpdatesTopicSubscription(token);
};

export const listenForForegroundPushes = async (
  callback: (title: string, body?: string, link?: string) => void,
) => {
  return onForegroundPushMessage((payload) => {
    const title = payload.notification?.title || payload.data?.title || 'Digivasity';
    const body = payload.notification?.body || payload.data?.body || payload.data?.message || '';
    const link = payload.data?.link || payload.data?.url || '';
    callback(title, body, link);
  });
};
