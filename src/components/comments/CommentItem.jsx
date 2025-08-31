import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, MoreHorizontal, Edit, Trash2, Reply } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const CommentItem = ({ comment, postId, onReply, onEdit, onDelete }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isOwnComment = comment.user_id === user?.id;
  const isLiked = comment.likes?.some(like => like.user_id === user?.id);
  const likeCount = comment.likes?.length || 0;

  // Like/Unlike comment mutation
  const likeMutation = useMutation({
    mutationFn: () => api.post(`/comments/${comment.id}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });

  // Update comment mutation
  const updateMutation = useMutation({
    mutationFn: (content) => api.put(`/comments/${comment.id}`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      setIsEditing(false);
      toast.success('Comment updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update comment');
    },
  });

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/comments/${comment.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      toast.success('Comment deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    },
  });

  const handleLike = () => {
    if (!user) {
      toast.error('Please login to like comments');
      return;
    }
    likeMutation.mutate();
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowActions(false);
  };

  const handleSave = () => {
    if (editContent.trim() === '') {
      toast.error('Comment content cannot be empty');
      return;
    }
    updateMutation.mutate(editContent);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteMutation.mutate();
    }
    setShowActions(false);
  };

  const handleReply = () => {
    onReply(comment.id, comment.user?.name);
    setShowActions(false);
  };

  return (
    <div className="flex space-x-3 group">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {comment.user?.profile?.avatar_url ? (
          <img
            src={comment.user.profile.avatar_url}
            alt={comment.user.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {comment.user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Comment Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          {/* Comment Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <p className="font-medium text-sm text-gray-900">
                {comment.user?.name}
              </p>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
              {comment.is_edited && (
                <span className="text-xs text-gray-400">(edited)</span>
              )}
            </div>

            {/* Actions Menu */}
            {(isOwnComment || user?.id === comment.post?.user_id) && (
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {showActions && (
                  <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    <button
                      onClick={handleReply}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <Reply className="w-4 h-4" />
                      <span>Reply</span>
                    </button>
                    {isOwnComment && (
                      <>
                        <button
                          onClick={handleEdit}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={handleDelete}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comment Text */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="2"
                placeholder="Edit your comment..."
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isLoading}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {updateMutation.isLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>
          )}
        </div>

        {/* Comment Actions */}
        <div className="flex items-center space-x-4 mt-2">
          <button
            onClick={handleLike}
            disabled={likeMutation.isLoading}
            className={`flex items-center space-x-1 text-xs transition-colors ${
              isLiked
                ? 'text-red-500 hover:text-red-600'
                : 'text-gray-500 hover:text-gray-600'
            }`}
          >
            <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
            <span>{likeCount > 0 ? likeCount : 'Like'}</span>
          </button>

          <button
            onClick={handleReply}
            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-600 transition-colors"
          >
            <MessageCircle className="w-3 h-3" />
            <span>Reply</span>
          </button>
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {showActions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
};

export default CommentItem;
