import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useRealtimeComments } from '../../hooks/useRealtimeComments';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

const CommentsSection = ({ postId, commentCount = 0, onCommentAdded }) => {
  const [showComments, setShowComments] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyToName, setReplyToName] = useState('');

  // Helper function to safely extract paginated data
  const getPaginatedData = (data, fallback = []) => {
    if (!data || !data.data) return fallback;
    // Handle nested pagination structure: data.data.data
    if (data.data && data.data.data && Array.isArray(data.data.data)) {
      return data.data.data;
    }
    // Handle direct array structure: data.data
    if (Array.isArray(data.data)) {
      return data.data;
    }
    return fallback;
  };

  // Set up real-time comments
  useRealtimeComments(postId);

  // Fetch comments
  const { data: commentsData, isLoading, error } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      try {
        const response = await api.get(`/posts/${postId}/comments`);
        return response.data;
      } catch (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }
    },
    enabled: showComments,
    retry: 2,
    retryDelay: 1000,
  });

  // Ensure comments is always an array with proper fallback
  const comments = getPaginatedData(commentsData);
  
  // Debug logging to help identify data structure issues
  if (showComments && commentsData) {
    console.log('Comments data structure:', {
      commentsData,
      data: commentsData?.data,
      nestedData: commentsData?.data?.data,
      isArray: Array.isArray(commentsData?.data?.data),
      commentsLength: comments.length,
      extractedComments: comments,
      postId: postId,
      showComments: showComments
    });
  }

  const handleReply = (commentId, userName) => {
    setReplyTo(commentId);
    setReplyToName(userName);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
    setReplyToName('');
  };

  const handleCommentSuccess = () => {
    // Reset reply state
    setReplyTo(null);
    setReplyToName('');
    
    // Call parent callback if provided
    if (onCommentAdded) {
      onCommentAdded();
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  return (
    <div className="border-t border-gray-100">
      {/* Comments Toggle Button */}
      <div className="p-4">
        <button
          onClick={toggleComments}
          className="comments-toggle flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">
            {commentCount > 0 ? `${commentCount} comment${commentCount !== 1 ? 's' : ''}` : 'Add a comment'}
          </span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4 space-y-4">
          {/* Add Comment Form */}
          <CommentForm
            postId={postId}
            onSuccess={handleCommentSuccess}
          />

          {/* Reply Form (if replying) */}
          {replyTo && (
            <div className="ml-8 border-l-2 border-gray-200 pl-4">
              <CommentForm
                postId={postId}
                parentId={replyTo}
                replyTo={replyToName}
                onSuccess={handleCommentSuccess}
                onCancel={handleCancelReply}
              />
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading comments...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-gray-500">
                <p>Failed to load comments</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-blue-600 hover:text-blue-700 mt-2"
                >
                  Try again
                </button>
              </div>
            ) : !Array.isArray(comments) ? (
              <div className="text-center py-8 text-gray-500">
                <p>Error: Comments data is not in the expected format</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-blue-600 hover:text-blue-700 mt-2"
                >
                  Try again
                </button>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium mb-2">No comments yet</p>
                <p className="text-sm">Be the first to share your thoughts!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  postId={postId}
                  onReply={handleReply}
                  onEdit={() => {}} // Handle edit if needed
                  onDelete={() => {}} // Handle delete if needed
                />
              ))
            )}
          </div>

          {/* Load More Comments (if pagination exists) */}
          {commentsData?.data?.next_page_url && (
            <div className="text-center pt-4">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Load more comments
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
