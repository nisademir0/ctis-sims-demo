import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, Transition } from '@headlessui/react';
import { 
  BellIcon, 
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { MobileMenuButton } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import NotificationBell from './NotificationBell';

/**
 * Top navigation bar
 */
export default function Navbar({ onMenuClick }) {
  const { t, i18n } = useTranslation();
  const { user, logout, loading } = useAuth();
  const { theme, changeTheme, changeLanguage } = usePreferences();
  const navigate = useNavigate();
  const isDarkMode = theme === 'dark';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  // Show loading skeleton while auth is initializing
  if (loading) {
    return (
      <div data-testid="navbar-loading" className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  const userNavigation = [
    { 
      name: t('nav.logout'), 
      icon: ArrowRightOnRectangleIcon, 
      onClick: handleLogout,
    },
  ];

  return (
    <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50">
      <div className="flex flex-1 justify-between px-4 lg:px-8">
        {/* Mobile menu button */}
        <div className="flex items-center lg:hidden">
          <MobileMenuButton onClick={onMenuClick} />
        </div>

        {/* Search bar (optional, can be implemented later) */}
        <div className="flex flex-1 items-center justify-center px-2 lg:ml-6 lg:justify-end">
          {/* Search input can go here */}
        </div>

        {/* Right side - theme toggle, notifications, language selector and user menu */}
        <div className="ml-4 flex items-center gap-2 lg:ml-6">
          {/* Theme Toggle */}
          <button
            data-testid="dark-mode-toggle"
            onClick={() => changeTheme(isDarkMode ? 'light' : 'dark')}
            className="rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={isDarkMode ? t('theme.light') : t('theme.dark')}
          >
            {isDarkMode ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </button>
          
          {/* Notification Bell */}
          <NotificationBell />

          {/* Language Selector */}
          <Menu as="div" className="relative">
            <Menu.Button 
              data-testid="language-selector"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {i18n.language.toUpperCase()}
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
              <Menu.Items className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => changeLanguage('tr')}
                      className={clsx(
                        active ? 'bg-gray-100 dark:bg-gray-700' : '',
                        i18n.language === 'tr' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300',
                        'flex w-full items-center px-4 py-2 text-sm transition-colors'
                      )}
                    >
                      {t('nav.turkish')}
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => changeLanguage('en')}
                      className={clsx(
                        active ? 'bg-gray-100 dark:bg-gray-700' : '',
                        i18n.language === 'en' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300',
                        'flex w-full items-center px-4 py-2 text-sm transition-colors'
                      )}
                    >
                      English
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* User menu */}
          <Menu as="div" className="relative ml-3">
            <Menu.Button data-testid="user-menu-button" className="flex items-center max-w-xs rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <span className="sr-only">Open user menu</span>
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="ml-3 hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role?.role_name || 'Staff'}
                </p>
              </div>
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
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none">
                {userNavigation.map((item) => (
                  <Fragment key={item.name}>
                    {item.divider && <div className="border-t border-gray-100 dark:border-gray-700 my-1" />}
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          data-testid={item.name === t('nav.logout') || item.name.toLowerCase().includes('logout') || item.name.toLowerCase().includes(t('nav.logout').toLowerCase()) ? 'logout-button' : undefined}
                          onClick={item.onClick}
                          className={clsx(
                            active ? 'bg-gray-100 dark:bg-gray-700' : '',
                            'flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors'
                          )}
                        >
                          <item.icon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                          {item.name}
                        </button>
                      )}
                    </Menu.Item>
                  </Fragment>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
}
