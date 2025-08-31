import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import FriendsList from './FriendsList';

const FriendsPage = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">Please login to view friends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-4 pt-2 sm:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Mobile-first header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Friends</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            Manage your friendships and discover new connections
          </p>
        </div>
        
        <FriendsList userId={user.id} />
      </div>
    </div>
  );
};

export default FriendsPage;
