import React, { useState } from 'react';
import { api } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const FriendshipDebug = ({ targetUserId, currentUserId }) => {
  const [debugData, setDebugData] = useState(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const checkFriendshipStatus = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/debug/friendship/${targetUserId}`);
      setDebugData(response.data.data);
      console.log('Friendship Debug Data:', response.data.data);
    } catch (error) {
      console.error('Debug error:', error);
      toast.error('Failed to get debug data');
    } finally {
      setLoading(false);
    }
  };

  const cleanupFriendships = async () => {
    setLoading(true);
    try {
      const response = await api.post('/debug/cleanup-friendships');
      toast.success(response.data.message);
      console.log('Cleanup result:', response.data);
      // Refresh debug data
      await checkFriendshipStatus();
    } catch (error) {
      console.error('Cleanup error:', error);
      toast.error('Failed to cleanup friendships');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    // Clear all friendship-related cache
    queryClient.invalidateQueries({ queryKey: ['friendship-status'] });
    queryClient.invalidateQueries({ queryKey: ['friendships'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.removeQueries({ queryKey: ['friendship-status', currentUserId, targetUserId] });
    toast.success('Cache cleared!');
  };

  const testCreateFriendship = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/debug/test-friendship/${targetUserId}`);
      toast.success(response.data.message);
      console.log('Test friendship result:', response.data);
      // Refresh debug data and clear cache
      queryClient.invalidateQueries({ queryKey: ['friendship-status', currentUserId, targetUserId] });
      await checkFriendshipStatus();
    } catch (error) {
      console.error('Test friendship error:', error);
      const errorMessage = error.response?.data?.message || 'Test failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const debugPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/debug/pending-requests');
      console.log('🔍 All friendship debug data:', response.data.data);
      toast.success('Debug data logged to console');
    } catch (error) {
      console.error('Debug pending error:', error);
      toast.error('Debug failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
      <h3 className="text-sm font-medium text-yellow-800 mb-2">🔍 Friendship Debug</h3>
      
      <div className="space-y-2">
        <button
          onClick={checkFriendshipStatus}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Check Status'}
        </button>
        
        <button
          onClick={cleanupFriendships}
          disabled={loading}
          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50 ml-2"
        >
          Cleanup Duplicates
        </button>
        
        <button
          onClick={clearCache}
          className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 ml-2"
        >
          Clear Cache
        </button>
        
        <button
          onClick={testCreateFriendship}
          disabled={loading}
          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 ml-2"
        >
          Test Create
        </button>
        
        <button
          onClick={debugPendingRequests}
          disabled={loading}
          className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 disabled:opacity-50 ml-2"
        >
          Debug Pending
        </button>
      </div>

      {debugData && (
        <div className="mt-3 text-xs">
          <div className="text-gray-600">
            <strong>Current User:</strong> {debugData.current_user_id}<br/>
            <strong>Target User:</strong> {debugData.target_user_id}<br/>
            <strong>Records Found:</strong> {debugData.count}
          </div>
          
          {debugData.friendships_found.length > 0 && (
            <div className="mt-2">
              <strong>Friendship Records:</strong>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(debugData.friendships_found, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FriendshipDebug;
