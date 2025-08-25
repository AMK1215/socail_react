import React from 'react';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import { UserPlus, UserCheck, UserX, Clock, Check, X } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';

const FriendshipButton = ({ targetUserId, currentUserId, initialStatus = null }) => {
  const queryClient = useQueryClient();
  
  // Get current friendship status
  const { data: statusData } = useQuery(
    ['friendship-status', currentUserId, targetUserId],
    async () => {
      try {
        const response = await api.get(`/friendships/status/${targetUserId}`);
        return response.data;
      } catch (error) {
        if (error.response?.status === 404) {
          return { status: 'none' };
        }
        throw error;
      }
    },
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  const currentStatus = statusData?.data || { status: 'none' };
  
  // Send friend request
  const sendRequestMutation = useMutation(
    async () => {
      const response = await api.post(`/friends/${targetUserId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile', targetUserId]);
        queryClient.invalidateQueries(['friendships']);
        toast.success('Friend request sent!');
      },
      onError: (error) => {
        console.error('Friend request error:', error.response?.data);
        toast.error(error.response?.data?.message || 'Failed to send friend request');
      },
    }
  );

  // Accept friend request
  const acceptRequestMutation = useMutation(
    async (friendshipId) => {
      const response = await api.put(`/friendships/${friendshipId}`, { action: 'accept' });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile', targetUserId]);
        queryClient.invalidateQueries(['friendships']);
        toast.success('Friend request accepted!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to accept friend request');
      },
    }
  );

  // Reject friend request
  const rejectRequestMutation = useMutation(
    async (friendshipId) => {
      const response = await api.put(`/friendships/${friendshipId}`, { action: 'reject' });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile', targetUserId]);
        queryClient.invalidateQueries(['friendships']);
        toast.success('Friend request rejected');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reject friend request');
      },
    }
  );

  // Cancel friend request
  const cancelRequestMutation = useMutation(
    async (friendshipId) => {
      const response = await api.delete(`/friendships/${friendshipId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile', targetUserId]);
        queryClient.invalidateQueries(['friendships']);
        toast.success('Friend request cancelled');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to cancel friend request');
      },
    }
  );

  // Remove friend
  const removeFriendMutation = useMutation(
    async (friendshipId) => {
      const response = await api.delete(`/friendships/${friendshipId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile', targetUserId]);
        queryClient.invalidateQueries(['friendships']);
        toast.success('Friend removed');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to remove friend');
      },
    }
  );

  // Don't show button for own profile
  if (currentUserId === targetUserId) {
    return null;
  }

  const renderButton = () => {
    switch (currentStatus.status) {
      case 'none':
        return (
          <button
            onClick={() => sendRequestMutation.mutate()}
            disabled={sendRequestMutation.isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>{sendRequestMutation.isLoading ? 'Sending...' : 'Add Friend'}</span>
          </button>
        );

      case 'pending_sent':
        return (
          <button
            onClick={() => cancelRequestMutation.mutate(currentStatus.friendshipId)}
            disabled={cancelRequestMutation.isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            <Clock className="w-4 h-4" />
            <span>{cancelRequestMutation.isLoading ? 'Cancelling...' : 'Cancel Request'}</span>
          </button>
        );

      case 'pending_received':
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => acceptRequestMutation.mutate(currentStatus.friendshipId)}
              disabled={acceptRequestMutation.isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{acceptRequestMutation.isLoading ? 'Accepting...' : 'Accept'}</span>
            </button>
            <button
              onClick={() => rejectRequestMutation.mutate(currentStatus.friendshipId)}
              disabled={rejectRequestMutation.isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>{rejectRequestMutation.isLoading ? 'Rejecting...' : 'Reject'}</span>
            </button>
          </div>
        );

      case 'friends':
        return (
          <button
            onClick={() => removeFriendMutation.mutate(currentStatus.friendshipId)}
            disabled={removeFriendMutation.isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <UserX className="w-4 h-4" />
            <span>{removeFriendMutation.isLoading ? 'Removing...' : 'Remove Friend'}</span>
          </button>
        );

      default:
        return (
          <button
            onClick={() => sendRequestMutation.mutate()}
            disabled={sendRequestMutation.isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>{sendRequestMutation.isLoading ? 'Sending...' : 'Add Friend'}</span>
          </button>
        );
    }
  };

  return (
    <div className="mt-4">
      {renderButton()}
    </div>
  );
};

export default FriendshipButton;
