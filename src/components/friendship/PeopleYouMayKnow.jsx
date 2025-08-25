import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../services/api';
import { Users, X, UserPlus, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const PeopleYouMayKnow = () => {
  const [dismissedUsers, setDismissedUsers] = useState(new Set());
  const queryClient = useQueryClient();

  // Fetch suggested friends
  const { data: suggestedData, isLoading: suggestedLoading, error: suggestedError } = useQuery(
    'suggestedFriends',
    async () => {
      const response = await api.get('/friends/suggested');
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  // Fetch current user's sent friend requests to filter them out
  const { data: sentRequestsData, isLoading: sentRequestsLoading } = useQuery(
    'sentFriendRequests',
    async () => {
      const response = await api.get('/friends');
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  // Send friend request mutation
  const sendRequestMutation = useMutation(
    async (userId) => {
      const response = await api.post(`/friends/${userId}`);
      return response.data;
    },
    {
      onSuccess: (data, userId) => {
        toast.success('Friend request sent!');
        // Remove the user from suggestions after sending request
        setDismissedUsers(prev => new Set([...prev, userId]));
        // Refresh both queries to get updated data
        queryClient.invalidateQueries('suggestedFriends');
        queryClient.invalidateQueries('sentFriendRequests');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send friend request');
      },
    }
  );

  // Dismiss user mutation
  const dismissUserMutation = useMutation(
    async (userId) => {
      // For now, we'll just dismiss locally
      // You can add an API endpoint later if needed
      return { success: true };
    },
    {
      onSuccess: (data, userId) => {
        setDismissedUsers(prev => new Set([...prev, userId]));
        toast.success('User dismissed');
      },
    }
  );

  const handleSendRequest = (userId) => {
    sendRequestMutation.mutate(userId);
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="flex space-x-4 overflow-x-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-32">
                <div className="h-32 bg-gray-200 rounded-lg mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
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

  // Filter out dismissed users and users who already have friend requests
  const suggestions = suggestedData.data.filter(user => 
    !dismissedUsers.has(user.id) && !sentRequestUserIds.has(user.id)
  );

  // Debug logging to see what's being filtered
  // console.log('People You May Know Filtering:', {
  //   totalSuggested: suggestedData.data.length,
  //   sentRequestIds: Array.from(sentRequestUserIds),
  //   dismissedIds: Array.from(dismissedUsers),
  //   finalSuggestions: suggestions.length,
  //   filteredUsers: suggestions.map(u => ({ id: u.id, name: u.name }))
  // });

  if (suggestions.length === 0) {
    return null; // Don't show anything if all users are dismissed or have requests
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">People you may know  with Others</h3>
        </div>
        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="6" r="2" />
            <circle cx="10" cy="12" r="2" />
            <circle cx="10" cy="18" r="2" />
          </svg>
        </button>
      </div>

      {/* Horizontal Scrollable Cards */}
      <div className="relative">
        <div className="flex space-x-3 sm:space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          {suggestions.map((user) => (
            <div key={user.id} className="flex-shrink-0 w-28 sm:w-32 people-card">
              {/* Profile Card */}
              <div className="relative">
                {/* Profile Picture */}
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-3">
                  {user.profile?.avatar_url ? (
                    <img
                      src={user.profile.avatar_url}
                      alt={user.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold text-2xl">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  {/* Dismiss Button */}
                  <button
                    onClick={() => handleDismiss(user.id)}
                    className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                </div>

                {/* User Name */}
                <h4 className="text-sm font-medium text-gray-900 text-center mb-3 line-clamp-2">
                  {user.name}
                </h4>

                {/* Add Friend Button */}
                <button
                  onClick={() => handleSendRequest(user.id)}
                  disabled={sendRequestMutation.isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium py-2 px-2 sm:px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                >
                  <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Add friend</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrow (if more than 4 suggestions) */}
        {suggestions.length > 4 && (
          <button className="absolute right-0 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center transition-colors shadow-sm">
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* See All Link */}
      <div className="text-center mt-4">
        <button
          onClick={handleSeeAll}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
        >
          See all
        </button>
      </div>
    </div>
  );
};

export default PeopleYouMayKnow;
