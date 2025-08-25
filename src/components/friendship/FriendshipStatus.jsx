import React from 'react';
import { useQuery } from 'react-query';
import { api } from '../../services/api';

const FriendshipStatus = ({ currentUserId, targetUserId }) => {
  // Don't show for own profile
  if (currentUserId === targetUserId) {
    return null;
  }

  const { data: friendshipData, isLoading } = useQuery(
    ['friendship-status', currentUserId, targetUserId],
    async () => {
      try {
        const response = await api.get(`/friendships/status/${targetUserId}`);
        return response.data;
      } catch (error) {
        // If no friendship exists, return 'none'
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

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
        <span>Checking...</span>
      </div>
    );
  }

  const status = friendshipData?.status || 'none';

  const getStatusInfo = () => {
    switch (status) {
      case 'none':
        return {
          text: 'Not friends',
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
        };
      case 'pending_sent':
        return {
          text: 'Friend request sent',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        };
      case 'pending_received':
        return {
          text: 'Friend request received',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
        };
      case 'friends':
        return {
          text: 'Friends',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      default:
        return {
          text: 'Unknown',
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
      {statusInfo.text}
    </div>
  );
};

export default FriendshipStatus;
