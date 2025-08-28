import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import broadcastingService from '../services/broadcasting.js';

export const useRealtimeComments = (postId) => {
  const queryClient = useQueryClient();
  const channelRef = useRef(null);

  useEffect(() => {
    if (!postId) return;

    console.log('Setting up real-time comments for post:', postId);

    // Initialize the broadcasting service
    broadcastingService.initialize();

    // Subscribe to the post channel using the service
    const channel = broadcastingService.subscribeToChannel(`post.${postId}`, 'CommentCreated', (event) => {
      console.log('New comment received:', event);
      
      // Invalidate and refetch comments for this post
      queryClient.invalidateQueries({ 
        queryKey: ['comments', postId] 
      });
      
      // Also invalidate posts to update comment count
      queryClient.invalidateQueries({ 
        queryKey: ['posts'] 
      });
    });

    // Subscribe to comment deletions
    broadcastingService.subscribeToChannel(`post.${postId}`, 'CommentDeleted', (event) => {
      console.log('Comment deleted:', event);
      
      // Invalidate and refetch comments for this post
      queryClient.invalidateQueries({ 
        queryKey: ['comments', postId] 
      });
      
      // Also invalidate posts to update comment count
      queryClient.invalidateQueries({ 
        queryKey: ['posts'] 
      });
    });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log('Unsubscribing from post channel:', postId);
        broadcastingService.unsubscribeFromChannel(`post.${postId}`);
      }
    };
  }, [postId, queryClient]);

  return channelRef.current;
};
