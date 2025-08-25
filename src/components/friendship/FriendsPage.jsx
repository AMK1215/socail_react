import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import FriendsList from './FriendsList';

const FriendsPage = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Please login to view friends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Friends</h1>
          <p className="text-gray-600 mt-2">Manage your friendships and discover new connections</p>
        </div>
        
        <FriendsList userId={user.id} />
      </div>
    </div>
  );
};

export default FriendsPage;
