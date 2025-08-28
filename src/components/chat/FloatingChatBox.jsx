import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { 
  MessageCircle, 
  X, 
  Minimize2, 
  Maximize2, 
  Send, 
  MoreVertical,
  Phone,
  Video,
  Search,
  Smile
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import broadcastingService from '../../services/broadcasting';

const FloatingChatBox = ({ conversation, onClose, onMaximize }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch messages for the conversation
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', conversation?.id],
    queryFn: async () => {
      if (!conversation?.id) return { data: [] };
      const response = await api.get(`/conversations/${conversation.id}/messages`);
      return response.data;
    },
    enabled: !!conversation?.id,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const response = await api.post(`/conversations/${conversation.id}/messages`, messageData);
      return response.data;
    },
    onSuccess: (data) => {
      // Immediately add the new message to the local state for instant display
      queryClient.setQueryData(['messages', conversation.id], (oldData) => {
        if (!oldData?.data) return oldData;
        
        // Handle both paginated and non-paginated response structures
        const currentMessages = Array.isArray(oldData.data.data) 
          ? oldData.data.data 
          : Array.isArray(oldData.data) 
            ? oldData.data 
            : [];
            
        const newMessage = data.data;
        
        // Create updated data structure
        if (oldData.data.data) {
          // Paginated structure
          return {
            ...oldData,
            data: {
              ...oldData.data,
              data: [...currentMessages, newMessage]
            }
          };
        } else {
          // Direct array structure
          return {
            ...oldData,
            data: [...currentMessages, newMessage]
          };
        }
      });
      
      setMessage('');
      // Also invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['messages', conversation?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    },
  });

  // Handle send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !conversation?.id) return;

    sendMessageMutation.mutate({
      content: message.trim(),
      type: 'text'
    });
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!conversation?.id) return;
    
    if (!isTyping) {
      setIsTyping(true);
      api.post(`/conversations/${conversation.id}/typing`).catch(error => {
        console.error('Failed to send typing indicator:', error);
      });
    }

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      setIsTyping(false);
      api.post(`/conversations/${conversation.id}/stop-typing`).catch(error => {
        console.error('Failed to stop typing indicator:', error);
      });
    }, 1000);

    setTypingTimeout(timeout);
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesData]);

  // Set up real-time message listening
  useEffect(() => {
    if (conversation?.id && user?.id) {
      const channel = broadcastingService.subscribeToPrivateChannel(
        `conversation.${conversation.id}`,
        'message.new',
        (data) => {
          console.log('New message received:', data);
          queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      );

      return () => {
        broadcastingService.unsubscribeFromChannel(`conversation.${conversation.id}`);
      };
    }
  }, [conversation?.id, user?.id, queryClient]);

  // Get conversation name
  const getConversationName = () => {
    if (conversation?.type === 'group') {
      return conversation.name || 'Group Chat';
    }
    
    const otherUser = conversation?.users?.find(u => u.id !== user?.id);
    return otherUser?.name || 'Chat';
  };

  // Get conversation avatar
  const getConversationAvatar = () => {
    if (conversation?.type === 'group') {
      return conversation.avatar || null;
    }
    
    const otherUser = conversation?.users?.find(u => u.id !== user?.id);
    return otherUser?.profile?.avatar_url || null;
  };

  // Ensure messages is always an array - handle pagination structure
  const messages = Array.isArray(messagesData?.data?.data) 
    ? messagesData.data.data 
    : Array.isArray(messagesData?.data) 
      ? messagesData.data 
      : [];



  if (!conversation) return null;

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50 animate-fade-in-up">
      {/* Minimized Chat Box */}
      {isMinimized && (
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 cursor-pointer hover:shadow-3xl transition-all duration-300 transform hover:scale-105 active:scale-95">
          <div 
            className="flex items-center space-x-3 p-3"
            onClick={() => setIsMinimized(false)}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              {getConversationAvatar() ? (
                <img
                  src={getConversationAvatar()}
                  alt={getConversationName()}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-sm">
                  {getConversationName()?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{getConversationName()}</p>
              <p className="text-xs text-gray-500">
                {messages.length > 0 ? `${messages.length} messages` : 'No messages yet'}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Full Chat Box */}
      {!isMinimized && (
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-72 sm:w-80 h-80 sm:h-96 flex flex-col animate-slide-in-right">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                {getConversationAvatar() ? (
                  <img
                    src={getConversationAvatar()}
                    alt={getConversationName()}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-blue-600 font-bold text-sm">
                    {getConversationName()?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium text-sm">{getConversationName()}</p>
                <p className="text-xs text-blue-100">
                  {isTyping ? 'typing...' : 'online'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button className="p-1 hover:bg-white/20 rounded transition-colors">
                <Phone className="w-3 h-3" />
              </button>
              <button className="p-1 hover:bg-white/20 rounded transition-colors">
                <Video className="w-3 h-3" />
              </button>
              <button 
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                if (!msg || !msg.id) return null;
                
                const isOwnMessage = msg.user_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg shadow-sm ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{msg.content || 'No content'}</p>
                      <p className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : 'Now'}
                      </p>
                    </div>
                  </div>
                );
              }).filter(Boolean)
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-3 border-t border-gray-200 bg-white rounded-b-lg">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:scale-110"
              >
                <Smile className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                disabled={sendMessageMutation.isLoading}
              />
              <button
                type="submit"
                disabled={!message.trim() || sendMessageMutation.isLoading}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
              >
                {sendMessageMutation.isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingChatBox;
