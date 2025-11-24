'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import notificationService, { UserNotification } from '@/services/notification.service';
import { useToast } from '@/components/ui/Toast';
import { API_URL } from '@/lib/env';
import { useAuth } from '@/stores/AuthContext';

interface NotificationContextValue {
  notifications: UserNotification[];
  unreadCount: number;
  markAsRead: (ids: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const MAX_NOTIFICATIONS = 30;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    let isMounted = true;
    if (!isAuthenticated) {
      setNotifications([]);
      eventSourceRef.current?.close();
      return;
    }

    (async () => {
      try {
        const response = await notificationService.getNotifications();
        if (isMounted) {
          setNotifications(response.data || []);
        }
      } catch (error) {
        console.error('[Notifications] Failed to load notifications:', error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      eventSourceRef.current?.close();
      return;
    }

    const streamBase = (API_URL || '').replace(/\/$/, '');

    const connect = () => {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const url = new URL(`${streamBase}/notifications/stream`);
      if (token) {
        url.searchParams.append('token', token);
      }
      const eventSource = new EventSource(url.toString(), {
        withCredentials: true,
      });
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setNotifications((prev) => {
            const filtered = prev.filter((notification) => notification.id !== data.id);
            const next = [{ ...data, isRead: false }, ...filtered];
            return next.slice(0, MAX_NOTIFICATIONS);
          });
          showToast({
            type: data.type || 'info',
            title: data.title,
            description: data.message,
          });
        } catch (error) {
          console.error('[Notifications] Failed to parse SSE message:', error);
        }
      };

      eventSource.onerror = () => {
        console.warn('[Notifications] SSE connection lost. Retrying in 5s...');
        eventSource.close();
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      eventSourceRef.current?.close();
    };
  }, [isAuthenticated, showToast]);

  const markAsRead = async (ids: string[]) => {
    if (!isAuthenticated || !ids || ids.length === 0) return;
    if (!isAuthenticated) return;
    try {
      await notificationService.markAsRead(ids);
      setNotifications((prev) =>
        prev.map((notification) =>
          ids.includes(notification.id)
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
    } catch (error) {
      console.error('[Notifications] Failed to mark notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        }))
      );
    } catch (error) {
      console.error('[Notifications] Failed to mark all notifications as read:', error);
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

