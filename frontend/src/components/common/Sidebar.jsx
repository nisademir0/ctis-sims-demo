import { Fragment, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog, Transition } from '@headlessui/react';
import {
  HomeIcon,
  CubeIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  Bars3Icon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { ROLES, getUserRole, canManageInventory } from '../../utils/constants';

// SidebarContent component defined outside of render to avoid recreation
const SidebarContent = ({ filteredNavigation, isActive, location, user, setSidebarOpen, userRole, expandedItems, toggleExpand }) => (
  <div className="flex flex-col h-full bg-gray-900">
    {/* Logo */}
    <div className="flex items-center justify-between h-16 px-4 bg-gray-800">
      <div className="flex items-center">
        <CubeIcon className="h-8 w-8 text-blue-500" />
        <span className="ml-2 text-xl font-bold text-white">CTIS SIMS</span>
      </div>
      <button
        type="button"
        className="lg:hidden text-gray-400 hover:text-white"
        onClick={() => setSidebarOpen(false)}
      >
        <XMarkIcon className="h-6 w-6" />
      </button>
    </div>

    {/* Navigation */}
    <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
      {filteredNavigation.map((item) => {
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isExpanded = expandedItems[item.name];
        const isItemActive = item.href && isActive(item.href);
        
        return (
          <div key={item.name}>
            {/* Main menu item */}
            {item.href ? (
              <Link
                to={item.href}
                className={clsx(
                  'group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isItemActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
                onClick={() => {
                  if (hasSubItems) {
                    toggleExpand(item.name);
                  } else {
                    setSidebarOpen(false);
                  }
                }}
              >
                <div className="flex items-center">
                  <item.icon
                    className={clsx(
                      'mr-3 h-6 w-6 flex-shrink-0',
                      isItemActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-300'
                    )}
                  />
                  {item.name}
                </div>
                {hasSubItems && (
                  isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )
                )}
              </Link>
            ) : (
              <button
                onClick={() => toggleExpand(item.name)}
                className={clsx(
                  'group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <div className="flex items-center">
                  <item.icon
                    className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-300"
                  />
                  {item.name}
                </div>
                {hasSubItems && (
                  isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )
                )}
              </button>
            )}
            
            {/* Sub-items */}
            {hasSubItems && isExpanded && (
              <div className="ml-12 mt-1 space-y-1">
                {item.subItems
                  .filter(subItem => {
                    if (!subItem.roles) return true;
                    if (subItem.roles.includes('all')) return true;
                    return subItem.roles.some(role => role === userRole);
                  })
                  .map((subItem) => (
                    <Link
                      key={subItem.name}
                      to={subItem.href}
                      className={clsx(
                        'block px-3 py-2 text-sm rounded-md transition-colors',
                        location.pathname === subItem.href
                          ? 'text-blue-400 font-medium'
                          : 'text-gray-400 hover:text-white'
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      {subItem.name}
                    </Link>
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>

    {/* User info */}
    <div className="flex-shrink-0 p-4 border-t border-gray-800">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {user?.name || 'User'}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {user?.email || ''}
          </p>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Sidebar navigation component
 */
export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = useState({});

  const userRole = getUserRole(user);
  const isManager = canManageInventory(user);
  const isStaff = userRole === ROLES.STAFF;

  const toggleExpand = (itemName) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  const navigation = [
    { name: t('nav.dashboard'), href: '/', icon: HomeIcon, roles: ['all'] },
    { name: t('nav.inventory'), href: '/inventory', icon: CubeIcon, roles: ['all'] },
    { 
      name: t('nav.chatbot'), 
      href: '/chatbot', 
      icon: ChatBubbleLeftRightIcon, 
      roles: ['all']
    },
  ].filter(Boolean); // false olan itemleri temizle

  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true;
    if (item.roles.includes('all')) return true;
    
    // Check if user's role matches any allowed role
    return item.roles.some(role => {
      if (typeof role === 'string') {
        return role === userRole; // userRole zaten normalize edilmiş
      }
      return false;
    });
  });

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col">
                <SidebarContent 
                  filteredNavigation={filteredNavigation}
                  isActive={isActive}
                  location={location}
                  user={user}
                  setSidebarOpen={setSidebarOpen}
                  userRole={userRole}
                  expandedItems={expandedItems}
                  toggleExpand={toggleExpand}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent 
          filteredNavigation={filteredNavigation}
          isActive={isActive}
          location={location}
          user={user}
          setSidebarOpen={setSidebarOpen}
          userRole={userRole}
          expandedItems={expandedItems}
          toggleExpand={toggleExpand}
        />
      </div>
    </>
  );
}

/**
 * Mobile menu button
 */
export function MobileMenuButton({ onClick }) {
  return (
    <button
      type="button"
      data-testid="mobile-menu-button"
      className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
      onClick={onClick}
    >
      <span className="sr-only">Open sidebar</span>
      <Bars3Icon className="h-6 w-6" aria-hidden="true" />
    </button>
  );
}
