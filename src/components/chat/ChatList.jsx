import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Search, MessageCircle, MoreVertical, Phone, Video, UserPlus } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const ChatList = ({ onSelectConversation, selectedConversationId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch conversations with search
  const { data: conversationsData, isLoading, error } = useQuery(
    ['conversations', searchQuery],
    async () => {
      if (searchQuery.trim()) {
        const response = await api.get(`/conversations/search?query=${encodeURIComponent(searchQuery)}`);
        return response.data;
      } else {
        const response = await api.get('/conversations');
        return response.data;
      }
    },
    {
      refetchInterval: 10000, // Refresh every 10 seconds
      staleTime: 5000,
    }
  );

  const conversations = conversationsData?.data || [];

  // Handle search input
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearching(query.trim().length > 0);
  };

  // Get conversation display name
  const getConversationName = (conversation) => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }
    
    // For private conversations, show the other user's name
    const otherUser = conversation.users.find(u => u.id !== user?.id);
    return otherUser?.name || 'Unknown User';
  };

  // Get conversation avatar
  const getConversationAvatar = (conversation) => {
    if (conversation.type === 'group') {
      return conversation.avatar || null;
    }
    
    const otherUser = conversation.users.find(u => u.id !== user?.id);
    return otherUser?.profile?.avatar_url || null;
  };

  // Get last message preview
  const getLastMessagePreview = (conversation) => {
    if (!conversation.lastMessage) return 'No messages yet';
    
    const message = conversation.lastMessage;
    if (message.type === 'image') return '📷 Image';
    if (message.type === 'video') return '🎥 Video';
    if (message.type === 'audio') return '🎵 Audio';
    if (message.type === 'file') return '📎 File';
    
    return message.content.length > 30 
      ? message.content.substring(0, 30) + '...' 
      : message.content;
  };

  // Get conversation time
  const getConversationTime = (conversation) => {
    if (conversation.lastMessage) {
      return formatDistanceToNow(new Date(conversation.lastMessage.created_at), { addSuffix: true });
    }
    return formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true });
  };

  // Check if conversation is unread
  const isUnread = (conversation) => {
    return conversation.unread_count > 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-600">
        <p>Error loading conversations</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
              <Video className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
              <Phone className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
              <UserPlus className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle className="h-16 w-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">
              {isSearching ? 'No conversations found' : 'No conversations yet'}
            </p>
            <p className="text-sm text-center">
              {isSearching 
                ? 'Try a different search term' 
                : 'Start a conversation with your friends!'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => {
              const isSelected = selectedConversationId === conversation.id;
              const hasUnread = isUnread(conversation);
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`flex items-center p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {getConversationAvatar(conversation) ? (
                      <img
                        src={getConversationAvatar(conversation)}
                        alt={getConversationName(conversation)}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {getConversationName(conversation).charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    {/* Online indicator for private chats */}
                    {conversation.type === 'private' && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 ml-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {getConversationName(conversation)}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {getConversationTime(conversation)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-sm truncate ${
                        hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'
                      }`}>
                        {getLastMessagePreview(conversation)}
                      </p>
                      
                      {hasUnread && (
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-full">
                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 ml-2">
                    <button className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
