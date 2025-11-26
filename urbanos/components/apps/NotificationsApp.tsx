'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useOS } from '@/lib/os-context';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/types';
import { Bell, BellOff, CheckCheck, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthModal from '@/components/auth/AuthModal';
import { useToast } from '@/lib/toast-context';
import { handleError, logError } from '@/lib/error-handler';

export default function NotificationsApp() {
  const { user } = useAuth();
  const { setNotifications } = useOS();
  const [notifications, setNotificationsState] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (user) {
      loadNotifications();
      subscribeToNotifications();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotificationsState(data || []);
      const unreadCount = (data || []).filter((n) => !n.read).length;
      setNotifications(unreadCount);
    } catch (error) {
      logError(error, 'NotificationsApp.loadNotifications');
      const errorInfo = handleError(error);
      showToast(errorInfo.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    if (!user) return;

    const channel = supabase
      .channel('user_notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      loadNotifications();
      showToast('Notification marked as read', 'success', 2000);
    } catch (error) {
      logError(error, 'NotificationsApp.markAsRead');
      const errorInfo = handleError(error);
      showToast(errorInfo.message, 'error');
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      loadNotifications();
      showToast('All notifications marked as read', 'success', 2000);
    } catch (error) {
      logError(error, 'NotificationsApp.markAllAsRead');
      const errorInfo = handleError(error);
      showToast(errorInfo.message, 'error');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase.from('notifications').delete().eq('id', notificationId);

      loadNotifications();
      showToast('Notification deleted', 'success', 2000);
    } catch (error) {
      logError(error, 'NotificationsApp.deleteNotification');
      const errorInfo = handleError(error);
      showToast(errorInfo.message, 'error');
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'report_update':
        return '📋';
      case 'agency_response':
        return '💬';
      case 'security_alert':
        return '🔔';
      case 'system':
        return 'ℹ️';
      default:
        return '📌';
    }
  };

  if (!user) {
    return (
      <>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <Bell className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Sign In Required</h3>
            <p className="text-foreground/70 mb-6">
              Please sign in to view your notifications.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-8 py-3 bg-windows-blue text-white rounded-lg font-semibold hover:bg-windows-blue-hover transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-windows-blue border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-foreground/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Notifications</h3>
            <p className="text-sm text-foreground/70">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-windows-blue text-white rounded-lg font-medium hover:bg-windows-blue-hover transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <BellOff className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No Notifications</h3>
                <p className="text-foreground/70">
                  You'll receive notifications here when there are updates to your reports.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative p-4 rounded-xl border transition-colors ${
                    notification.read
                      ? 'bg-foreground/5 border-foreground/10'
                      : 'bg-windows-blue/5 border-windows-blue/20'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{notification.title}</h4>
                      <p className="text-sm text-foreground/70 mb-2">{notification.message}</p>
                      <p className="text-xs text-foreground/50">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2 rounded-lg hover:bg-foreground/10 transition-colors"
                          title="Mark as read"
                        >
                          <CheckCheck className="w-4 h-4 text-windows-blue" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="absolute top-4 right-4 w-2 h-2 bg-windows-blue rounded-full" />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

