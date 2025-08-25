import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';

const Chat = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const { user } = useAuth();
  const location = useLocation();

  // Handle navigation from friends list
  useEffect(() => {
    if (location.state?.selectedConversationId && location.state?.conversation) {
      setSelectedConversation(location.state.conversation);
      // Clear the navigation state to prevent re-selection on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Please login to access chat</p>
        </div>
      </div>
    );
  }

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 chat-container">
      <div className="w-full max-w-7xl mx-auto h-screen">
        <div className="flex h-full bg-white rounded-none md:rounded-lg shadow-none md:shadow-lg overflow-hidden">
          {/* Chat List - Hidden on mobile when conversation is selected */}
          <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 ${
            selectedConversation ? 'hidden md:block' : 'block'
          }`}>
            <ChatList
              onSelectConversation={handleSelectConversation}
              selectedConversationId={selectedConversation?.id}
            />
          </div>

          {/* Chat Window */}
          <div className={`flex-1 ${
            selectedConversation ? 'block' : 'hidden md:block'
          }`}>
            <ChatWindow
              conversation={selectedConversation}
              onBack={handleBackToList}
            />
          </div>

          {/* Mobile: Show welcome message when no conversation selected */}
          {!selectedConversation && (
            <div className="md:hidden flex items-center justify-center h-full px-4">
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-lg font-medium mb-2">Select a conversation</p>
                <p className="text-sm text-gray-400">Choose a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
