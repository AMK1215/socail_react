import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Users, UserPlus, Clock, Check, X, MessageCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const FriendsList = ({ userId }) => {
  const [activeTab, setActiveTab] = useState('friends');
  const [checkingConversation, setCheckingConversation] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Accept friend request mutation
  const acceptRequestMutation = useMutation(
    async (friendshipId) => {
      const response = await api.put(`/friendships/${friendshipId}`, { action: 'accept' });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['friends', userId]);
        queryClient.invalidateQueries(['pending-requests']);
        toast.success('Friend request accepted!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to accept friend request');
      },
    }
  );

  // Reject friend request mutation
  const rejectRequestMutation = useMutation(
    async (friendshipId) => {
      const response = await api.put(`/friendships/${friendshipId}`, { action: 'reject' });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['friends', userId]);
        queryClient.invalidateQueries(['pending-requests']);
        toast.success('Friend request rejected');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reject friend request');
      },
    }
  );

  const handleAcceptRequest = (friendshipId) => {
    acceptRequestMutation.mutate(friendshipId);
  };

  const handleRejectRequest = (friendshipId) => {
    rejectRequestMutation.mutate(friendshipId);
  };

  // Send friend request mutation
  const sendRequestMutation = useMutation(
    async (targetUserId) => {
      const response = await api.post(`/friends/${targetUserId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['friends', userId]);
        queryClient.invalidateQueries(['suggested-friends']);
        toast.success('Friend request sent!');
      },
      onError: (error) => {
        console.error('Friend request error:', error.response?.data);
        toast.error(error.response?.data?.message || 'Failed to send friend request');
      },
    }
  );

  const handleSendFriendRequest = (targetUserId) => {
    sendRequestMutation.mutate(targetUserId);
  };

  // Start conversation with friend
  const startConversationMutation = useMutation(
    async (friendId) => {
      const response = await api.post(`/conversations/start/${friendId}`);
      return response.data;
    },
    {
      onSuccess: (data) => {
        // Invalidate conversations cache to refresh the list
        queryClient.invalidateQueries(['conversations']);
        
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
    }
  );

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
  const { data: friendsData, isLoading: friendsLoading } = useQuery(
    ['friends', userId],
    async () => {
      const response = await api.get(`/friends`);
      return response.data;
    },
    { enabled: activeTab === 'friends' }
  );

  // Fetch pending requests
  const { data: pendingData, isLoading: pendingLoading } = useQuery(
    ['pending-requests'],
    async () => {
      const response = await api.get(`/friendships/pending`);
      return response.data;
    },
    { enabled: activeTab === 'pending' }
  );

  // Fetch suggested friends
  const { data: suggestedData, isLoading: suggestedLoading } = useQuery(
    ['suggested-friends'],
    async () => {
      const response = await api.get(`/friends/suggested`);
      return response.data;
    },
    { enabled: activeTab === 'suggested' }
  );

  // Fetch conversations to check for existing ones
  const { data: conversationsData } = useQuery(
    ['conversations'],
    async () => {
      const response = await api.get('/conversations');
      return response.data;
    },
    { 
      enabled: true, // Always fetch conversations
      staleTime: 30000, // Cache for 30 seconds
    }
  );

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
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No friends yet</p>
          <p className="text-sm">Start connecting with people!</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {friendsData.data.friends.data.map((friendship) => {
          // The backend returns the friend user directly, not a friendship object
          const friend = friendship;
          return (
            <div key={friend.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  {friend.profile?.avatar_url ? (
                    <img
                      src={friend.profile.avatar_url}
                      alt={friend.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {friend.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <Link
                    to={`/profile/${friend.id}`}
                    className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {friend.name}
                  </Link>
                  <p className="text-sm text-gray-500">
                    @{friend.profile?.username || 'user'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                 <button
                   onClick={() => handleStartConversation(friend.id)}
                   disabled={startConversationMutation.isLoading || checkingConversation}
                   className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   title="Send message"
                 >
                   {startConversationMutation.isLoading || checkingConversation ? (
                     <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                   ) : (
                     <MessageCircle className="w-4 h-4" />
                   )}
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
      console.error('Pending data structure:', pendingData);
      return (
        <div className="text-center py-8 text-gray-500">
          <p>Error loading pending requests</p>
        </div>
      );
    }

    if (pendingData.data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No pending requests</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {pendingData.data.map((request) => {
          // The backend returns friendship with user data loaded
          const requester = request.user;
          const friendshipId = request.id;
          return (
            <div key={requester.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  {requester.profile?.avatar_url ? (
                    <img
                      src={requester.profile.avatar_url}
                      alt={requester.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {requester.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <Link
                    to={`/profile/${requester.id}`}
                    className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {requester.name}
                  </Link>
                  <p className="text-sm text-gray-500">
                    @{requester.profile?.username || 'user'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleAcceptRequest(friendshipId)}
                  disabled={acceptRequestMutation.isLoading}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Accept request"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleRejectRequest(friendshipId)}
                  disabled={rejectRequestMutation.isLoading}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Reject request"
                >
                  <X className="w-4 h-4" />
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
        <div className="text-center py-8 text-gray-500">
          <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No suggestions available</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {suggestedData.data.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                {user.profile?.avatar_url ? (
                  <img
                    src={user.profile.avatar_url}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <Link
                  to={`/profile/${user.id}`}
                  className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {user.name}
                </Link>
                <p className="text-sm text-gray-500">
                  @{user.profile?.username || 'user'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleSendFriendRequest(user.id)}
              disabled={sendRequestMutation.isLoading}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default FriendsList;
