import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Clock, Check, X, MessageCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import broadcastingService from '../../services/broadcasting';
import { useAuth } from '../../contexts/AuthContext';

const FriendsList = ({ userId }) => {
  const [activeTab, setActiveTab] = useState('friends');
  const [checkingConversation, setCheckingConversation] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Add notification function
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Set up real-time friend request updates
  useEffect(() => {
    if (user?.id) {
      // Listen for new friend requests
      const channel = broadcastingService.subscribeToPrivateChannel(
        `user.${user.id}`,
        'friendship.request_received',
        (data) => {
          console.log('New friend request received:', data);
          // Refresh pending requests
          queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
          
          // Show notification
          const userName = data.user?.name || 'Someone';
          addNotification(`New friend request from ${userName}!`, 'success');
          
          // Switch to pending tab to show the new request
          setActiveTab('pending');
        }
      );

      // Listen for friendship status changes
      const friendshipChannel = broadcastingService.subscribeToPrivateChannel(
        `user.${user.id}`,
        'friendship.status_changed',
        (data) => {
          console.log('Friendship status changed:', data);
          // Refresh friends list and pending requests
          queryClient.invalidateQueries({ queryKey: ['friends', userId] });
          queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
          
          // Show notification
          addNotification('Friendship status updated!', 'info');
        }
      );

      return () => {
        broadcastingService.unsubscribeFromChannel(`user.${user.id}`);
        broadcastingService.unsubscribeFromChannel(`user.${user.id}`);
      };
    }
  }, [user?.id, userId, queryClient]);

  // Accept friend request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (friendshipId) => {
      const response = await api.put(`/friendships/${friendshipId}`, { action: 'accept' });
      return response.data;
    },
    onSuccess: (data, friendshipId) => {
      // Get the friendship data to extract user info
      const acceptedRequest = pendingData?.data?.find(req => req.id === friendshipId);
      
      if (acceptedRequest) {
        // Optimistically update the friends list by adding the accepted user
        queryClient.setQueryData(['friends', userId], (oldData) => {
          if (!oldData?.data?.friends?.data) return oldData;
          
          const newFriendsList = {
            ...oldData,
            data: {
              ...oldData.data,
              friends: {
                ...oldData.data.friends,
                data: [
                  acceptedRequest.user, // Add the accepted user to friends list
                  ...oldData.data.friends.data
                ]
              }
            }
          };
          
          return newFriendsList;
        });

        // Remove the accepted request from pending requests
        queryClient.setQueryData(['pending-requests'], (oldData) => {
          if (!oldData?.data) return oldData;
          
          return {
            ...oldData,
            data: oldData.data.filter(req => req.id !== friendshipId)
          };
        });

        // Also invalidate to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ['friends', userId] });
        queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
        
        // Show success message with the user's name
        const userName = acceptedRequest.user?.name || 'Friend';
        toast.success(`${userName} is now your friend!`);
        
        // Automatically switch to friends tab to show the new friend
        setActiveTab('friends');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to accept friend request');
    },
  });

  // Reject friend request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async (friendshipId) => {
      const response = await api.put(`/friendships/${friendshipId}`, { action: 'reject' });
      return response.data;
    },
    onSuccess: (data, friendshipId) => {
      // Get the friendship data to extract user info
      const rejectedRequest = pendingData?.data?.find(req => req.id === friendshipId);
      
      if (rejectedRequest) {
        // Optimistically remove the rejected request from pending requests
        queryClient.setQueryData(['pending-requests'], (oldData) => {
          if (!oldData?.data) return oldData;
          
          return {
            ...oldData,
            data: oldData.data.filter(req => req.id !== friendshipId)
          };
        });

        // Also invalidate to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
        
        // Show success message with the user's name
        const userName = rejectedRequest.user?.name || 'Friend request';
        toast.success(`${userName} rejected`);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reject friend request');
    },
  });

  const handleAcceptRequest = (friendshipId) => {
    acceptRequestMutation.mutate(friendshipId);
  };

  const handleRejectRequest = (friendshipId) => {
    rejectRequestMutation.mutate(friendshipId);
  };

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async (targetUserId) => {
      console.log('🚀 FriendsList: Sending friend request to user:', targetUserId);
      const response = await api.post(`/friends/${targetUserId}`);
      console.log('✅ FriendsList: Friend request response:', response.data);
      return response.data;
    },
    onSuccess: (data, targetUserId) => {
      console.log('🎉 FriendsList: Friend request successful:', data);
      queryClient.invalidateQueries({ queryKey: ['friends', userId] });
      queryClient.invalidateQueries({ queryKey: ['suggested-friends'] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
      queryClient.invalidateQueries({ queryKey: ['friendship-status'] });
      toast.success('Friend request sent!');
    },
    onError: (error) => {
      console.error('❌ FriendsList: Friend request error:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to send friend request';
      
      // Handle specific error cases
      if (errorMessage.includes('already sent')) {
        queryClient.invalidateQueries({ queryKey: ['friendship-status'] });
        queryClient.invalidateQueries({ queryKey: ['suggested-friends'] });
        toast.error('Friend request was already sent');
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const handleSendFriendRequest = (targetUserId) => {
    sendRequestMutation.mutate(targetUserId);
  };

  // Start conversation with friend
  const startConversationMutation = useMutation({
    mutationFn: async (friendId) => {
      const response = await api.post(`/conversations/start/${friendId}`);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate conversations cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      // Navigate to chat with the conversation selected
      navigate('/chat', { 
        state: { 
          selectedConversationId: data.data.id,
          conversation: data.data
        } 
      });
      toast.success('Chat opened with ' + data.data.users.find(u => u.id !== userId)?.name);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to start conversation');
    },
  });

  // Check if conversation exists and navigate to it
  const checkAndNavigateToConversation = async (friendId) => {
    setCheckingConversation(true);
    try {
      // First check if we already have conversations loaded
      const existingConversation = conversations.find(conv => {
        if (conv.type === 'private') {
          const otherUser = conv.users.find(u => u.id !== userId);
          return otherUser && otherUser.id === friendId;
        }
        return false;
      });

      if (existingConversation) {
        // Get the friend's name for the toast message
        const friendName = existingConversation.users.find(u => u.id !== userId)?.name || 'friend';
        
        // Navigate directly to existing conversation
        navigate('/chat', { 
          state: { 
            selectedConversationId: existingConversation.id,
            conversation: existingConversation
          } 
        });
        toast.success(`Chat opened with ${friendName}`);
        setCheckingConversation(false);
        return;
      }

      // If no existing conversation found, start a new one
      startConversationMutation.mutate(friendId);
    } catch (error) {
      console.error('Error checking conversation:', error);
      // Fallback to starting new conversation
      startConversationMutation.mutate(friendId);
    } finally {
      setCheckingConversation(false);
    }
  };

  const handleStartConversation = (friendId) => {
    console.log('Starting conversation with friend:', friendId);
    checkAndNavigateToConversation(friendId);
  };

  // Fetch friends
  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ['friends', userId],
    queryFn: async () => {
      const response = await api.get(`/friends`);
      return response.data;
    },
    enabled: activeTab === 'friends'
  });

  // Fetch pending requests
  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-requests'],
    queryFn: async () => {
      const response = await api.get(`/friendships/pending`);
      return response.data;
    },
    enabled: activeTab === 'pending'
  });

  // Fetch suggested friends
  const { data: suggestedData, isLoading: suggestedLoading } = useQuery({
    queryKey: ['suggested-friends'],
    queryFn: async () => {
      const response = await api.get(`/friends/suggested`);
      return response.data;
    },
    enabled: activeTab === 'suggested'
  });

  // Fetch conversations to check for existing ones
  const { data: conversationsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await api.get('/conversations');
      return response.data;
    },
    enabled: true, // Always fetch conversations
    staleTime: 30000, // Cache for 30 seconds
  });

  const conversations = conversationsData?.data || [];

  const tabs = [
    { id: 'friends', label: 'Friends', icon: Users, count: friendsData?.data?.friends?.data?.length || 0 },
    { id: 'pending', label: 'Requests', icon: Clock, count: pendingData?.data?.length || 0 },
    { id: 'suggested', label: 'Suggestions', icon: UserPlus, count: suggestedData?.data?.length || 0 },
  ];

  const renderFriendsList = () => {
    if (friendsLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    // Add defensive check for data structure
    if (!friendsData?.data?.friends) {
      console.error('Friends data structure:', friendsData);
      return (
        <div className="text-center py-8 text-gray-500">
          <p>Error loading friends data</p>
        </div>
      );
    }

    if (!friendsData.data.friends.data || friendsData.data.friends.data.length === 0) {
      return (
        <div className="text-center py-6 sm:py-8 text-gray-500 px-4">
          <Users className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No friends yet</h3>
          <p className="text-sm sm:text-base text-gray-400 mb-4">Start connecting with people!</p>
          <button
            onClick={() => setActiveTab('suggested')}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Find Friends
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {friendsData.data.friends.data.map((friendship, index) => {
          // The backend returns the friend user directly, not a friendship object
          const friend = friendship;
          const isNewFriend = index === 0; // First friend in the list is the newest
          
          return (
            <div key={friend.id} className={`flex items-center justify-between p-3 sm:p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-all duration-200 ${
              isNewFriend ? 'border-blue-300 bg-blue-50' : ''
            }`}>
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  {friend.profile?.avatar_url ? (
                    <img
                      src={friend.profile.avatar_url}
                      alt={friend.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm sm:text-base">
                      {friend.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Link
                      to={`/profile/${friend.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-sm sm:text-base truncate"
                    >
                      {friend.name}
                    </Link>
                    {isNewFriend && (
                      <span className="hidden sm:inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium flex-shrink-0">
                        New Friend
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                    @{friend.profile?.username || 'user'}
                  </p>
                  {isNewFriend && (
                    <span className="sm:hidden inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium mt-1">
                      New
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
                 <button
                   onClick={() => handleStartConversation(friend.id)}
                   disabled={startConversationMutation.isLoading || checkingConversation}
                   className="p-2 sm:p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   title="Send message"
                 >
                   {startConversationMutation.isLoading || checkingConversation ? (
                     <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                   ) : (
                     <MessageCircle className="w-4 h-4" />
                   )}
                 </button>
                 <button
                   onClick={() => {
                     // This will open the floating chat box
                     // You can implement this by passing a callback from parent
                     console.log('Quick chat with:', friend.name);
                   }}
                   className="hidden sm:block p-2 sm:p-2.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors transition-all duration-200 hover:scale-105"
                   title="Quick chat"
                 >
                   <MessageCircle className="w-4 h-4" />
                 </button>
               </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPendingRequests = () => {
    if (pendingLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    // Add defensive check for data structure
    if (!pendingData?.data) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>Error loading pending requests</p>
        </div>
      );
    }

    if (pendingData.data.length === 0) {
      return (
        <div className="text-center py-6 sm:py-8 text-gray-500 px-4">
          <Clock className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No pending requests</h3>
          <p className="text-sm sm:text-base text-gray-400">When someone sends you a friend request, it will appear here</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {pendingData.data.map((request) => {
          // The backend returns friendship with user data loaded
          const requester = request.user;
          const friendshipId = request.id;
          const isProcessing = acceptRequestMutation.isLoading || rejectRequestMutation.isLoading;
          
          return (
            <div key={requester.id} className={`flex items-center justify-between p-3 sm:p-4 bg-white rounded-lg border border-gray-200 transition-all duration-200 ${
              isProcessing ? 'opacity-75' : 'hover:shadow-sm'
            }`}>
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  {requester.profile?.avatar_url ? (
                    <img
                      src={requester.profile.avatar_url}
                      alt={requester.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm sm:text-base">
                      {requester.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/profile/${requester.id}`}
                    className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-sm sm:text-base block truncate"
                  >
                    {requester.name}
                  </Link>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                    @{requester.profile?.username || 'user'}
                  </p>
                  <p className="text-xs sm:text-sm text-blue-600 font-medium mt-1">
                    Wants to be your friend
                  </p>
                </div>
              </div>
              <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
                <button 
                  onClick={() => handleAcceptRequest(friendshipId)}
                  disabled={isProcessing}
                  className="p-2 sm:p-2.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Accept request"
                >
                  {acceptRequestMutation.isLoading ? (
                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
                <button 
                  onClick={() => handleRejectRequest(friendshipId)}
                  disabled={isProcessing}
                  className="p-2 sm:p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Reject request"
                >
                  {rejectRequestMutation.isLoading ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSuggestedFriends = () => {
    if (suggestedLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    // Add defensive check for data structure
    if (!suggestedData?.data) {
      console.error('Suggested data structure:', suggestedData);
      return (
        <div className="text-center py-8 text-gray-500">
          <p>Error loading suggested friends</p>
        </div>
      );
    }

    if (suggestedData.data.length === 0) {
      return (
        <div className="text-center py-6 sm:py-8 text-gray-500 px-4">
          <UserPlus className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No suggestions available</h3>
          <p className="text-sm sm:text-base text-gray-400">Check back later for friend suggestions</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {suggestedData.data.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                {user.profile?.avatar_url ? (
                  <img
                    src={user.profile.avatar_url}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-sm sm:text-base">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  to={`/profile/${user.id}`}
                  className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-sm sm:text-base block truncate"
                >
                  {user.name}
                </Link>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  @{user.profile?.username || 'user'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleSendFriendRequest(user.id)}
              disabled={sendRequestMutation.isLoading}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {sendRequestMutation.isLoading ? 'Sending...' : 'Add Friend'}
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'friends':
        return renderFriendsList();
      case 'pending':
        return renderPendingRequests();
      case 'suggested':
        return renderSuggestedFriends();
      default:
        return renderFriendsList();
    }
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200">
      {/* Mobile-first Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex px-3 sm:px-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap min-w-0 flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                style={{ marginRight: tab.id === 'suggested' ? 0 : '1rem' }}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0 min-w-[20px] text-center">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile-first Content */}
      <div className="p-3 sm:p-6">
        {renderContent()}
      </div>

      {/* Mobile-responsive Floating Notifications */}
      <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 space-y-2 max-w-sm sm:max-w-none mx-auto sm:mx-0">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 ${
              notification.type === 'success' 
                ? 'bg-green-500' 
                : notification.type === 'error' 
                ? 'bg-red-500' 
                : 'bg-blue-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium pr-2 flex-1">{notification.message}</span>
              <button
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                className="text-white hover:text-gray-200 text-lg leading-none flex-shrink-0"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendsList;
