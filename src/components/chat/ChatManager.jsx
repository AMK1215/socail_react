import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { MessageCircle, X } from 'lucide-react';
import FloatingChatBox from './FloatingChatBox';
import { useModal } from '../layout/Layout';

const ChatManager = () => {
  const [openChats, setOpenChats] = useState([]);
  const [showChatList, setShowChatList] = useState(false);
  const { user } = useAuth();
  const { isModalOpen } = useModal() || {};

  // Fetch user's conversations
  const { data: conversationsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await api.get('/conversations');
      return response.data;
    },
    enabled: !!user?.id,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Ensure conversations is always an array
  const conversations = Array.isArray(conversationsData?.data) ? conversationsData.data : [];

  // Open a new chat
  const openChat = (conversation) => {
    if (!openChats.find(chat => chat.id === conversation.id)) {
      setOpenChats(prev => [...prev, conversation]);
    }
    setShowChatList(false);
  };

  // Close a specific chat
  const closeChat = (conversationId) => {
    console.log('Closing chat with ID:', conversationId);
    setOpenChats(prev => {
      const updated = prev.filter(chat => chat.id !== conversationId);
      console.log('Updated open chats:', updated);
      return updated;
    });
  };

  // Close all chats
  const closeAllChats = () => {
    setOpenChats([]);
  };

  // Get unread message count for a conversation
  const getUnreadCount = (conversation) => {
    return conversation.unread_count || 0;
  };

  // Get total unread messages
  const getTotalUnreadCount = () => {
    return conversations.reduce((total, conv) => total + getUnreadCount(conv), 0);
  };

  if (!user) return null;

  // Hide chat when modal is open
  if (isModalOpen) return null;

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-3 left-3 sm:bottom-4 sm:left-4 z-50">
        <button
          onClick={() => setShowChatList(!showChatList)}
          className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sm:p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          {getTotalUnreadCount() > 0 && (
            <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold">
              {getTotalUnreadCount() > 99 ? '99+' : getTotalUnreadCount()}
            </span>
          )}
        </button>

        {/* Chat List Dropdown */}
        {showChatList && (
          <div className="absolute bottom-14 sm:bottom-16 left-0 bg-white rounded-lg shadow-2xl border border-gray-200 w-72 sm:w-80 max-h-80 sm:max-h-96 overflow-hidden">
            <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Messages</h3>
                <button
                  onClick={closeAllChats}
                  className="text-blue-100 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs">Start chatting with friends!</p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  if (!conversation || !conversation.id) return null;
                  
                  const unreadCount = getUnreadCount(conversation);
                  const isOpen = openChats.find(chat => chat.id === conversation.id);
                  
                  return (
                    <div
                      key={conversation.id}
                      className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                        isOpen ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => openChat(conversation)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          {conversation.type === 'group' ? (
                            <span className="text-white font-bold text-sm">
                              {conversation.name?.charAt(0).toUpperCase() || 'G'}
                            </span>
                          ) : (
                            <span className="text-white font-bold text-sm">
                              {conversation.users?.find(u => u.id !== user.id)?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {conversation.type === 'group' 
                              ? conversation.name || 'Group Chat'
                              : conversation.users?.find(u => u.id !== user.id)?.name || 'Unknown User'
                            }
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {conversation.lastMessage?.content || 'No messages yet'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                          {isOpen && (
                            <span className="text-blue-600 text-xs font-medium">Open</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }).filter(Boolean)
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Chat Boxes */}
      {openChats.map((conversation) => {
        if (!conversation || !conversation.id) return null;
        
        return (
          <FloatingChatBox
            key={conversation.id}
            conversation={conversation}
            onClose={() => closeChat(conversation.id)}
            onMaximize={() => {
              // You can implement maximize functionality here
              console.log('Maximize chat:', conversation.id);
            }}
          />
        );
      }).filter(Boolean)}
    </>
  );
};

export default ChatManager;
