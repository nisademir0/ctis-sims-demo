import apiClient from './axios';

/**
 * Chatbot API Services
 */

// Ask a question to the chatbot
export const askChatbot = async (question) => {
  // Backend expects 'query' not 'question'
  const { data } = await apiClient.post('/chat', { query: question });
  return data;
};

// Submit feedback for a chatbot response
export const submitChatbotFeedback = async (feedbackData) => {
  const { data } = await apiClient.post('/chat/feedback', feedbackData);
  return data;
};

// Get chat history
export const getChatHistory = async (params = {}) => {
  const { data } = await apiClient.get('/chat/history', { params });
  return data;
};

// Get chatbot analytics (Admin only)
export const getChatbotAnalytics = async (params = {}) => {
  const { data } = await apiClient.get('/chat/analytics', { params });
  return data;
};
