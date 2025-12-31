import { useState, useEffect } from 'react';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from '../api/notifications';
import toast from 'react-hot-toast';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications({ filter });
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      const deletedNotification = notifications.find(n => n.id === id);
      setNotifications(notifications.filter(n => n.id !== id));
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return {
    notifications,
    unreadCount,
    loading,
    filter,
    setFilter,
    fetchNotifications,
    fetchUnreadCount,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDelete,
  };
};
