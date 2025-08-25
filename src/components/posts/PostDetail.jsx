import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Heart, MessageCircle, Share2, MoreHorizontal, ArrowLeft, Edit, Trash2, Flag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { usePostUpdates } from '../../hooks/useBroadcasting';

const PostDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [showOptions, setShowOptions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');

    // Fetch post details
    const { data: postData, isLoading, error } = useQuery(
        ['post', id],
        () => api.get(`/posts/${id}`),
        {
            enabled: !!id,
        }
    );

    const post = postData?.data;

    // Like/Unlike mutation
    const likeMutation = useMutation(
        () => api.post(`/posts/${id}/like`),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['post', id]);
                queryClient.invalidateQueries('posts');
            },
        }
    );

    // Update post mutation
    const updateMutation = useMutation(
        (content) => api.put(`/posts/${id}`, { content }),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['post', id]);
                queryClient.invalidateQueries('posts');
                setIsEditing(false);
                toast.success('Post updated successfully');
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || 'Failed to update post');
            },
        }
    );

    // Delete post mutation
    const deleteMutation = useMutation(
        () => api.delete(`/posts/${id}`),
        {
            onSuccess: () => {
                toast.success('Post deleted successfully');
                navigate('/');
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || 'Failed to delete post');
            },
        }
    );

    // Real-time updates for this post
    usePostUpdates(id, (data) => {
        if (data.type === 'post_liked') {
            queryClient.invalidateQueries(['post', id]);
        }
    });

    useEffect(() => {
        if (post) {
            setEditContent(post.content);
        }
    }, [post]);

    const handleLike = () => {
        if (!user) {
            toast.error('Please login to like posts');
            return;
        }
        likeMutation.mutate();
    };

    const handleEdit = () => {
        setIsEditing(true);
        setShowOptions(false);
    };

    const handleSave = () => {
        if (editContent.trim() === '') {
            toast.error('Post content cannot be empty');
            return;
        }
        updateMutation.mutate(editContent);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditContent(post?.content || '');
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            deleteMutation.mutate();
        }
        setShowOptions(false);
    };

    const isLiked = post?.likes?.some(like => like.user_id === user?.id);
    const likeCount = post?.likes?.length || 0;
    const commentCount = post?.comments?.length || 0;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="animate-pulse">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="h-4 bg-gray-200 rounded"></div>
                                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Post not found</h2>
                        <p className="text-gray-500 mb-4">The post you're looking for doesn't exist or has been removed.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Go back home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-3">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-lg font-semibold text-gray-900">Post</h1>
                        {user?.id === post.user_id && (
                            <div className="ml-auto relative">
                                <button
                                    onClick={() => setShowOptions(!showOptions)}
                                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                                
                                {showOptions && (
                                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px] z-20">
                                        <button
                                            onClick={handleEdit}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                        >
                                            <Edit className="w-4 h-4" />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Post Content */}
            <div className="max-w-2xl mx-auto p-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Post Header */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-lg">
                                    {post.user?.name?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{post.user?.name}</h3>
                                <p className="text-sm text-gray-500">
                                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Post Content */}
                    <div className="p-4">
                        {isEditing ? (
                            <div className="space-y-3">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows={4}
                                    placeholder="What's on your mind?"
                                />
                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={updateMutation.isLoading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {updateMutation.isLoading ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                                    {post.content}
                                </p>
                                
                                {/* Media Display */}
                                {post.media && post.media.length > 0 && (
                                    <div className="space-y-2">
                                        {post.media.map((media, index) => (
                                            <div key={index} className="rounded-lg overflow-hidden">
                                                {media.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                                    <img
                                                        src={`/storage/${media}`}
                                                        alt={`Post media ${index + 1}`}
                                                        className="w-full h-auto max-h-96 object-cover"
                                                    />
                                                ) : (
                                                    <video
                                                        src={`/storage/${media}`}
                                                        controls
                                                        className="w-full h-auto max-h-96"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Post Actions */}
                    <div className="px-4 py-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                                <button
                                    onClick={handleLike}
                                    disabled={likeMutation.isLoading}
                                    className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                                        isLiked
                                            ? 'text-red-500 hover:bg-red-50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                >
                                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                                    <span className="text-sm font-medium">{likeCount}</span>
                                </button>
                                
                                <button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                    <MessageCircle className="w-5 h-5" />
                                    <span className="text-sm font-medium">{commentCount}</span>
                                </button>
                                
                                <button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                    <Share2 className="w-5 h-5" />
                                    <span className="text-sm font-medium">Share</span>
                                </button>
                            </div>
                            
                            {user?.id !== post.user_id && (
                                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                    <Flag className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">Comments ({commentCount})</h3>
                    </div>
                    
                    {commentCount > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {post.comments?.map((comment) => (
                                <div key={comment.id} className="p-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                            <span className="text-white font-semibold text-sm">
                                                {comment.user?.name?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="font-medium text-gray-900">
                                                    {comment.user?.name}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-gray-700">{comment.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
                            <p className="text-gray-500">Be the first to share your thoughts!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostDetail;
