import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  MapPin, 
  Globe, 
  Lock,
  ThumbsUp,
  Smile,
  Trash2,
  Edit3,
  Flag,
  Link as LinkIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import CommentsSection from '../comments/CommentsSection';
import ShareModal from './ShareModal';
import VideoPlayer from '../video/VideoPlayer';
import ImageModal from '../images/ImageModal';

const PostCard = ({ post, onUpdate }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showActions, setShowActions] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Determine if this is a shared post and get the original post
  const isSharedPost = post.is_shared && post.shared_post;
  const originalPost = isSharedPost ? post.shared_post : post;
  const sharedByUser = isSharedPost ? post.user : null;
  
  // Helper functions for image modal
  const openImageModal = (index = 0) => {
    setCurrentImageIndex(index);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setCurrentImageIndex(0);
  };

  // Fallback for when sharedPost relationship isn't loaded
  if (post.is_shared && !post.shared_post) {
    console.warn('⚠️ Shared post missing shared_post relationship:', post.id);
    // Return a placeholder or empty state
    return (
      <div className="bg-white rounded-lg shadow-md border-0 overflow-hidden mb-4 p-4">
        <div className="text-center text-gray-500">
          <p>Shared post content not available</p>
          <p className="text-sm">Post ID: {post.id}</p>
        </div>
      </div>
    );
  }
  
  // Debug logging for shared posts
  useEffect(() => {
    if (post.is_shared) {
      console.log('🔄 Shared Post Debug:', {
        postId: post.id,
        isShared: post.is_shared,
        hasSharedPost: !!post.shared_post,
        sharedPostId: post.shared_post?.id,
        originalContent: post.shared_post?.content,
        originalMedia: post.shared_post?.media,
        sharedByUser: post.user?.name,
        shareContent: post.share_content
      });
    }
  }, [post]);
  
  // Mobile detection - Commented out since video is working on desktop and mobile
  // const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const isLiked = originalPost.likes?.some(like => like.user_id === user?.id);
  const likeCount = originalPost.likes?.length || 0;
  const commentCount = originalPost.comments?.length || 0;
  const shareCount = originalPost.shares?.length || 0;
  const isOwnPost = post.user_id === user?.id;

  // Like/Unlike mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/posts/${originalPost.id}/like`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    },
  });



  // Delete post mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/posts/${post.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      toast.success('Post deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete post');
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };



  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deleteMutation.mutate();
    }
  };

  const toggleContent = () => {
    setShowFullContent(!showFullContent);
  };



  // Reset image loading state when post changes
  useEffect(() => {
    setImageLoading(true);
    // Set a timeout to hide loading state if image takes too long
    const timer = setTimeout(() => {
      setImageLoading(false);
    }, 3000); // Hide loading after 3 seconds
    
    // Debug logging for video posts - Commented out since video is working on desktop and mobile
    // if (post.type === 'video') {
    //   console.log('🎥 PostCard mounted with video post:', {
    //     postId: post.id,
    //     media: post.media,
    //     firstMediaUrl: post.media[0],
    //     isFullUrl: post.media[0]?.startsWith('http'),
    //     constructedUrl: post.media[0]?.startsWith('http') ? post.media[0] : `http://localhost:8000/storage/${post.media[0]}`
    //   });
    // }
    
    return () => clearTimeout(timer);
  }, [post.id]);



  const shouldTruncate = originalPost.content && originalPost.content.length > 200;
  const displayContent = shouldTruncate && !showFullContent 
    ? originalPost.content.substring(0, 200) + '...' 
    : originalPost.content;

  const reactionTypes = [
    { type: 'like', icon: '👍', label: 'Like' },
    { type: 'love', icon: '❤️', label: 'Love' },
    { type: 'haha', icon: '😂', label: 'Haha' },
    { type: 'wow', icon: '😮', label: 'Wow' },
    { type: 'sad', icon: '😢', label: 'Sad' },
    { type: 'angry', icon: '😠', label: 'Angry' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md border-0 overflow-hidden mb-4" data-post-id={post.id}>
      {/* Shared Post Header */}
      {isSharedPost && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Share2 className="w-4 h-4" />
            <Link to={`/profile/${sharedByUser.id}`} className="font-medium hover:text-blue-600 transition-colors">
              {sharedByUser.name}
            </Link>
            <span>shared a post</span>
            <span className="text-gray-400">•</span>
            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
          </div>
          {post.share_content && (
            <div className="mt-2">
              <p className="text-gray-900 text-sm">{post.share_content}</p>
            </div>
          )}
        </div>
      )}

      {/* Original Post Container */}
      <div className={isSharedPost ? "mx-4 mb-4 border border-gray-200 rounded-lg" : ""}>
      {/* Post Header */}
        <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Link to={`/profile/${originalPost.user.id}`} className="flex-shrink-0">
                {originalPost.user?.profile?.avatar_url ? (
                  <img
                    src={originalPost.user.profile.avatar_url}
                    alt={originalPost.user.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                    {originalPost.user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
                )}
            </Link>
            <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                <Link to={`/profile/${originalPost.user.id}`} className="block">
                    <p className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-sm truncate">
                    {originalPost.user?.name}
                </p>
              </Link>
                {originalPost.metadata?.location && (
                  <>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center space-x-1 text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span className="text-xs truncate max-w-[80px]">{originalPost.metadata.location}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                <span>{formatDistanceToNow(new Date(isSharedPost ? originalPost.created_at : post.created_at), { addSuffix: true })}</span>
                <span className="text-gray-400">•</span>
                <div className="flex items-center space-x-1">
                  {originalPost.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  <span>{originalPost.is_public ? 'Public' : 'Friends only'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Post Actions Menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreHorizontal className="h-4 w-4 text-gray-500" />
            </button>

            {showActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-10">
                {isOwnPost ? (
                  <>
                    <button
                      onClick={() => {/* TODO: Edit post */}}
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                    >
                      <Edit3 className="h-4 w-4 text-gray-400" />
                      <span>Edit Post</span>
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Post</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {/* TODO: Report post */}}
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                  >
                    <Flag className="h-4 w-4 text-gray-400" />
                    <span>Report Post</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Content */}
        {originalPost.content && (
          <div className="px-4 pb-3">
            <div className="text-gray-900 leading-relaxed">
              <p className="whitespace-pre-wrap text-sm">{displayContent}</p>
              {shouldTruncate && (
                <button
                  onClick={toggleContent}
                  className="text-blue-600 hover:text-blue-700 font-medium mt-2 text-sm transition-colors"
                >
                  {showFullContent ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
            </div>
          )}

          {/* Media Content - Facebook Style */}
        {originalPost.media && originalPost.media.length > 0 && (
            <div className="relative">
                                       {/* Video Content */}
          {originalPost.type === 'video' ? (
            <div className="relative bg-gray-100 overflow-hidden">
                             {/* Debug info for video - Commented out since video is working on desktop and mobile */}
                             {/* {process.env.NODE_ENV === 'development' && (
                               <div className="mb-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                                 <strong>Video Debug:</strong> {post.media[0]}
                                 <br />
                                 <button 
                                   onClick={() => {
                                     console.log('🔍 Testing video URL:', post.media[0]);
                                     window.open(post.media[0], '_blank');
                                   }}
                                   className="mt-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                 >
                                   Test Video URL
                                 </button>
                                 <button 
                                   onClick={() => {
                                     const fullUrl = post.media[0]?.startsWith('http') ? post.media[0] : `http://localhost:8000/storage/${post.media[0]}`;
                                     console.log('🔗 Testing constructed URL:', fullUrl);
                                     window.open(fullUrl, '_blank');
                                   }}
                                   className="mt-1 ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                 >
                                   Test Full URL
                                 </button>
                               </div>
                             )} */}
                             
                             {/* User Instructions - Commented out since video is working on desktop and mobile */}
                             {/* <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                               💡 <strong>Click the video to play!</strong> The video controls are at the bottom of the player.
                               <br />
                               📱 <strong>Mobile:</strong> Tap the play button overlay or the video controls.
                             </div> */}
                             
                                                          {/* Enhanced Video Debug Logging - Commented out since video is working on desktop and mobile */}
                             {/* {(() => {
                               console.log('🎥 Video Post Debug:', {
                                 postId: post.id,
                                 postType: post.type,
                                 mediaArray: post.media,
                                 firstMedia: post.media[0],
                                 mediaLength: post.media?.length,
                                 isUrl: post.media[0]?.startsWith('http'),
                                 isRelativePath: post.media[0]?.startsWith('posts/'),
                                 fullUrl: post.media[0]?.startsWith('http') ? post.media[0] : `http://localhost:8000/storage/${post.media[0]}`
                               });
                               
                               // Log the actual video src being used
                               console.log('🎬 Video element src:', post.media[0]);
                               return null;
                             })()} */}
                  {/* Professional Video.js Player */}
                  <VideoPlayer
                    src={originalPost.media[0]}
                    poster={originalPost.media[1] || null} // Use second media as poster if available
                    autoplay={false}
                    muted={false}
                    className="w-full h-auto max-h-[500px] rounded-lg overflow-hidden"
                    style={{ minHeight: '200px' }}
                    onReady={(player) => {
                      console.log('🎥 Video.js player ready for post:', originalPost.id);
                      setImageLoading(false);
                    }}
                    onPlay={(player) => {
                      console.log('▶️ Video started playing:', originalPost.media[0]);
                      setVideoPlaying(true);
                    }}
                    onPause={(player) => {
                      console.log('⏸️ Video paused:', originalPost.media[0]);
                      setVideoPlaying(false);
                    }}
                    onEnded={(player) => {
                      console.log('🏁 Video ended:', originalPost.media[0]);
                      setVideoPlaying(false);
                    }}
                  />
                  
                  {/* Loading overlay for video */}
                  {imageLoading && (
                    <div className="absolute inset-0 loading-overlay rounded-lg flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
              ) : (
                /* Simplified Image Display - No ImageViewer wrapper */
                <div className="relative bg-white rounded-lg overflow-hidden">
                  {originalPost.media.length === 1 ? (
                    /* Single Image */
                    <div className="relative bg-gray-50">
                      <img
                        src={originalPost.media[0]}
                        alt="Post image"
                        className="w-full h-auto max-h-[600px] object-cover cursor-pointer block"
                        style={{ 
                          minHeight: '200px',
                          backgroundColor: '#f9fafb',
                          border: 'none'
                        }}
                        onLoad={() => {
                          console.log('✅ Single image loaded:', originalPost.media[0]);
                          setImageLoading(false);
                        }}
                        onError={(e) => {
                          console.error('❌ Single image failed to load:', originalPost.media[0]);
                          setImageLoading(false);
                          e.target.style.backgroundColor = '#fee2e2';
                          e.target.style.color = '#dc2626';
                          e.target.alt = 'Failed to load image';
                        }}
                        onClick={() => openImageModal(0)}
                      />
                      
                      {/* Loading overlay */}
                      {imageLoading && (
                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                      
                      {/* Click hint overlay */}
                      <div className="absolute top-2 right-2 text-white text-xs bg-black/60 px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
                        Click to expand
                      </div>
                    </div>
                  ) : (
                    /* Multiple Images - Simplified without Photo wrapper */
                    <div className="grid gap-1" style={{
                      gridTemplateColumns: originalPost.media.length === 2 ? '1fr 1fr' : 
                                         originalPost.media.length === 3 ? '2fr 1fr' :
                                         originalPost.media.length === 4 ? '1fr 1fr' : '2fr 1fr 1fr',
                      gridTemplateRows: originalPost.media.length === 3 ? '1fr 1fr' :
                                       originalPost.media.length === 4 ? '1fr 1fr' : 
                                       originalPost.media.length > 4 ? '1fr 1fr' : '1fr'
                    }}>
                      {originalPost.media.slice(0, originalPost.media.length > 4 ? 4 : originalPost.media.length).map((image, index) => (
                        <div 
                          key={index}
                          className="relative overflow-hidden cursor-pointer bg-gray-50 rounded"
                          style={{ minHeight: '150px' }}
                          onClick={() => openImageModal(index)}
                        >
                          <img
                            src={image}
                            alt={`Post image ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform block"
                            style={{ 
                              height: index === 0 && originalPost.media.length === 3 ? '320px' : '200px',
                              backgroundColor: '#f9fafb',
                              border: 'none'
                            }}
                            onLoad={() => {
                              console.log(`✅ Image ${index + 1} loaded:`, image);
                              setImageLoading(false);
                            }}
                            onError={(e) => {
                              console.error(`❌ Image ${index + 1} failed:`, image);
                              setImageLoading(false);
                              e.target.style.backgroundColor = '#fee2e2';
                              e.target.style.color = '#dc2626';
                              e.target.alt = `Failed to load image ${index + 1}`;
                            }}
                          />
                          
                          {/* Show +N more for last image if more than 4 images */}
                          {index === 3 && originalPost.media.length > 4 && (
                            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                              <span className="text-white text-2xl font-bold">
                                +{originalPost.media.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
            </div>
        )}
      </div>

      {/* Post Stats */}
      {(likeCount > 0 || commentCount > 0 || shareCount > 0) && (
        <div className="px-4 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-1">
            {likeCount > 0 && (
                <div className="flex items-center space-x-1">
                <div className="flex -space-x-1">
                    <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-white text-xs">👍</span>
                    </div>
                    <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-white text-xs">❤️</span>
                    </div>
                    </div>
                  <button className="text-gray-600 hover:underline">
                    {likeCount} {likeCount === 1 ? 'like' : 'likes'}
                  </button>
                </div>
            )}
            </div>
            <div className="flex items-center space-x-4">
            {commentCount > 0 && (
                <button className="text-gray-600 hover:underline">
                  {commentCount} comment{commentCount !== 1 ? 's' : ''}
                </button>
            )}
            {shareCount > 0 && (
                <button className="text-gray-600 hover:underline">
                  {shareCount} share{shareCount !== 1 ? 's' : ''}
                </button>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Action Buttons */}
      <div className="border-t border-gray-200 px-2 py-1">
        <div className="flex">
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={likeMutation.isLoading}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors flex-1 ${
              isLiked
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="font-medium text-sm">Like</span>
          </button>

          {/* Comment Button */}
          <button
            onClick={() => {
              // This will be handled by the CommentsSection component
              const commentSection = document.querySelector(`[data-post-id="${post.id}"] .comments-toggle`);
              if (commentSection) {
                commentSection.click();
              }
            }}
            className="flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors flex-1"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="font-medium text-sm">Comment</span>
          </button>

          {/* Share Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors flex-1"
          >
            <Share2 className="h-5 w-5" />
            <span className="font-medium text-sm">Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <CommentsSection 
        postId={originalPost.id} 
        commentCount={commentCount}
        onCommentAdded={() => {
          // Refresh post data when comment is added
          queryClient.invalidateQueries({ queryKey: ['posts'] });
          queryClient.invalidateQueries({ queryKey: ['userPosts'] });
        }}
      />

      {/* Click outside to close dropdowns */}
      {showActions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowActions(false)}
        />
      )}



      {/* Share Modal */}
      <ShareModal
        post={originalPost}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      {/* Image Modal */}
      <ImageModal
        isOpen={showImageModal}
        onClose={closeImageModal}
        images={originalPost.media || []}
        currentIndex={currentImageIndex}
      />
    </div>
  );
};

export default PostCard;
