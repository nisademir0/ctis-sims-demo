import { useTranslation } from 'react-i18next';
import { useNotifications } from '../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const notificationTypeStyles = {
  success: 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  error: 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  warning: 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  info: 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
};

const notificationTypeIcons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

export default function Notifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    filter,
    setFilter,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDelete,
  } = useNotifications();

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('notifications.title', 'Notifications')}
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <CheckIcon className="h-4 w-4" />
            {t('notifications.markAllRead', 'Mark all as read')}
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex gap-2">
        {['all', 'unread', 'read'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              filter === filterOption
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            {t(`notifications.filter.${filterOption}`, filterOption.charAt(0).toUpperCase() + filterOption.slice(1))}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              {t('common.loading', 'Loading...')}
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">📬</div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('notifications.empty', 'No notifications')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'unread' 
                ? t('notifications.emptyUnread', 'You have no unread notifications')
                : t('notifications.emptyAll', "You don't have any notifications yet")}
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={clsx(
                'relative rounded-lg border shadow-sm p-4 transition-all',
                !notification.is_read 
                  ? notificationTypeStyles[notification.type] || 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                notification.action_url && 'cursor-pointer hover:shadow-md'
              )}
              onClick={() => notification.action_url && handleNotificationClick(notification)}
            >
              <div className="flex items-start space-x-3">
                <span className="text-3xl flex-shrink-0">
                  {notificationTypeIcons[notification.type] || '📬'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {notification.title}
                    </h3>
                    {!notification.is_read && (
                      <span className="ml-2 h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                        >
                          {t('notifications.markRead', 'Mark as read')}
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title={t('notifications.delete', 'Delete')}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {notification.action_url && notification.action_text && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationClick(notification);
                      }}
                      className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      {notification.action_text} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
