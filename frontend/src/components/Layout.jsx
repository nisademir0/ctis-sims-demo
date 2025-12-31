import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './common/Sidebar';
import Navbar from './common/Navbar';
import FloatingChatButton from './common/FloatingChatButton';

/**
 * Main layout component with sidebar and navbar
 */
export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  // Don't show chatbot button on chatbot pages
  const showChatButton = !location.pathname.startsWith('/chatbot');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Navbar */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 bg-gray-50 dark:bg-gray-900">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
      
      {/* Floating chatbot button */}
      {showChatButton && <FloatingChatButton />}
    </div>
  );
}
