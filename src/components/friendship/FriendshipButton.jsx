import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { UserPlus, UserCheck, UserX, Clock, Check, X } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';
import FriendshipDebug from '../debug/FriendshipDebug';

const FriendshipButton = ({ targetUserId, currentUserId, initialStatus = null }) => {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Get current friendship status
  const { data: statusData } = useQuery({
    queryKey: ['friendship-status', currentUserId, targetUserId],
    queryFn: async () => {
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
    staleTime: 0, // Always refetch - no caching
    cacheTime: 0, // Don't keep in cache
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const currentStatus = statusData?.data || { status: 'none' };
  
  // Send friend request
  const sendRequestMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/friends/${targetUserId}`);
      return response.data;
    },
    onMutate: async () => {
      // Prevent rapid clicks
      if (isProcessing) return;
      setIsProcessing(true);
      
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['friendship-status', currentUserId, targetUserId] });
      
      // Snapshot the previous value
      const previousStatus = queryClient.getQueryData(['friendship-status', currentUserId, targetUserId]);
      
      // Optimistically update to pending_sent
      queryClient.setQueryData(['friendship-status', currentUserId, targetUserId], {
        success: true,
        data: { status: 'pending_sent' }
      });
      
      // Return a context object with the snapshotted value
      return { previousStatus };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
      queryClient.invalidateQueries({ queryKey: ['friendship-status', currentUserId, targetUserId] });
      toast.success('Friend request sent!');
      setIsProcessing(false);
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousStatus) {
        queryClient.setQueryData(['friendship-status', currentUserId, targetUserId], context.previousStatus);
      }
      
      console.error('Friend request error:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to send friend request';
      
      // If friend request already sent, force refresh to get real state
      if (errorMessage.includes('already sent')) {
        queryClient.invalidateQueries({ queryKey: ['friendship-status', currentUserId, targetUserId] });
        toast.error('Friend request was already sent');
      } else {
        toast.error(errorMessage);
      }
      setIsProcessing(false);
    },
  });

  // Accept friend request
  const acceptRequestMutation = useMutation({
    mutationFn: async (friendshipId) => {
      const response = await api.put(`/friendships/${friendshipId}`, { action: 'accept' });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
      queryClient.invalidateQueries({ queryKey: ['friendship-status', currentUserId, targetUserId] });
      toast.success('Friend request accepted!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to accept friend request');
    },
  });

  // Reject friend request
  const rejectRequestMutation = useMutation({
    mutationFn: async (friendshipId) => {
      const response = await api.put(`/friendships/${friendshipId}`, { action: 'reject' });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
      queryClient.invalidateQueries({ queryKey: ['friendship-status', currentUserId, targetUserId] });
      toast.success('Friend request rejected');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reject friend request');
    },
  });

  // Cancel friend request
  const cancelRequestMutation = useMutation({
    mutationFn: async (friendshipId) => {
      const response = await api.delete(`/friendships/${friendshipId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
      queryClient.invalidateQueries({ queryKey: ['friendship-status', currentUserId, targetUserId] });
      toast.success('Friend request cancelled');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel friend request');
    },
  });

  // Remove friend
  const removeFriendMutation = useMutation({
    mutationFn: async (friendshipId) => {
      const response = await api.delete(`/friendships/${friendshipId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
      queryClient.invalidateQueries({ queryKey: ['friendship-status', currentUserId, targetUserId] });
      toast.success('Friend removed');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove friend');
    },
  });

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
            disabled={sendRequestMutation.isLoading || isProcessing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>{sendRequestMutation.isLoading || isProcessing ? 'Sending...' : 'Add Friend'}</span>
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
      {/* Debug Component - DISABLED after successful fix */}
      {/* <FriendshipDebug targetUserId={targetUserId} currentUserId={currentUserId} /> */}
    </div>
  );
};

export default FriendshipButton;
