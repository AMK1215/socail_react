import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Users, X, UserPlus, ChevronRight, Sparkles, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

const PeopleYouMayKnow = () => {
  const [dismissedUsers, setDismissedUsers] = useState(new Set());
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
  const { data: sentRequestsData, isLoading: sentRequestsLoading } = useQuery({
    queryKey: ['sentFriendRequests'],
    queryFn: async () => {
      const response = await api.get('/friends');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await api.post(`/friends/${userId}`);
      return response.data;
    },
    onSuccess: (data, userId) => {
      toast.success('Friend request sent!', {
        style: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        },
      });
      // Remove the user from suggestions after sending request
      setDismissedUsers(prev => new Set([...prev, userId]));
      // Refresh both queries to get updated data
      queryClient.invalidateQueries({ queryKey: ['suggestedFriends'] });
      queryClient.invalidateQueries({ queryKey: ['sentFriendRequests'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send friend request');
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

  // Filter out dismissed users and users who already have friend requests
  const suggestions = suggestedData.data.filter(user => 
    !dismissedUsers.has(user.id) && !sentRequestUserIds.has(user.id)
  );

  if (suggestions.length === 0) {
    return null; // Don't show anything if all users are dismissed or have requests
  }

  return (
    <div className="bg-white/70 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg border border-white/30 p-4 sm:p-6">
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
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors active:scale-95 flex-shrink-0"
        >
          <span className="hidden sm:inline">See all</span>
          <span className="sm:hidden text-xs">All</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Scrollable Cards */}
      <div className="relative">
        <div className="flex space-x-3 sm:space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          {suggestions.map((user) => (
            <div key={user.id} className="flex-shrink-0 w-32 sm:w-40 group">
              {/* Profile Card */}
              <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1 sm:group-hover:-translate-y-2">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="aspect-square w-full relative overflow-hidden">
                    {user.profile?.avatar_url ? (
                      <img
                        src={user.profile.avatar_url}
                        alt={user.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center">
                        <span className="text-white font-bold text-2xl sm:text-3xl">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                    
                    {/* Dismiss Button */}
                    <button
                      onClick={() => handleDismiss(user.id)}
                      className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-6 h-6 sm:w-7 sm:h-7 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm active:scale-95"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    {/* Mutual Friends Badge (if you have data for this) */}
                    <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5 sm:px-2 sm:py-1">
                      <span className="text-[10px] sm:text-xs font-medium text-gray-700">
                        {Math.floor(Math.random() * 5) + 1} mutual
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Info */}
                <div className="p-3 sm:p-4">
                  <h4 className="font-semibold text-gray-900 text-center mb-1 line-clamp-2 text-sm sm:text-base">
                    {user.name}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-gray-600 text-center mb-3 sm:mb-4 truncate">
                    @{user.profile?.username || user.email?.split('@')[0]}
                  </p>

                  {/* Add Friend Button */}
                  <button
                    onClick={() => handleSendRequest(user.id)}
                    disabled={sendRequestMutation.isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 sm:space-x-2 shadow-lg hover:shadow-xl active:scale-95"
                  >
                    {sendRequestMutation.isLoading ? (
                      <>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs sm:text-sm">Sending...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">Add Friend</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl sm:rounded-2xl"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll Indicator */}
        {suggestions.length > 3 && (
          <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center shadow-lg">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="mt-6 text-center">
        <button
          onClick={handleSeeAll}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-lg"
        >
          <Heart className="w-4 h-4" />
          <span>Discover more people</span>
        </button>
      </div>
    </div>
  );
};

export default PeopleYouMayKnow;