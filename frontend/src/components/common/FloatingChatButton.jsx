import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Floating chatbot button that appears on all pages
 */
export default function FloatingChatButton() {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    navigate('/chatbot');
  };

  return (
    <button
      data-testid="chatbot-button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      title="AI Chatbot"
    >
      <ChatBubbleLeftRightIcon className="h-6 w-6" />
      
      {/* Tooltip */}
      {isHovered && (
        <span className="absolute bottom-full mb-2 right-0 px-3 py-1 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap">
          AI Chatbot
        </span>
      )}
      
      {/* Pulse animation */}
      <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20"></span>
    </button>
  );
}
