import { Fragment, useState, useEffect } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const notificationTypeIcons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const { unreadCount, fetchUnreadCount, handleMarkAsRead, handleMarkAllAsRead } = useNotifications();
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Poll for unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch recent notifications when dropdown opens
  const handleMenuOpen = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      const { getNotifications } = await import('../../api/notifications');
      const data = await getNotifications({ filter: 'unread', per_page: 5 });
      setRecentNotifications(data.notifications);
    } catch (error) {
      console.error('Failed to fetch recent notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }
    
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className="relative rounded-full bg-white dark:bg-gray-800 p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:ring-offset-gray-900"
        onClick={handleMenuOpen}
      >
        <span className="sr-only">View notifications</span>
        <BellIcon className="h-6 w-6" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-96 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAllAsRead();
                  setRecentNotifications([]);
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Loading...
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No new notifications
              </div>
            ) : (
              recentNotifications.map((notification) => (
                <Menu.Item key={notification.id}>
                  {({ active }) => (
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className={classNames(
                        active ? 'bg-gray-100 dark:bg-gray-700' : '',
                        !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : '',
                        'w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700'
                      )}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl flex-shrink-0">
                          {notificationTypeIcons[notification.type] || '📬'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="ml-2 h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </button>
                  )}
                </Menu.Item>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => navigate('/notifications')}
              className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              View all notifications
            </button>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
