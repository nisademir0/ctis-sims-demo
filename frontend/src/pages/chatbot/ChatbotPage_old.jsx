import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { askChatbot, submitChatbotFeedback } from '../../api/chatbot';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import InteractiveTable from '../../components/chatbot/InteractiveTable';
import { 
  HandThumbUpIcon, 
  HandThumbDownIcon, 
  InformationCircleIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { 
  HandThumbUpIcon as HandThumbUpSolidIcon, 
  HandThumbDownIcon as HandThumbDownSolidIcon 
} from '@heroicons/react/24/solid';
import useToast from '../../hooks/useToast';

/**
 * Parse markdown tables from text
 */
const parseMarkdownTable = (text) => {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return null;
  
  // Check if it's a markdown table (must have | separators)
  if (!lines[0].includes('|')) return null;
  
  // Parse headers (first line)
  const headers = lines[0]
    .split('|')
    .map(h => h.trim())
    .filter(h => h.length > 0);
  
  if (headers.length === 0) return null;
  
  // Skip separator line (second line with dashes)
  const dataStartIndex = lines[1].includes('-') ? 2 : 1;
  
  // Parse data rows
  const rows = [];
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || !line.includes('|')) continue;
    
    const cells = line
      .split('|')
      .map(c => c.trim())
      .filter((c, idx, arr) => {
        // Remove empty first/last cells if line starts/ends with |
        if (idx === 0 || idx === arr.length - 1) return c.length > 0;
        return true;
      });
    
    if (cells.length === headers.length) {
      rows.push(cells);
    }
  }
  
  return rows.length > 0 ? { headers, rows } : null;
};

/**
 * Format bot response with markdown-like syntax, code blocks, and tables
 */
const formatBotMessage = (text) => {
  if (!text) return [{ type: 'text', content: '' }];

  const parts = [];
  
  // First, extract code blocks
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let segments = [];
  let lastIndex = 0;
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2].trim()
    });
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }
  
  if (segments.length === 0) {
    segments.push({ type: 'text', content: text });
  }
  
  // Now, parse tables from text segments
  segments.forEach(segment => {
    if (segment.type === 'code') {
      parts.push(segment);
    } else {
      // Try to find tables in text
      const lines = segment.content.split('\n');
      let tableStart = -1;
      let tableEnd = -1;
      let currentIndex = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.includes('|') && tableStart === -1) {
          tableStart = i;
        } else if (tableStart !== -1 && !line.includes('|') && line.length > 0) {
          tableEnd = i;
          
          // Extract and parse table
          const tableText = lines.slice(tableStart, tableEnd).join('\n');
          const tableData = parseMarkdownTable(tableText);
          
          if (tableData) {
            // Add text before table
            if (tableStart > currentIndex) {
              const beforeText = lines.slice(currentIndex, tableStart).join('\n').trim();
              if (beforeText) {
                parts.push({ type: 'text', content: beforeText });
              }
            }
            
            // Add table
            parts.push({ type: 'table', ...tableData });
            currentIndex = tableEnd;
          }
          
          tableStart = -1;
          tableEnd = -1;
        }
      }
      
      // Handle table at end of text
      if (tableStart !== -1) {
        const tableText = lines.slice(tableStart).join('\n');
        const tableData = parseMarkdownTable(tableText);
        
        if (tableData) {
          if (tableStart > currentIndex) {
            const beforeText = lines.slice(currentIndex, tableStart).join('\n').trim();
            if (beforeText) {
              parts.push({ type: 'text', content: beforeText });
            }
          }
          parts.push({ type: 'table', ...tableData });
          currentIndex = lines.length;
        }
      }
      
      // Add remaining text
      if (currentIndex < lines.length) {
        const remainingText = lines.slice(currentIndex).join('\n').trim();
        if (remainingText) {
          parts.push({ type: 'text', content: remainingText });
        }
      }
      
      // If no table found, add as text
      if (parts.length === 0 || (parts[parts.length - 1].type !== 'text' && parts[parts.length - 1].type !== 'table')) {
        if (segment.content.trim()) {
          parts.push({ type: 'text', content: segment.content });
        }
      }
    }
  });
  
  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
};

/**
 * Render formatted text with markdown-like styling
 */
const renderFormattedText = (text) => {
  let formatted = text;
  
  // Bold: **text**
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
  
  // Italic: *text*
  formatted = formatted.replace(/\*([^*]+?)\*/g, '<em class="italic">$1</em>');
  
  // Inline code: `code`
  formatted = formatted.replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 bg-gray-800 text-green-400 rounded text-xs font-mono">$1</code>');
  
  // Lists: - item or * item (at start of line)
  formatted = formatted.replace(/^[-*]\s+(.+)$/gm, '<div class="flex gap-2 my-1"><span class="text-blue-600">•</span><span>$1</span></div>');
  
  // Links: [text](url)
  formatted = formatted.replace(/\[(.+?)\]\((.+?)\)/g, '<span class="text-blue-600 font-medium underline">$1</span>');
  
  // Headings
  formatted = formatted.replace(/^###\s+(.+)$/gm, '<h3 class="text-sm font-bold mt-3 mb-1 text-gray-900">$1</h3>');
  formatted = formatted.replace(/^##\s+(.+)$/gm, '<h2 class="text-base font-bold mt-4 mb-2 text-gray-900">$1</h2>');
  formatted = formatted.replace(/^#\s+(.+)$/gm, '<h1 class="text-lg font-bold mt-4 mb-2 text-gray-900">$1</h1>');
  
  // Line breaks
  formatted = formatted.replace(/\n/g, '<br/>');
  
  return formatted;
};

/**
 * Check if message contains a table
 */
const messageHasTable = (messageText) => {
  if (!messageText) return false;
  const parts = formatBotMessage(messageText);
  return parts.some(part => part.type === 'table');
};

// LocalStorage key for chat history
const CHAT_HISTORY_KEY = 'ctis_chat_history';
const CHAT_HISTORY_EXPIRY_HOURS = 24;

/**
 * Load chat history from localStorage
 */
const loadChatHistory = () => {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!stored) return null;
    
    const { messages, timestamp } = JSON.parse(stored);
    
    // Check if history has expired (24 hours)
    const now = Date.now();
    const expiryTime = CHAT_HISTORY_EXPIRY_HOURS * 60 * 60 * 1000;
    
    if (now - timestamp > expiryTime) {
      localStorage.removeItem(CHAT_HISTORY_KEY);
      return null;
    }
    
    return messages;
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return null;
  }
};

/**
 * Save chat history to localStorage
 */
const saveChatHistory = (messages) => {
  try {
    const data = {
      messages,
      timestamp: Date.now()
    };
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
};

/**
 * Clear chat history from localStorage
 */
const clearChatHistory = () => {
  try {
    localStorage.removeItem(CHAT_HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear chat history:', error);
  }
};

/**
 * AI Chatbot Page Component
 */
const ChatbotPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [showInfo, setShowInfo] = useState({});
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const hasLoadedHistory = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    
    // Debug: Log scroll capability
    if (chatContainerRef.current) {
      const el = chatContainerRef.current;
      console.log('📊 Chatbox Debug:', {
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        scrollable: el.scrollHeight > el.clientHeight,
        overflowY: window.getComputedStyle(el).overflowY,
        height: window.getComputedStyle(el).height
      });
    }
  }, [messages]);

  // Load chat history on mount ONLY
  useEffect(() => {
    // Prevent loading history multiple times
    if (hasLoadedHistory.current) return;
    
    const savedMessages = loadChatHistory();
    
    if (savedMessages && savedMessages.length > 0) {
      setMessages(savedMessages);
      hasLoadedHistory.current = true;
      toast.info(t('other.onceki_sohbet_gecmisiniz_yuklendi'));
    } else {
      // Show welcome message if no history
      const welcomeMessage = {
        id: 'welcome',
        type: 'bot',
        text: `Merhaba **${user?.name}**! 👋\n\nCTIS Envanter Yönetim Sistemi asistanıyım. Size aşağıdaki konularda yardımcı olabilirim:\n\n- Envanter durumu sorguları\n- Ödünç işlemleri\n- Bakım talepleri\n- İstatistiksel analizler\n\nSize nasıl yardımcı olabilirim?`,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
      hasLoadedHistory.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Save chat history whenever messages change (but skip during initial load)
  useEffect(() => {
    // Only save if history has been loaded and we have messages
    if (hasLoadedHistory.current && messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages]);

  // Clear history handler
  const handleClearHistory = () => {
    if (confirm(t('other.sohbet_gecmisini_temizlemek_istediginizden_emin_misiniz'))) {
      clearChatHistory();
      setMessages([
        {
          id: 'welcome-' + Date.now(),
          type: 'bot',
          text: `Merhaba **${user?.name}**! 👋\n\nCTIS Envanter Yönetim Sistemi asistanıyım. Size aşağıdaki konularda yardımcı olabilirim:\n\n- Envanter durumu sorguları\n- Ödünç işlemleri\n- Bakım talepleri\n- İstatistiksel analizler\n\nSize nasıl yardımcı olabilirim?`,
          timestamp: new Date().toISOString(),
        },
      ]);
      toast.success(t('other.sohbet_gecmisi_temizlendi'));
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      text: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const query = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    setIsRateLimited(false);

    try {
      const response = await askChatbot(query);
      
      const responseText = response.response || response.answer || response.message || t('other.yanit_alinamadi');
      
      const botMessage = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        text: responseText,
        queryId: response.query_id || response.id,
        timestamp: response.timestamp || new Date().toISOString(),
        isFallback: response.is_fallback || response.fallback || false,
        confidence: response.confidence,
        feedback: null,
        metadata: response.query_metadata || {
          duration_ms: response.duration_ms,
          query_type: response.query_type,
          result_count: response.result_count,
          sql_query: response.sql_query || response.sql,
          has_tables: response.query_metadata?.has_tables || false
        },
        originalQuery: query,
        sqlQuery: response.sql_query || response.sql,
        tables: response.tables || [], // ← Structured table data
      };

      setMessages((prev) => [...prev, botMessage]);

      if (response.is_fallback || response.fallback) {
        toast.info(t('chatbot.bu_soruya_nceden_kaydedilmi_bir_yan_t_verdim'));
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      
      if (error.response?.status === 429) {
        setIsRateLimited(true);
        toast.warning(t('chatbot.ok_fazla_sorgu_g_nderdiniz_l_tfen_biraz_bekleyin'));
      } else {
        const errorMessage = {
          id: `error-${Date.now()}`,
          type: 'bot',
          text: t('chatbot.zg_n_m_u_anda_bir_sorun_ya_yorum_l_tfen_daha_sonra_tekrar_deneyin'),
          timestamp: new Date().toISOString(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
        toast.error(error.response?.data?.message || t('messages.bir_hata_olu_tu'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId, isHelpful) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message || !message.queryId) return;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, feedback: isHelpful ? 'helpful' : 'unhelpful' }
          : m
      )
    );

    try {
      await submitChatbotFeedback({
        query_id: message.queryId,
        rating: isHelpful ? 'helpful' : 'not_helpful',
        comment: null,
      });

      toast.success(
        isHelpful
          ? t('other.geri_bildiriminiz_icin_tesekkurler')
          : 'Geri bildiriminiz kaydedildi. 👎'
      );
    } catch (error) {
      console.error('Feedback error:', error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, feedback: null } : m
        )
      );
      toast.error(t('other.geri_bildirim_gonderilemedi'));
    }
  };

  const toggleInfo = (messageId) => {
    setShowInfo(prev => ({ ...prev, [messageId]: !prev[messageId] }));
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 dark:text-gray-100">
            <SparklesIcon className="w-7 h-7 text-blue-600" />
            AI Asistan
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Envanter yönetimi, işlemler ve sistem hakkında sorularınızı sorun.
          </p>
        </div>
        
        {/* Clear History Button */}
        {messages.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearHistory}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 dark:text-gray-400"
          >
            <TrashIcon className="w-4 h-4" />
            <span>{t('other.gecmisi_temizle')}</span>
          </Button>
        )}
      </div>

      {/* Chat Card */}
      <div className="bg-white rounded-lg shadow flex flex-col h-[calc(100vh-220px)] dark:bg-gray-800">
        {/* Messages Area with Custom Scrollbar */}
        <div 
          ref={chatContainerRef}
          data-testid="chat-messages"
          className="chat-scroll p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white"
          style={{
            flex: '1 1 0%',
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
            scrollbarColor: '#CBD5E0 #EDF2F7'
          }}
        >
          <style>{`
            .chat-scroll::-webkit-scrollbar {
              width: 8px;
            }
            .chat-scroll::-webkit-scrollbar-track {
              background: #EDF2F7;
              border-radius: 4px;
            }
            .chat-scroll::-webkit-scrollbar-thumb {
              background: #CBD5E0;
              border-radius: 4px;
              transition: background 0.2s;
            }
            .chat-scroll::-webkit-scrollbar-thumb:hover {
              background: #A0AEC0;
            }
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-fadeIn {
              animation: fadeIn 0.3s ease-out;
            }
            @keyframes slideUp {
              from {
                opacity: 0;
                max-height: 0;
              }
              to {
                opacity: 1;
                max-height: 500px;
              }
            }
            .animate-slideUp {
              animation: slideUp 0.3s ease-out;
            }
          `}</style>

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              } animate-fadeIn`}
            >
              {/* User Message */}
              {message.type === 'user' && (
                <div className="max-w-[75%] bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-sm shadow-md px-5 py-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                  <p className="text-xs mt-2 opacity-75 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    {new Date(message.timestamp).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}

              {/* Bot Message */}
              {message.type === 'bot' && (
                <div className={`max-w-[80%] rounded-2xl rounded-tl-sm shadow-md overflow-hidden ${
                  message.isError
                    ? 'bg-red-50 border-2 border-red-200'
                    : 'bg-white border border-gray-200'
                }`}>
                  {/* Message Header */}
                  <div className={`px-5 py-3 flex items-center justify-between ${
                    message.isError ? 'bg-red-100 border-b border-red-200' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${message.isError ? 'bg-red-200 dark:bg-red-900/30' : 'bg-white dark:bg-gray-700 shadow-sm'}`}>
                        <SparklesIcon className={`w-4 h-4 ${message.isError ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
                      </div>
                      <span className={`text-xs font-semibold ${message.isError ? 'text-red-900 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        AI Asistan
                      </span>
                      {message.isFallback && (
                        <Badge variant="info" className="text-xs">📝 Kaydedilmiş</Badge>
                      )}
                    </div>
                    
                    {message.queryId && (
                      <button
                        onClick={() => toggleInfo(message.id)}
                        className={`p-1.5 rounded-full transition-all ${
                          showInfo[message.id] 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}
                        title={t('other.detaylari_goster_gizle')}
                      >
                        <InformationCircleIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="px-5 py-4">
                    {/* Render text content */}
                    {formatBotMessage(message.text).map((part, idx) => (
                      <div key={idx}>
                        {part.type === 'text' ? (
                          <div 
                            className="text-sm text-gray-800 leading-relaxed dark:text-gray-200"
                            dangerouslySetInnerHTML={{ __html: renderFormattedText(part.content) }}
                          />
                        ) : part.type === 'table' ? (
                          <InteractiveTable 
                            headers={part.headers}
                            rows={part.rows}
                          />
                        ) : (
                          <div className="my-3 rounded-lg overflow-hidden border border-gray-300 shadow-sm dark:border-gray-600">
                            <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
                              <span className="text-xs font-mono text-gray-300 uppercase">{part.language}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(part.content);
                                  toast.success(t('other.kod_kopyalandi'));
                                }}
                                className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 hover:bg-gray-700 rounded"
                              >
                                📋 Kopyala
                              </button>
                            </div>
                            <pre className="bg-gray-900 p-4 overflow-x-auto">
                              <code className="text-green-400 font-mono text-xs leading-relaxed">{part.content}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Render structured tables from backend (if any) */}
                    {message.tables && message.tables.length > 0 && message.tables.map((table, tableIdx) => (
                      <div key={`table-${tableIdx}`} className="mt-3">
                        <InteractiveTable 
                          headers={table.headers}
                          rows={table.rows.map(row => table.headers.map(h => row[h]))}
                          columnTypes={table.column_types || {}}
                        />
                        {table.total_count > table.rows.length && (
                          <p className="mt-2 text-xs text-gray-500 italic dark:text-gray-400">
                            İlk {table.rows.length} sonuç gösteriliyor. Toplam {table.total_count} kayıt.
                          </p>
                        )}
                      </div>
                    ))}

                    {/* Metadata Info */}
                    {showInfo[message.id] && message.metadata && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 animate-slideUp dark:border-gray-700">
                        <div className="bg-blue-50 rounded-lg p-3 text-xs text-gray-700 dark:text-gray-300">
                          <p className="font-semibold text-blue-900 mb-2 flex items-center gap-1">
                            <InformationCircleIcon className="w-4 h-4" />
                            Sorgu Detayları
                          </p>
                          
                          {message.originalQuery && (
                            <div className="mb-2 pb-2 border-b border-blue-100">
                              <span className="font-medium text-gray-600 dark:text-gray-400">Sorgu:</span>
                              <p className="mt-1 text-gray-800 italic dark:text-gray-200">"{message.originalQuery}"</p>
                            </div>
                          )}

                          {/* SQL Query Display - Show if message has tables */}
                          {(message.sqlQuery || message.metadata.sql_query) && (message.tables?.length > 0 || messageHasTable(message.text)) && (
                            <div className="mb-2 pb-2 border-b border-blue-100">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-600 dark:text-gray-400">SQL Sorgusu:</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(message.sqlQuery || message.metadata.sql_query);
                                    toast.success(t('chatbot.sql_sorgusu_kopyaland'));
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  📋 Kopyala
                                </button>
                              </div>
                              <div className="mt-2 bg-gray-900 rounded p-2 overflow-x-auto">
                                <pre className="text-green-400 font-mono text-xs whitespace-pre-wrap break-words">
                                  {message.sqlQuery || message.metadata.sql_query}
                                </pre>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2">
                            {message.metadata.duration_ms && (
                              <div className="flex items-center gap-1.5">
                                <ClockIcon className="w-3.5 h-3.5 text-blue-600" />
                                <span className="text-gray-600 dark:text-gray-400">{t('other.yanit')}</span>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">
                                  {(message.metadata.duration_ms / 1000).toFixed(2)}s
                                </span>
                              </div>
                            )}

                            {message.metadata.result_count !== undefined && (
                              <div className="flex items-center gap-1.5">
                                {message.metadata.result_count > 0 ? (
                                  <CheckCircleIcon className="w-3.5 h-3.5 text-green-600" />
                                ) : (
                                  <XCircleIcon className="w-3.5 h-3.5 text-gray-400" />
                                )}
                                <span className="text-gray-600 dark:text-gray-400">{t('other.sonuc')}</span>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">
                                  {message.metadata.result_count} kayıt
                                </span>
                              </div>
                            )}

                            {message.confidence && (
                              <div className="col-span-2 flex items-center gap-1.5">
                                <span className="text-gray-600 dark:text-gray-400">{t('other.guven_skoru')}</span>
                                <span className={`font-bold ${
                                  message.confidence >= 0.7 ? 'text-green-600' :
                                  message.confidence >= 0.5 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {(message.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Footer */}
                  {!message.isError && (
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 dark:bg-gray-900">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center gap-1 dark:text-gray-400">
                          <ClockIcon className="w-3 h-3" />
                          {new Date(message.timestamp).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        {message.queryId && (
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{t('other.faydali_mi')}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleFeedback(message.id, true)}
                                disabled={message.feedback !== null}
                                className={`p-2 rounded-full transition-all ${
                                  message.feedback === 'helpful'
                                    ? 'bg-green-100 text-green-600'
                                    : 'hover:bg-green-50 text-gray-400 hover:text-green-600'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                title={t('other.faydali')}
                              >
                                {message.feedback === 'helpful' ? (
                                  <HandThumbUpSolidIcon className="w-4 h-4" />
                                ) : (
                                  <HandThumbUpIcon className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleFeedback(message.id, false)}
                                disabled={message.feedback !== null}
                                className={`p-2 rounded-full transition-all ${
                                  message.feedback === 'unhelpful'
                                    ? 'bg-red-100 text-red-600'
                                    : 'hover:bg-red-50 text-gray-400 hover:text-red-600'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                title={t('other.faydali_degil')}
                              >
                                {message.feedback === 'unhelpful' ? (
                                  <HandThumbDownSolidIcon className="w-4 h-4" />
                                ) : (
                                  <HandThumbDownIcon className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-md px-5 py-4 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('chatbot.ai_d_n_yor')}</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t-2 border-gray-200 bg-white p-5 dark:bg-gray-800">
          {isRateLimited && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 rounded-r-lg flex items-start gap-2 animate-fadeIn">
              <span className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">{t('chatbot.ok_fazla_sorgu_g_nderdiniz')}</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">{t('other.lutfen_birkac_dakika_bekleyin_ve_tekrar_deneyin')}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              name="message"
              data-testid="chatbot-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('chatbot.sorunuzu_buraya_yaz_n_rn_ka_adet_masa_var')}
              disabled={isLoading || isRateLimited}
              className="flex-1 px-5 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed transition-all text-sm dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
            />
            <Button
              type="submit"
              data-testid="chatbot-submit"
              disabled={!inputValue.trim() || isLoading || isRateLimited}
              loading={isLoading}
              className="px-6 py-3 flex items-center gap-2"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              <span>{t('common.submit')}</span>
            </Button>
          </form>

          <div className="mt-3 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="text-base">💡</span>
            <p className="flex-1">
              <span className="font-medium">{t('other.ipucu')}</span> Envanter durumu, ödünç işlemleri, 
              bakım talepleri ve sistem kullanımı hakkında detaylı sorular sorabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
