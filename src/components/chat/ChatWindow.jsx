import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Send, Paperclip, Smile, MoreVertical, Phone, Video, Search, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useConversationMessages } from '../../hooks/useBroadcasting';
import toast from 'react-hot-toast';

const ChatWindow = ({ conversation, onBack }) => {
  const [message, setMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch messages
  const { data: messagesData, isLoading } = useQuery(
    ['messages', conversation?.id],
    async () => {
      if (!conversation) return { data: { data: [] } };
      const response = await api.get(`/conversations/${conversation.id}/messages`);
      return response.data;
    },
    {
      enabled: !!conversation,
      refetchInterval: 5000,
    }
  );

  const messages = messagesData?.data?.data || [];

  // Send message mutation
  const sendMessageMutation = useMutation(
    async (messageData) => {
      const response = await api.post(`/conversations/${conversation.id}/messages`, messageData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        // Immediately add the new message to the local state
        queryClient.setQueryData(['messages', conversation.id], (oldData) => {
          if (!oldData?.data?.data) return oldData;
          return {
            ...oldData,
            data: {
              ...oldData.data,
              data: [...oldData.data.data, data.data]
            }
          };
        });
        
        // Also invalidate to ensure consistency
        queryClient.invalidateQueries(['messages', conversation.id]);
        queryClient.invalidateQueries(['conversations']);
        setMessage('');
        scrollToBottom();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send message');
      },
    }
  );

  // Real-time broadcasting
  useConversationMessages(conversation?.id, (data) => {
    if (data.type === 'new_message') {
      queryClient.invalidateQueries(['messages', conversation.id]);
      queryClient.invalidateQueries(['conversations']);
      scrollToBottom();
    }
  });

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Handle send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      content: message.trim(),
      type: 'text',
    });
  };

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle mobile keyboard appearance
  useEffect(() => {
    const handleResize = () => {
      // Scroll to bottom when keyboard appears/disappears on mobile
      setTimeout(scrollToBottom, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [scrollToBottom]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium mb-2">Select a conversation</p>
          <p className="text-sm">Choose a chat to start messaging</p>
        </div>
      </div>
    );
  }

  // Get conversation name and avatar
  const getConversationName = () => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }
    
    const otherUser = conversation.users.find(u => u.id !== user?.id);
    return otherUser?.name || 'Unknown User';
  };

  const getConversationAvatar = () => {
    if (conversation.type === 'group') {
      return conversation.avatar || null;
    }
    
    const otherUser = conversation.users.find(u => u.id !== user?.id);
    return otherUser?.profile?.avatar_url || null;
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header - Facebook Messenger style */}
      <div className="flex items-center p-3 sm:p-4 border-b border-gray-200 bg-white">
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors mr-3 touch-manipulation"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {getConversationAvatar() ? (
            <img
              src={getConversationAvatar()}
              alt={getConversationName()}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {getConversationName().charAt(0).toUpperCase()}
            </div>
          )}
          
          {/* Online indicator for private chats */}
          {conversation.type === 'private' && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 ml-3">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {getConversationName()}
          </h3>
          {typingUsers.size > 0 && (
            <p className="text-sm text-gray-500 italic">
              {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
            </p>
          )}
        </div>

        {/* Actions - Facebook Messenger style */}
        <div className="flex items-center space-x-1">
          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
            <Phone className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
            <Video className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages - Facebook Messenger style */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50 chat-messages">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-lg font-medium mb-2">No messages yet</p>
            <p className="text-sm text-center">Start the conversation by sending a message!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.user_id === user?.id;
            
            return (
                             <div
                 key={msg.id}
                 className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2 sm:mb-3`}
               >
                 <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[85%] sm:max-w-xs lg:max-w-md`}>
                   {/* Avatar for other users - Facebook Messenger style */}
                   {!isOwnMessage && (
                     <div className="flex-shrink-0 mr-2 mb-1">
                       {msg.user?.profile?.avatar_url ? (
                         <img
                           src={msg.user.profile.avatar_url}
                           alt={msg.user.name}
                           className="w-6 h-6 rounded-full object-cover"
                         />
                       ) : (
                         <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                           {msg.user?.name?.charAt(0).toUpperCase()}
                         </div>
                       )}
                     </div>
                   )}
                  
                                                        {/* Message bubble - Facebook Messenger style */}
                   <div
                     className={`px-3 py-2 shadow-sm ${
                       isOwnMessage
                         ? 'bg-blue-500 text-white ml-auto rounded-2xl rounded-br-md'
                         : 'bg-gray-200 text-gray-900 ml-0 rounded-2xl rounded-bl-md'
                     }`}
                   >
                     <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                       {msg.content}
                     </p>
                   </div>
                  
                                     {/* Message time - Facebook Messenger style */}
                   <div className={`text-xs text-gray-400 mt-1 ${
                     isOwnMessage ? 'text-right' : 'text-left'
                   }`}>
                     {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                   </div>
                 </div>
               </div>
            );
          })
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Facebook Messenger style */}
      <div className="p-3 sm:p-4 border-t border-gray-200 bg-white chat-input">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          {/* Message input */}
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Aa"
              rows="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-full resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-gray-100 focus:bg-white"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
          </div>
          
          {/* Send button - Facebook Messenger style */}
          <button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isLoading}
            className="p-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center shadow-sm"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
