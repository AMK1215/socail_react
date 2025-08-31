import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Share2, MessageSquare, Copy, Globe, Users, Lock, ChevronDown } from 'lucide-react';
import { shareService } from '../../services/shareService';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

const ShareModal = ({ post, isOpen, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [shareContent, setShareContent] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline');

  // Get user's conversations for messaging option
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await api.get('/conversations');
      return response.data.data || [];
    },
    enabled: isOpen && activeTab === 'message',
  });

  // Share to timeline mutation
  const shareToTimelineMutation = useMutation({
    mutationFn: async (shareData) => {
      return await shareService.sharePost(post.id, shareData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      toast.success('Post shared to your timeline!');
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to share post');
    },
  });

  // Share to story mutation
  const shareToStoryMutation = useMutation({
    mutationFn: async () => {
      return await shareService.sharePost(post.id, {
        share_type: 'story',
        privacy: 'public',
      });
    },
    onSuccess: () => {
      toast.success('Post shared to your story!');
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to share to story');
    },
  });

  // Copy link mutation
  const copyLinkMutation = useMutation({
    mutationFn: async () => {
      const result = await shareService.copyPostLink(post.id);
      const success = await shareService.copyToClipboard(result.data.link);
      if (!success) {
        throw new Error('Failed to copy to clipboard');
      }
      return result;
    },
    onSuccess: () => {
      toast.success('Link copied to clipboard!');
      onClose();
    },
    onError: () => {
      toast.error('Failed to copy link');
    },
  });

  // Share via native share API
  const handleNativeShare = async () => {
    const shared = await shareService.nativeShare(post);
    if (shared) {
      onClose();
    } else {
      // Fallback to copy link
      copyLinkMutation.mutate();
    }
  };

  const handleShareToTimeline = () => {
    shareToTimelineMutation.mutate({
      share_type: 'timeline',
      content: shareContent,
      privacy: privacy,
    });
  };

  const handleShareToMessage = (conversationId) => {
    shareService.shareToMessage(post.id, conversationId, shareContent)
      .then(() => {
        toast.success('Post shared in conversation!');
        onClose();
      })
      .catch(() => {
        toast.error('Failed to share to conversation');
      });
  };

  const privacyOptions = [
    { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can see this' },
    { value: 'friends', label: 'Friends', icon: Users, description: 'Only your friends can see this' },
    { value: 'only_me', label: 'Only me', icon: Lock, description: 'Only you can see this' },
  ];

  const shareOptions = [
    {
      id: 'timeline',
      title: 'Share to Timeline',
      description: 'Share this post on your timeline',
      icon: Share2,
      color: 'blue',
      action: () => setActiveTab('timeline'),
    },
    {
      id: 'story',
      title: 'Share to Story',
      description: 'Share this post to your story',
      icon: Share2,
      color: 'purple',
      action: () => shareToStoryMutation.mutate(),
      loading: shareToStoryMutation.isLoading,
    },
    {
      id: 'message',
      title: 'Send in Message',
      description: 'Share this post in a conversation',
      icon: MessageSquare,
      color: 'green',
      action: () => setActiveTab('message'),
    },
    {
      id: 'copy',
      title: 'Copy Link',
      description: 'Copy link to this post',
      icon: Copy,
      color: 'gray',
      action: () => copyLinkMutation.mutate(),
      loading: copyLinkMutation.isLoading,
    },
  ];

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Share Post</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {activeTab === 'timeline' ? (
            /* Timeline Share Form */
            <div className="p-4">
              {/* User Info */}
              <div className="flex items-center space-x-3 mb-4">
                {user?.profile?.avatar_url ? (
                  <img
                    src={user.profile.avatar_url}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{user?.name}</p>
                  {/* Privacy Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setShowPrivacyDropdown(!showPrivacyDropdown)}
                      className="flex items-center space-x-1 text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      {React.createElement(privacyOptions.find(opt => opt.value === privacy)?.icon, { className: "w-3 h-3" })}
                      <span>{privacyOptions.find(opt => opt.value === privacy)?.label}</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {showPrivacyDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        {privacyOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setPrivacy(option.value);
                              setShowPrivacyDropdown(false);
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                          >
                            <option.icon className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{option.label}</p>
                              <p className="text-xs text-gray-500">{option.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Comment Input */}
              <textarea
                value={shareContent}
                onChange={(e) => setShareContent(e.target.value)}
                placeholder="Say something about this..."
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />

              {/* Original Post Preview */}
              <div className="mt-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2 mb-2">
                  {post.user?.profile?.avatar_url ? (
                    <img
                      src={post.user.profile.avatar_url}
                      alt={post.user.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-xs">
                        {post.user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900">{post.user?.name}</span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-3">{post.content}</p>
                {post.media && post.media.length > 0 && (
                  <div className="mt-2">
                    <img
                      src={post.media[0]}
                      alt="Post media"
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>

              {/* Share Button */}
              <button
                onClick={handleShareToTimeline}
                disabled={shareToTimelineMutation.isLoading}
                className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {shareToTimelineMutation.isLoading ? 'Sharing...' : 'Share to Timeline'}
              </button>
            </div>
          ) : activeTab === 'message' ? (
            /* Message Share */
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">Choose a conversation to share this post:</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {conversations.map((conversation) => {
                  const otherUser = conversation.users?.find(u => u.id !== user.id);
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => handleShareToMessage(conversation.id)}
                      className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      {otherUser?.profile?.avatar_url ? (
                        <img
                          src={otherUser.profile.avatar_url}
                          alt={otherUser.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{otherUser?.name || 'Unknown User'}</p>
                        <p className="text-sm text-gray-500">Send post</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Share Options */
            <div className="p-4">
              <div className="space-y-3">
                {shareOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={option.action}
                    disabled={option.loading}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
                  >
                    <div className={`w-10 h-10 bg-${option.color}-100 rounded-full flex items-center justify-center`}>
                      <option.icon className={`w-5 h-5 text-${option.color}-600`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{option.title}</p>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                    {option.loading && (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin ml-auto"></div>
                    )}
                  </button>
                ))}

                {/* Native Share (Mobile) */}
                {navigator.share && (
                  <button
                    onClick={handleNativeShare}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Share2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Share...</p>
                      <p className="text-sm text-gray-500">Use your device's share menu</p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer for timeline tab */}
        {activeTab === 'timeline' && (
          <div className="border-t border-gray-200 p-3">
            <button
              onClick={() => setActiveTab('options')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ← More sharing options
            </button>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};

export default ShareModal;
