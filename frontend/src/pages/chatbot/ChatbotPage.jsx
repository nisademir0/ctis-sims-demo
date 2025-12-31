import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { askChatbot, submitChatbotFeedback } from '../../api/chatbot';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { 
  HandThumbUpIcon, 
  HandThumbDownIcon, 
  InformationCircleIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  CodeBracketIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { 
  HandThumbUpIcon as HandThumbUpSolidIcon, 
  HandThumbDownIcon as HandThumbDownSolidIcon 
} from '@heroicons/react/24/solid';
import useToast from '../../hooks/useToast';

// LocalStorage key for chat history
const CHAT_STORAGE_KEY = 'ctis_chatbot_history';
const CHAT_EXPIRY_HOURS = 24; // Chat history expires after 24 hours

/**
 * Interactive Table Component with filtering
 */
const InteractiveTable = ({ data, columns }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal < bVal ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="my-3 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Search Bar */}
      <div className="bg-gray-50 border-b border-gray-200 dark:border-gray-700 px-4 py-3 dark:bg-gray-950 transition-colors duration-300">
        <div className="flex items-center gap-2">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Tabloda ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              Temizle
            </button>
          )}
        </div>
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {filteredData.length} / {data.length} kayıt gösteriliyor
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 sticky top-0 dark:bg-gray-800 transition-colors duration-300">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(col.key)}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortConfig.key === col.key && (
                      <span className="text-blue-600 dark:text-blue-400">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-800 transition-colors duration-300">
            {sortedData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-4 py-3 text-sm text-gray-800 dark:text-gray-100 whitespace-nowrap transition-colors">
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FunnelIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('other.sonuc_bulunamadi')}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Parse table from text (markdown or plain text)
 */
const parseTable = (text) => {
  // Try to find markdown table pattern
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  // Check if it looks like a markdown table
  const hasTableSeparator = lines.some(line => /^[|\s]*[-:\s]+[|\s]*$/.test(line));
  
  if (!hasTableSeparator) return null;
  
  const tableLines = [];
  let inTable = false;
  
  for (const line of lines) {
    if (line.startsWith('|') || /^[|\s]*[-:\s]+[|\s]*$/.test(line)) {
      inTable = true;
      tableLines.push(line);
    } else if (inTable) {
      break;
    }
  }
  
  if (tableLines.length < 3) return null; // Need at least header, separator, and one row
  
  // Parse header
  const headerLine = tableLines[0];
  const columns = headerLine
    .split('|')
    .map(h => h.trim())
    .filter(h => h)
    .map((label, idx) => ({ key: `col${idx}`, label }));
  
  // Parse data rows (skip header and separator)
  const data = tableLines.slice(2).map(line => {
    const values = line.split('|').map(v => v.trim()).filter(v => v);
    const row = {};
    columns.forEach((col, idx) => {
      row[col.key] = values[idx] || '';
    });
    return row;
  });
  
  return { columns, data };
};

/**
 * Format bot response with tables, code blocks, and markdown
 */
const formatBotMessage = (text) => {
  if (!text) return [{ type: 'text', content: '' }];

  const parts = [];
  let currentText = text;
  
  // First check for tables
  const tableMatch = parseTable(currentText);
  if (tableMatch) {
    // Find table position in text
    const tableLines = currentText.split('\n').filter(l => l.trim().startsWith('|'));
    const tableText = tableLines.join('\n');
    const tableIndex = currentText.indexOf(tableLines[0]);
    
    if (tableIndex > 0) {
      parts.push({ type: 'text', content: currentText.slice(0, tableIndex) });
    }
    
    parts.push({ type: 'table', ...tableMatch });
    
    const tableEndIndex = tableIndex + tableText.length;
    if (tableEndIndex < currentText.length) {
      currentText = currentText.slice(tableEndIndex);
    } else {
      currentText = '';
    }
  }
  
  // Then check for code blocks
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  
  while ((match = codeBlockRegex.exec(currentText)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: currentText.slice(lastIndex, match.index) });
    }
    parts.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2].trim()
    });
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < currentText.length) {
    parts.push({ type: 'text', content: currentText.slice(lastIndex) });
  }
  
  if (parts.length === 0) {
    parts.push({ type: 'text', content: currentText });
  }
  
  return parts;
};

/**
 * Render formatted text with markdown
 */
const renderFormattedText = (text) => {
  let formatted = text;
  
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
  formatted = formatted.replace(/\*([^*]+?)\*/g, '<em class="italic">$1</em>');
  formatted = formatted.replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 bg-gray-800 text-green-400 rounded text-xs font-mono">$1</code>');
  formatted = formatted.replace(/^[-*]\s+(.+)$/gm, '<div class="flex gap-2 my-1"><span class="text-blue-600">•</span><span>$1</span></div>');
  formatted = formatted.replace(/\[(.+?)\]\((.+?)\)/g, '<span class="text-blue-600 font-medium underline">$1</span>');
  formatted = formatted.replace(/^###\s+(.+)$/gm, '<h3 class="text-sm font-bold mt-3 mb-1 text-gray-900">$1</h3>');
  formatted = formatted.replace(/^##\s+(.+)$/gm, '<h2 class="text-base font-bold mt-4 mb-2 text-gray-900">$1</h2>');
  formatted = formatted.replace(/^#\s+(.+)$/gm, '<h1 class="text-lg font-bold mt-4 mb-2 text-gray-900">$1</h1>');
  formatted = formatted.replace(/\n/g, '<br/>');
  
  return formatted;
};

/**
 * Save chat history to localStorage
 */
const saveChatHistory = (messages) => {
  try {
    const data = {
      messages,
      timestamp: Date.now(),
      expiresAt: Date.now() + (CHAT_EXPIRY_HOURS * 60 * 60 * 1000)
    };
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
};

/**
 * Load chat history from localStorage
 */
const loadChatHistory = () => {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    
    // Check if expired
    if (Date.now() > data.expiresAt) {
      localStorage.removeItem(CHAT_STORAGE_KEY);
      return null;
    }
    
    return data.messages;
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return null;
  }
};

/**
 * Clear chat history from localStorage
 */
const clearChatHistory = () => {
  localStorage.removeItem(CHAT_STORAGE_KEY);
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
  const [showSql, setShowSql] = useState({});
  const [showSqlEditModal, setShowSqlEditModal] = useState(false);
  const [editingSqlQuery, setEditingSqlQuery] = useState('');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat history on mount
  useEffect(() => {
    const savedMessages = loadChatHistory();
    
    if (savedMessages && savedMessages.length > 0) {
      setMessages(savedMessages);
      toast.info(t('other.onceki_sohbet_yuklendi'));
    } else {
      // Set welcome message
      const welcomeMsg = {
        id: 'welcome',
        type: 'bot',
        text: `Merhaba **${user?.name}**! 👋\n\nCTIS Envanter Yönetim Sistemi asistanıyım. Size aşağıdaki konularda yardımcı olabilirim:\n\n- Envanter durumu sorguları\n- Ödünç işlemleri\n- Bakım talepleri\n- İstatistiksel analizler\n\nSize nasıl yardımcı olabilirim?`,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMsg]);
      saveChatHistory([welcomeMsg]);
    }
  }, [user]);

  // Save chat history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      
      console.log('🔵 Chatbot response:', {
        hasTables: !!(response.tables && response.tables.length > 0),
        tableCount: response.tables?.length || 0,
        firstTableRows: response.tables?.[0]?.rows?.length || 0,
        response: response.response?.substring(0, 100)
      });
      
      const responseText = response.response || response.answer || response.message || t('other.yanit_alinamadi');
      
      // CRITICAL: Backend sends structured tables array - DON'T convert to markdown
      // Store tables separately so InteractiveTable component can render them properly
      const botMessage = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        text: responseText, // Keep text simple - tables rendered separately
        queryId: response.query_id || response.id,
        timestamp: response.timestamp || new Date().toISOString(),
        isFallback: response.is_fallback || response.fallback || false,
        confidence: response.confidence,
        feedback: null,
        metadata: response.query_metadata || {
          duration_ms: response.duration_ms,
          query_type: response.query_type,
          result_count: response.result_count,
          sql_query: response.sql
        },
        originalQuery: query,
        // IMPORTANT: Store tables array from backend for rendering
        tables: response.tables || [],
      };

      console.log('🔵 Bot message created with tables:', botMessage.tables?.length || 0);

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

  const toggleSql = (messageId) => {
    setShowSql(prev => ({ ...prev, [messageId]: !prev[messageId] }));
  };

  const handleRefreshQuery = async (originalQuery, messageId) => {
    if (!originalQuery) {
      toast.error('Sorgu bilgisi bulunamadı');
      return;
    }

    try {
      setIsLoading(true);

      const result = await askChatbot(originalQuery);

      const botMessage = {
        id: `msg-${Date.now()}-refresh`,
        type: 'bot',
        text: result.response,
        timestamp: new Date().toISOString(),
        queryId: result.query_id,
        metadata: result.metadata,
        originalQuery: originalQuery,
        confidence: result.confidence,
        isRefreshed: true,
      };

      setMessages((prev) => {
        const newMessages = [...prev, botMessage];
        saveChatHistory(newMessages);
        return newMessages;
      });

      toast.success('Sorgu yenilendi!');
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Sorgu yenilenemedi: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleSqlEdit = (sql) => {
    setEditingSqlQuery(sql);
    setShowSqlEditModal(true);
  };

  const handleExecuteCustomSql = async () => {
    if (!editingSqlQuery.trim()) {
      toast.error('SQL sorgusu boş olamaz');
      return;
    }

    // Security check: Only allow SELECT queries
    const trimmedSql = editingSqlQuery.trim().toUpperCase();
    if (!trimmedSql.startsWith('SELECT')) {
      toast.error('🚫 Güvenlik: Sadece SELECT sorguları çalıştırılabilir');
      return;
    }

    try {
      setIsLoading(true);
      setShowSqlEditModal(false);

      // Use chatbot API with custom SQL flag
      const result = await askChatbot(`EXECUTE_SQL: ${editingSqlQuery}`);

      const botMessage = {
        id: `msg-${Date.now()}-custom`,
        type: 'bot',
        text: result.response,
        timestamp: new Date().toISOString(),
        queryId: result.query_id,
        metadata: result.metadata,
        originalQuery: editingSqlQuery,
        confidence: result.confidence,
        isCustomSql: true,
      };

      setMessages((prev) => {
        const newMessages = [...prev, botMessage];
        saveChatHistory(newMessages);
        return newMessages;
      });

      toast.success('SQL sorgusu çalıştırıldı!');
    } catch (error) {
      console.error('Custom SQL error:', error);
      toast.error('SQL hatası: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
      setEditingSqlQuery('');
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleClearHistory = () => {
    if (confirm(t('other.tum_sohbet_gecmisi_silinecek_emin_misiniz'))) {
      const welcomeMsg = {
        id: 'welcome',
        type: 'bot',
        text: `Merhaba **${user?.name}**! 👋\n\nSohbet geçmişi temizlendi. Yeni bir konuşmaya başlayabilirsiniz.`,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMsg]);
      clearChatHistory();
      toast.success(t('other.sohbet_gecmisi_temizlendi'));
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* SQL Edit Modal */}
      {showSqlEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CodeBracketIcon className="w-5 h-5 text-blue-600" />
                  SQL Sorgusu Düzenle
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  🔒 Güvenlik: Sadece SELECT sorguları çalıştırılabilir
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSqlEditModal(false);
                  setEditingSqlQuery('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto">
              <textarea
                value={editingSqlQuery}
                onChange={(e) => setEditingSqlQuery(e.target.value)}
                placeholder="SELECT * FROM items WHERE status = 'available'"
                className="w-full h-64 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-gray-50 dark:bg-gray-900 dark:text-gray-200 resize-none"
                spellCheck={false}
              />
              
              <div className="mt-4 bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 p-3 rounded-r">
                <p className="text-xs text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                  <span className="text-base">⚠️</span>
                  <span>
                    <strong>Uyarı:</strong> Bu özellik ileri seviye kullanıcılar içindir. 
                    Yanlış SQL sorguları hatalara neden olabilir. Sadece SELECT sorguları güvenlik 
                    nedeniyle çalıştırılabilir (INSERT, UPDATE, DELETE engellenmiştir).
                  </span>
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowSqlEditModal(false);
                  setEditingSqlQuery('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleExecuteCustomSql}
                disabled={!editingSqlQuery.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                Çalıştır
              </button>
            </div>
          </div>
        </div>
      )}

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
        <button
          onClick={handleClearHistory}
          className="text-xs text-gray-500 hover:text-red-600 transition-colors px-3 py-1.5 border border-gray-300 rounded-lg hover:border-red-300 dark:text-gray-400"
        >
          Geçmişi Temizle
        </button>
      </div>

      {/* Chat Card */}
      <Card className="flex flex-col shadow-lg dark:shadow-none" style={{ height: 'calc(100vh - 220px)', maxHeight: 'calc(100vh - 220px)' }}>
        {/* Messages Area with Fixed Scrollbar */}
        <div 
          ref={chatContainerRef}
          className="flex-1 p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 overflow-y-auto custom-scrollbar transition-colors duration-300"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgb(156, 163, 175) rgb(31, 41, 55)',
            maxHeight: 'calc(100vh - 360px)'
          }}
        >
          <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgb(31, 41, 55);
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgb(75, 85, 99);
              border-radius: 4px;
              transition: background 0.2s;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgb(107, 114, 128);
            }
            @media (prefers-color-scheme: light) {
              .custom-scrollbar::-webkit-scrollbar-track {
                background: #EDF2F7;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #CBD5E0;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #A0AEC0;
              }
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
                max-height: 1000px;
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
                <div className={`max-w-[85%] rounded-2xl rounded-tl-sm shadow-md overflow-hidden ${
                  message.isError
                    ? 'bg-red-50 border-2 border-red-200'
                    : 'bg-white border border-gray-200'
                }`}>
                  {/* Message Header */}
                  <div className={`px-5 py-3 flex items-center justify-between ${
                    message.isError ? 'bg-red-100 border-b border-red-200' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${message.isError ? 'bg-red-200' : 'bg-white shadow-sm'}`}>
                        <SparklesIcon className={`w-4 h-4 ${message.isError ? 'text-red-600' : 'text-blue-600'}`} />
                      </div>
                      <span className={`text-xs font-semibold ${message.isError ? 'text-red-900' : 'text-gray-700'}`}>
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
                            ? 'bg-blue-100 text-blue-600' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
                        }`}
                        title={t('other.detaylari_goster_gizle')}
                      >
                        <InformationCircleIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="px-5 py-4">
                    {/* Render text with markdown formatting */}
                    {formatBotMessage(message.text).map((part, idx) => (
                      <div key={idx}>
                        {part.type === 'text' ? (
                          <div 
                            className="text-sm text-gray-800 leading-relaxed dark:text-gray-200"
                            dangerouslySetInnerHTML={{ __html: renderFormattedText(part.content) }}
                          />
                        ) : part.type === 'table' ? (
                          <InteractiveTable 
                            data={part.data} 
                            columns={part.columns}
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
                            <pre className="bg-gray-900 p-4 overflow-x-auto max-h-96">
                              <code className="text-green-400 font-mono text-xs leading-relaxed">{part.content}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* IMPORTANT: Render structured tables from backend */}
                    {message.tables && message.tables.length > 0 && (
                      <>
                        {message.tables.map((table, tableIdx) => {
                          if (!table.rows || table.rows.length === 0) return null;
                          
                          // Convert backend table format to InteractiveTable format
                          const columns = table.headers.map((header, idx) => ({
                            key: header,
                            label: header
                          }));
                          
                          return (
                            <InteractiveTable
                              key={tableIdx}
                              data={table.rows}
                              columns={columns}
                            />
                          );
                        })}
                      </>
                    )}

                    {/* Metadata Info */}
                    {showInfo[message.id] && message.metadata && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 animate-slideUp dark:border-gray-700">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-850 rounded-lg p-4 text-xs border border-blue-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
                          <p className="font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2 text-sm">
                            <InformationCircleIcon className="w-5 h-5" />
                            Sorgu Detayları
                          </p>
                          
                          {message.originalQuery && (
                            <div className="mb-3 pb-3 border-b border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg p-3">
                              <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">📝 Sorgu:</span>
                              <p className="text-gray-900 dark:text-gray-100 italic font-medium">"{message.originalQuery}"</p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            {message.metadata.duration_ms && (
                              <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg p-2.5">
                                <ClockIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                <div className="flex-1">
                                  <span className="text-gray-600 dark:text-gray-400 block text-xs">{t('other.yanit')}</span>
                                  <span className="font-bold text-gray-900 dark:text-gray-100">
                                    {(message.metadata.duration_ms / 1000).toFixed(2)}s
                                  </span>
                                </div>
                              </div>
                            )}

                            {message.metadata.result_count !== undefined && (
                              <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg p-2.5">
                                {message.metadata.result_count > 0 ? (
                                  <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                ) : (
                                  <XCircleIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                  <span className="text-gray-600 dark:text-gray-400 block text-xs">{t('other.sonuc')}</span>
                                  <span className="font-bold text-gray-900 dark:text-gray-100">
                                    {message.metadata.result_count} kayıt
                                  </span>
                                </div>
                              </div>
                            )}

                            {message.metadata.query_type && (
                              <div className="col-span-2 flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg p-2.5">
                                <span className="text-gray-600 dark:text-gray-400 text-xs">{t('other.tur')}</span>
                                <span className="inline-flex items-center font-semibold rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 text-blue-800 dark:text-blue-200 px-3 py-1 text-xs border border-blue-200 dark:border-blue-800">
                                  {message.metadata.query_type}
                                </span>
                              </div>
                            )}

                            {message.confidence && (
                              <div className="col-span-2 flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg p-2.5">
                                <span className="text-gray-600 dark:text-gray-400 text-xs">{t('other.guven_skoru')}</span>
                                <span className={`font-bold text-sm ${
                                  message.confidence >= 0.7 ? 'text-green-600 dark:text-green-400' :
                                  message.confidence >= 0.5 ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-red-600 dark:text-red-400'
                                }`}>
                                  {(message.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                            )}
                          </div>

                          {/* SQL Query Display */}
                          {message.metadata.sql_query && (
                            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                <button
                                  onClick={() => toggleSql(message.id)}
                                  className="text-xs font-bold text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1.5 transition-colors"
                                >
                                  <CodeBracketIcon className="w-4 h-4" />
                                  {showSql[message.id] ? 'SQL Sorgusunu Gizle' : 'SQL Sorgusunu Göster'}
                                </button>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleRefreshQuery(message.originalQuery, message.id)}
                                    disabled={isLoading}
                                    className="text-xs px-2.5 py-1.5 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-1.5 disabled:opacity-50 font-medium shadow-sm"
                                    title="Sorguyu yenile"
                                  >
                                    <ArrowPathIcon className="w-3.5 h-3.5" />
                                    Yenile
                                  </button>
                                  <button
                                    onClick={() => handleSqlEdit(message.metadata.sql_query)}
                                    className="text-xs px-2.5 py-1.5 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors flex items-center gap-1.5 font-medium shadow-sm"
                                    title="SQL'i düzenle"
                                  >
                                    <PencilSquareIcon className="w-3.5 h-3.5" />
                                    Düzenle
                                  </button>
                                </div>
                              </div>

                              {showSql[message.id] && (
                                <div className="mt-2 rounded-lg overflow-hidden border-2 border-gray-700 dark:border-gray-600 shadow-lg">
                                  <div className="bg-gray-800 dark:bg-gray-950 px-3 py-2 flex items-center justify-between border-b border-gray-700 dark:border-gray-600">
                                    <span className="text-xs font-mono text-gray-300 dark:text-gray-400 uppercase font-bold">SQL Query</span>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(message.metadata.sql_query);
                                        toast.success('SQL kopyalandı!');
                                      }}
                                      className="text-xs text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors px-2 py-1 hover:bg-gray-700 dark:hover:bg-gray-800 rounded font-medium"
                                    >
                                      📋 Kopyala
                                    </button>
                                  </div>
                                  <pre className="bg-gray-900 dark:bg-black p-4 overflow-x-auto max-h-64">
                                    <code className="text-green-400 dark:text-green-300 font-mono text-xs leading-relaxed">
                                      {message.metadata.sql_query}
                                    </code>
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
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
        <div className="border-t-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
          {isRateLimited && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 rounded-r-lg flex items-start gap-2 animate-fadeIn">
              <span className="text-yellow-600 dark:text-yellow-500 text-lg">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">{t('chatbot.ok_fazla_sorgu_g_nderdiniz')}</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">{t('other.lutfen_birkac_dakika_bekleyin_ve_tekrar_deneyin')}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('chatbot.sorunuzu_buraya_yaz_n_rn_ka_adet_masa_var')}
              disabled={isLoading || isRateLimited}
              data-testid="chatbot-input"
              className="flex-1 px-5 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed transition-all text-sm bg-white dark:bg-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading || isRateLimited}
              loading={isLoading}
              data-testid="chatbot-submit"
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
              Sohbet geçmişiniz 24 saat boyunca saklanır.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatbotPage;
