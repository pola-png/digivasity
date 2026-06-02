import React, { useEffect, useRef } from 'react';
import type { AppUser } from '../lib/appwrite';
import { listenForForegroundPushes, syncBrowserNewsUpdatesSubscription } from '../lib/webPush';

interface PushNotificationManagerProps {
  user: AppUser | null;
}

export const PushNotificationManager: React.FC<PushNotificationManagerProps> = ({ user }) => {
  const activeNotificationRef = useRef<Notification | null>(null);

  useEffect(() => {
    if (!user) return;

    void syncBrowserNewsUpdatesSubscription(user).catch((err) => {
      console.error('Could not sync browser push subscription:', err);
    });
  }, [user?.uid]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let active = true;

    void (async () => {
      if (!user) return;

      const listener = await listenForForegroundPushes((title, body, link) => {
        if (!active || typeof Notification === 'undefined' || Notification.permission !== 'granted') {
          return;
        }

        if (activeNotificationRef.current) {
          activeNotificationRef.current.close();
        }

        const notification = new Notification(title, {
          body,
          icon: '/favicon.svg',
          data: { link },
        });

        notification.onclick = () => {
          window.focus();
          if (link) {
            window.open(link, '_blank', 'noopener,noreferrer');
          }
          notification.close();
        };

        activeNotificationRef.current = notification;
      });

      if (listener) {
        unsubscribe = () => listener();
      }
    })();

    return () => {
      active = false;
      activeNotificationRef.current?.close();
      activeNotificationRef.current = null;
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid]);

  return null;
};
