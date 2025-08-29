import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Users, X, UserPlus, ChevronRight, Sparkles, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

const PeopleYouMayKnow = () => {
  const [dismissedUsers, setDismissedUsers] = useState(new Set());
  const [sentRequestUsers, setSentRequestUsers] = useState(new Set());
  const queryClient = useQueryClient();

  // Fetch suggested friends
  const { data: suggestedData, isLoading: suggestedLoading, error: suggestedError } = useQuery({
    queryKey: ['suggestedFriends'],
    queryFn: async () => {
      const response = await api.get('/friends/suggested');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch current user's sent friend requests to filter them out
  const { data: sentRequestsData, isLoading: sentRequestsLoading, error: sentRequestsError } = useQuery({
    queryKey: ['sentFriendRequests'],
    queryFn: async () => {
      try {
        const response = await api.get('/friends');
        console.log('Sent requests data:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching sent requests:', error);
        // Return empty data structure if error
        return { data: { sent_requests: [] } };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async (userId) => {
      console.log('=== MUTATION START ===');
      console.log('Mutation function called with userId:', userId);
      console.log('Making API request to:', `/friends/${userId}`);
      
      try {
        const response = await api.post(`/friends/${userId}`);
        console.log('API Response received:', response);
        console.log('Response data:', response.data);
        console.log('=== MUTATION SUCCESS ===');
        return response.data;
      } catch (error) {
        console.log('=== MUTATION ERROR ===');
        console.error('API Error:', error);
        console.error('Error response:', error.response);
        throw error;
      }
    },
    onSuccess: (data, userId) => {
      console.log('Friend request sent successfully:', data);
      toast.success('Friend request sent!', {
        style: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        },
      });
      // Mark user as having a sent request
      setSentRequestUsers(prev => new Set([...prev, userId]));
      // Don't remove from suggestions immediately, just change button state
      // Refresh both queries to get updated data
      queryClient.invalidateQueries({ queryKey: ['suggestedFriends'] });
      queryClient.invalidateQueries({ queryKey: ['sentFriendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (error) => {
      console.error('Friend request error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to send friend request';
      toast.error(errorMessage, {
        style: {
          background: '#ef4444',
          color: 'white',
        },
      });
    },
  });

  // Dismiss user mutation
  const dismissUserMutation = useMutation({
    mutationFn: async (userId) => {
      // For now, we'll just dismiss locally
      // You can add an API endpoint later if needed
      return { success: true };
    },
    onSuccess: (data, userId) => {
      setDismissedUsers(prev => new Set([...prev, userId]));
      toast.success('User dismissed', {
        style: {
          background: '#64748b',
          color: 'white',
        },
      });
    },
  });

  const handleSendRequest = (userId) => {
    console.log('=== handleSendRequest START ===');
    console.log('handleSendRequest called with userId:', userId);
    console.log('sendRequestMutation.isLoading:', sendRequestMutation.isLoading);
    console.log('sentRequestUsers:', Array.from(sentRequestUsers));
    console.log('Current user being processed:', userId);
    
    if (!userId) {
      console.error('No userId provided to handleSendRequest');
      toast.error('Invalid user ID');
      return;
    }
    
    if (sendRequestMutation.isLoading) {
      console.log('Friend request already in progress');
      return;
    }
    
    if (sentRequestUsers.has(userId)) {
      console.log('Request already sent to this user');
      return;
    }
    
    console.log('Calling sendRequestMutation.mutate with userId:', userId);
    sendRequestMutation.mutate(userId);
    console.log('=== handleSendRequest END ===');
  };

  const handleDismiss = (userId) => {
    dismissUserMutation.mutate(userId);
  };

  const handleSeeAll = () => {
    // Navigate to a full suggestions page or expand the list
    toast.info('See all feature coming soon!');
  };

  if (suggestedLoading || sentRequestsLoading) {
    return (
      <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="h-6 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="flex space-x-4 overflow-x-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-40">
                <div className="h-48 bg-gray-200 rounded-2xl mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (suggestedError) {
    console.error('Error fetching suggested friends:', suggestedError);
    return null; // Don't show anything if there's an error
  }

  if (!suggestedData?.data || suggestedData.data.length === 0) {
    return null; // Don't show anything if no suggestions
  }

  // Get sent friend request user IDs
  const sentRequestUserIds = new Set();
  if (sentRequestsData?.data?.sent_requests) {
    sentRequestsData.data.sent_requests.forEach(request => {
      sentRequestUserIds.add(request.friend_id);
    });
  }
  
  console.log('All suggested users:', suggestedData.data);
  console.log('Dismissed users:', Array.from(dismissedUsers));
  console.log('Sent request user IDs:', Array.from(sentRequestUserIds));

  // Filter out only dismissed users, keep users with sent requests to show different button state
  const suggestions = suggestedData.data.filter(user => 
    !dismissedUsers.has(user.id)
  );
  
  console.log('Filtered suggestions:', suggestions);

  if (suggestions.length === 0) {
    return null; // Don't show anything if all users are dismissed or have requests
  }

  return (
    <div className="bg-white/70 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg border border-white/30 p-4 sm:p-6">
      
      {/* Debug Section - Remove in production */}
      {/* 
      <div className="mb-4 p-2 bg-yellow-100 rounded border">
        <p className="text-xs text-yellow-800">Debug Info:</p>
        <p className="text-xs">Suggestions: {suggestions.length}</p>
        <p className="text-xs">Sent Requests: {Array.from(sentRequestUsers).length}</p>
        <p className="text-xs">Loading: {sendRequestMutation.isLoading ? 'Yes' : 'No'}</p>
        <button 
          onClick={() => {
            console.log('Test button clicked');
            if (suggestions.length > 0) {
              handleSendRequest(suggestions[0].id);
            }
          }}
          className="mt-1 px-2 py-1 bg-yellow-500 text-white text-xs rounded"
        >
          Test First User
        </button>
      </div>
      */}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">People you may know</h3>
            <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Discover amazing connections</p>
          </div>
        </div>
        <button 
          onClick={handleSeeAll}
          className="flex items-center space-x-1 text-blue-600 font-medium text-sm transition-colors active:text-blue-800 flex-shrink-0 touch-manipulation"
        >
          <span className="hidden sm:inline">See all</span>
          <span className="sm:hidden text-xs">All</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Facebook-style Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {suggestions.slice(0, 8).map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              {/* Profile Card */}
              {/* Profile Picture */}
              <div className="relative aspect-square">
                {user.profile?.avatar_url ? (
                  <img
                    src={user.profile.avatar_url}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                {/* Dismiss Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDismiss(user.id);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-gray-800/70 text-white rounded-full flex items-center justify-center transition-colors duration-200 active:bg-gray-800/90 touch-manipulation"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Mutual Friends Badge */}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {Math.floor(Math.random() * 5) + 1} mutual friends
                </div>
              </div>

              {/* User Info */}
              <div className="p-3">
                <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                  {user.name}
                </h4>
                <p className="text-xs text-gray-500 mb-3 truncate">
                  @{user.profile?.username || user.email?.split('@')[0]}
                </p>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {/* Add Friend Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Button clicked for user:', user.id, user.name);
                      handleSendRequest(user.id);
                    }}
                    disabled={sendRequestMutation.isLoading || sentRequestUsers.has(user.id) || sentRequestUserIds.has(user.id)}
                    className={`w-full py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-1 touch-manipulation ${
                      sentRequestUsers.has(user.id) || sentRequestUserIds.has(user.id)
                        ? 'bg-gray-100 text-gray-600 cursor-default'
                        : sendRequestMutation.isLoading
                        ? 'bg-blue-500 text-white opacity-75'
                        : 'bg-blue-600 text-white active:bg-blue-700'
                    }`}
                    type="button"
                  >
                    {sentRequestUsers.has(user.id) || sentRequestUserIds.has(user.id) ? (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Request Sent</span>
                      </>
                    ) : sendRequestMutation.isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Add Friend</span>
                      </>
                    )}
                  </button>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDismiss(user.id);
                    }}
                    className="w-full py-2 px-3 bg-gray-100 text-gray-700 rounded-md text-sm font-medium transition-colors duration-200 active:bg-gray-200 touch-manipulation"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Show More Button */}
      {suggestions.length > 8 && (
        <div className="mt-6 text-center">
          <button
            onClick={handleSeeAll}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors duration-200 active:bg-gray-200 touch-manipulation"
          >
            See More Suggestions ({suggestions.length - 8} more)
          </button>
        </div>
      )}
    </div>
  );
};

export default PeopleYouMayKnow;