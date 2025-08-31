import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Smile } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const CommentForm = ({ postId, parentId = null, replyTo = null, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  // Focus textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentData) => {
      const response = await api.post(`/posts/${postId}/comments`, commentData);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      
      // Reset form
      setContent('');
      setIsSubmitting(false);
      
      // Call success callback
      if (onSuccess) {
        onSuccess(data);
      }
      
      toast.success('Comment added successfully!');
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast.error(error.response?.data?.message || 'Failed to add comment');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    setIsSubmitting(true);

    const commentData = {
      content: content.trim(),
      ...(parentId && { parent_id: parentId }),
    };

    addCommentMutation.mutate(commentData);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const placeholder = replyTo 
    ? `Reply to ${replyTo}...`
    : parentId 
    ? 'Write a reply...'
    : 'Write a comment...';

  return (
    <div className="flex space-x-3">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {user?.profile?.avatar_url ? (
          <img
            src={user.profile.avatar_url}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Comment Form */}
      <div className="flex-1">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="1"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            
            {/* Emoji button (placeholder for future implementation) */}
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
              </button>
              
              {(parentId || replyTo) && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Character count */}
            <span className={`text-xs ${
              content.length > 900 ? 'text-red-500' : 'text-gray-400'
            }`}>
              {content.length}/1000
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentForm;
