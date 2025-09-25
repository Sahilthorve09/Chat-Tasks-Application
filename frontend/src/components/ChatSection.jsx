import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ChatSection = () => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [currentRoom, setCurrentRoom] = useState('general');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  
  const { sendMessage, onMessage, offMessage, onMessageDeleted, offMessageDeleted } = useSocket();
  const { user } = useAuth();

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [currentRoom]);

  // Set up socket message listener and deletion listener
  useEffect(() => {
    const handleNewMessage = (message) => {
      setMessages(prev => {
        const idA = message._id ?? message.id;
        if (prev.some(m => (m._id ?? m.id) === idA)) return prev;
        return [...prev, message];
      });
      scrollToBottom();
    };

    const handleDeleted = ({ id }) => {
      setMessages(prev => prev.filter(m => (m._id ?? m.id) !== id));
    };

    onMessage(handleNewMessage);
    onMessageDeleted(handleDeleted);

    return () => {
      offMessage(handleNewMessage);
      offMessageDeleted(handleDeleted);
    };
  }, [onMessage, offMessage, onMessageDeleted, offMessageDeleted]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const messageHistory = await chatAPI.getMessages(currentRoom);
      setMessages(messageHistory);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (currentMessage.trim()) {
      sendMessage(currentMessage.trim(), currentRoom);
      setCurrentMessage('');
    }
  };

  const handleDeleteMessage = async (message) => {
    try {
      const id = message._id ?? message.id;
      await chatAPI.deleteMessage(id);
      setMessages(prev => prev.filter(m => (m._id ?? m.id) !== id));
    } catch (error) {
      console.error('Failed to delete message:', error.response?.data || error.message);
      // Optionally show a toast here
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isMyMessage = (message) => {
    return message.sender._id === user?.id || message.sender.id === user?.id;
  };

  const shouldShowDate = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.createdAt || currentMsg.timestamp).toDateString();
    const prevDate = new Date(prevMsg.createdAt || prevMsg.timestamp).toDateString();
    return currentDate !== prevDate;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {currentRoom === 'general' ? 'General Chat' : `#${currentRoom}`}
            </h3>
            <p className="text-sm text-gray-500">Real-time chat room</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></span>
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const showDate = shouldShowDate(message, messages[index - 1]);
            return (
              <div key={message._id || index}>
                {showDate && (
                  <div className="text-center py-2">
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600">
                      {formatDate(message.createdAt || message.timestamp)}
                    </span>
                  </div>
                )}
<div className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isMyMessage(message)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {!isMyMessage(message) && (
                      <p className="text-xs font-medium mb-1 opacity-75">
                        {message.sender.username}
                      </p>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isMyMessage(message) ? 'text-indigo-200' : 'text-gray-500'
                    }`}>
                      {formatTime(message.createdAt || message.timestamp)}
                    </p>
                    {isMyMessage(message) && (
                      <button
                        onClick={() => handleDeleteMessage(message)}
                        className={`mt-2 text-xs underline ${isMyMessage(message) ? 'text-indigo-200 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                        title="Delete message"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!currentMessage.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatSection;