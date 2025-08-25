import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
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

const PostCard = ({ post, onUpdate }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showActions, setShowActions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showFullContent, setShowFullContent] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(false);
  
  // Mobile detection - Commented out since video is working on desktop and mobile
  // const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const isLiked = post.likes?.some(like => like.user_id === user?.id);
  const likeCount = post.likes?.length || 0;
  const commentCount = post.comments?.length || 0;
  const isOwnPost = post.user_id === user?.id;

  // Like/Unlike mutation
  const likeMutation = useMutation(
    async () => {
      const response = await api.post(`/posts/${post.id}/like`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('posts');
      },
    }
  );

  // Add comment mutation
  const commentMutation = useMutation(
    async (content) => {
      const response = await api.post(`/posts/${post.id}/comments`, { content });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('posts');
        setCommentText('');
        toast.success('Comment added successfully!');
      },
      onError: () => {
        toast.error('Failed to add comment');
      },
    }
  );

  // Delete post mutation
  const deleteMutation = useMutation(
    async () => {
      await api.delete(`/posts/${post.id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('posts');
        toast.success('Post deleted successfully!');
      },
      onError: () => {
        toast.error('Failed to delete post');
      },
    }
  );

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleComment = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      commentMutation.mutate(commentText);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deleteMutation.mutate();
    }
  };

  const toggleContent = () => {
    setShowFullContent(!showFullContent);
  };

  const handleImageClick = (index) => {
    if (post.media && post.media.length > 1) {
      setCurrentImageIndex(index);
      setShowImageModal(true);
    }
  };

  const nextImage = () => {
    if (post.media && currentImageIndex < post.media.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
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

  // Keyboard navigation and touch support for image modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showImageModal) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        case 'Escape':
          setShowImageModal(false);
          break;
        default:
          break;
      }
    };

    // Touch/swipe support for mobile
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      if (!showImageModal) return;
      
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = startX - endX;
      const diffY = startY - endY;

      // Only handle horizontal swipes (ignore vertical swipes)
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
          nextImage(); // Swipe left = next image
        } else {
          prevImage(); // Swipe right = previous image
        }
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchend', handleTouchEnd);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.overflow = 'unset';
    };
  }, [showImageModal, currentImageIndex]);

  const shouldTruncate = post.content.length > 200;
  const displayContent = shouldTruncate && !showFullContent 
    ? post.content.substring(0, 200) + '...' 
    : post.content;

  const reactionTypes = [
    { type: 'like', icon: '👍', label: 'Like' },
    { type: 'love', icon: '❤️', label: 'Love' },
    { type: 'haha', icon: '😂', label: 'Haha' },
    { type: 'wow', icon: '😮', label: 'Wow' },
    { type: 'sad', icon: '😢', label: 'Sad' },
    { type: 'angry', icon: '😠', label: 'Angry' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Post Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Link to={`/profile/${post.user.id}`} className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {post.user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/profile/${post.user.id}`} className="block">
                <p className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                  {post.user?.name}
                </p>
              </Link>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                {post.metadata?.location && (
                  <>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{post.metadata.location}</span>
                    </div>
                  </>
                )}
                <span>•</span>
                <div className="flex items-center space-x-1">
                  {post.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  <span>{post.is_public ? 'Public' : 'Friends only'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Post Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreHorizontal className="h-5 w-5 text-gray-500" />
            </button>

            {showActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                {isOwnPost ? (
                  <>
                    <button
                      onClick={() => {/* TODO: Edit post */}}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Post</span>
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Post</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {/* TODO: Report post */}}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                  >
                    <Flag className="h-4 w-4" />
                    <span>Report Post</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <div className="space-y-3">
          {/* Text Content */}
          {post.content && (
            <div className="text-gray-900 leading-relaxed">
              <p className="whitespace-pre-wrap">{displayContent}</p>
              {shouldTruncate && (
                <button
                  onClick={toggleContent}
                  className="text-blue-600 hover:text-blue-700 font-medium mt-2"
                >
                  {showFullContent ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}

          {/* Media Content - Facebook Style */}
          {post.media && post.media.length > 0 && (
            <div className="relative">
              
                                       {/* Video Content */}
                         {post.type === 'video' ? (
                           <div className="relative bg-gray-100 rounded-lg overflow-hidden">
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
                                               <video
                               ref={(el) => {
                                 // Mobile-specific setup - Commented out since video is working on desktop and mobile
                                 // if (el && isMobile) {
                                 //   console.log('📱 Mobile video element ready:', el);
                                 //   // Mobile-specific setup
                                 //   el.addEventListener('touchstart', () => {
                                 //     console.log('📱 Mobile video touch detected');
                                 //   });
                                 // }
                               }}
                               src={post.media[0]}
                               controls
                               playsInline
                               webkit-playsinline="true"
                               x5-playsinline="true"
                               x5-video-player-type="h5"
                               x5-video-player-fullscreen="true"
                               className="w-full h-auto max-h-[500px] object-cover rounded-lg cursor-pointer"
                               style={{ minHeight: '200px' }}
                               onClick={() => {
                                 // Video click logging - Commented out since video is working on desktop and mobile
                                 // console.log('🎬 Video clicked!');
                                 // if (isMobile) {
                                 //   console.log('📱 Mobile video click detected');
                                 // }
                               }}
                    onLoadStart={() => {
                      // Video loading logging - Commented out since video is working on desktop and mobile
                      // console.log('🎬 Video loading started:', post.media[0]);
                      setImageLoading(true);
                    }}
                    onLoadedData={() => {
                      // Video loaded logging - Commented out since video is working on desktop and mobile
                      // console.log('✅ Video loaded successfully:', post.media[0]);
                      setImageLoading(false);
                    }}
                    onError={(e) => {
                      setImageLoading(false);
                      console.error('❌ Video failed to load:', {
                        src: post.media[0]
                        // Mobile-specific error info - Commented out since video is working on desktop and mobile
                        // isMobile: isMobile,
                        // userAgent: navigator.userAgent
                      });
                      // Show a nice placeholder if video fails to load
                      e.target.style.display = 'none';
                      const placeholder = document.createElement('div');
                      placeholder.className = 'w-full h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex flex-col items-center justify-center text-gray-500';
                      placeholder.innerHTML = `
                        <svg class="w-16 h-16 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p class="text-sm font-medium">Video not available</p>
                      `;
                      e.target.parentNode.appendChild(placeholder);
                    }}
                    // Video state logging - Commented out since video is working on desktop and mobile
                    // onCanPlay={() => console.log('🎯 Video can play:', post.media[0])}
                    // onCanPlayThrough={() => console.log('🚀 Video can play through:', post.media[0])}
                    // onWaiting={() => console.log('⏳ Video waiting for data:', post.media[0])}
                    // onStalled={() => console.log('🔄 Video stalled:', post.media[0])}
                    onPlay={() => {
                      // Video play logging - Commented out since video is working on desktop and mobile
                      // console.log('▶️ Video started playing:', post.media[0]);
                      setVideoPlaying(true);
                    }}
                    onPause={() => {
                      // Video pause logging - Commented out since video is working on desktop and mobile
                      // console.log('⏸️ Video paused:', post.media[0]);
                      setVideoPlaying(false);
                    }}
                    // Mobile-specific event handlers - Commented out since video is working on desktop and mobile
                    // onTouchStart={() => console.log('📱 Video touch started:', post.media[0])}
                    // onTouchEnd={() => console.log('📱 Video touch ended:', post.media[0])}
                    // onLoadedMetadata={() => console.log('📱 Video metadata loaded for mobile:', post.media[0])}
                  />
                  
                  {/* Video Play Button Overlay - Only show when video is paused */}
                  {!videoPlaying && (
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const videoElement = e.target.closest('.relative').querySelector('video');
                          if (videoElement) {
                            // Play button logging - Commented out since video is working on desktop and mobile
                            // console.log('🎬 Play button clicked for mobile!');
                            videoElement.play().catch(err => {
                              // Mobile video play error logging - Commented out since video is working on desktop and mobile
                              // console.error('❌ Mobile video play failed:', err);
                            });
                          }
                        }}
                        className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <svg className="w-8 h-8 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 5v10l8-5-8-5z" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {/* Loading overlay for video */}
                  {imageLoading && (
                    <div className="absolute inset-0 loading-overlay rounded-lg flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
              ) : (
                /* Image Content - Facebook Style */
                <div className="relative cursor-pointer group bg-gray-100 rounded-lg" onClick={() => handleImageClick(0)}>
                  {/* Always show the image - no more black screen! */}
                  <img
                    src={post.media[0]}
                    alt="Post image"
                    className="w-full h-auto max-h-[500px] object-cover rounded-lg relative z-20"
                    style={{ minHeight: '200px' }}
                    onLoad={() => {
                      setImageLoading(false);
                    }}
                        onError={(e) => {
                      setImageLoading(false);
                      // Show a nice placeholder if image fails to load
                          e.target.style.display = 'none';
                      // Create a fallback placeholder
                      const placeholder = document.createElement('div');
                      placeholder.className = 'w-full h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex flex-col items-center justify-center text-gray-500';
                      placeholder.innerHTML = `
                        <svg class="w-16 h-16 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p class="text-sm font-medium">Image not available</p>
                      `;
                      e.target.parentNode.appendChild(placeholder);
                    }}
                  />
                  
                  {/* Fallback display - only show when image fails */}
                  <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                    <div className="text-center text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-medium">Click to view photos</p>
                    </div>
                  </div>
                  
                  {/* Loading overlay - only show when actually loading */}
                  {imageLoading && (
                    <div className="absolute inset-0 loading-overlay rounded-lg flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  
                  {/* Multiple Images Indicator - Facebook Style */}
                  {post.media.length > 1 && (
                    <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
                      +{post.media.length - 1}
                    </div>
                  )}
                  
                  {/* Click to view overlay - Facebook Style */}
                  {post.media.length > 1 && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <div className="bg-white bg-opacity-90 text-gray-800 px-4 py-2 rounded-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Click to view all photos
                        </div>
                      </div>
                    )}
                  </div>
              )}
              
              {/* Navigation Dots - Only for multiple images */}
              {post.type === 'image' && post.media.length > 1 && (
                <div className="flex justify-center space-x-2 mt-3">
                  {post.media.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Post Type Badge */}
          {post.type !== 'text' && (
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {post.type === 'image' && '🖼️ Photo'}
              {post.type === 'video' && '🎥 Video'}
              {post.type === 'link' && '🔗 Link'}
            </div>
          )}
        </div>
      </div>

      {/* Post Stats */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            {likeCount > 0 && (
              <span className="flex items-center space-x-1">
                <div className="flex -space-x-1">
                  {reactionTypes.slice(0, 3).map((reaction, index) => (
                    <div
                      key={index}
                      className="w-5 h-5 bg-white rounded-full border-2 border-gray-50 flex items-center justify-center text-xs"
                    >
                      {reaction.icon}
                    </div>
                  ))}
                </div>
                <span>{likeCount}</span>
              </span>
            )}
            {commentCount > 0 && (
              <span>{commentCount} comment{commentCount !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={likeMutation.isLoading}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors flex-1 justify-center ${
              isLiked
                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="font-medium">Like</span>
          </button>

          {/* Comment Button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors flex-1 justify-center"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="font-medium">Comment</span>
          </button>

          {/* Share Button */}
          <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors flex-1 justify-center">
            <Share2 className="h-5 w-5" />
            <span className="font-medium">Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Add Comment */}
          <form onSubmit={handleComment} className="flex space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={!commentText.trim() || commentMutation.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {commentMutation.isLoading ? 'Posting...' : 'Post'}
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            {post.comments?.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {comment.user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="font-medium text-sm text-gray-900">
                      {comment.user?.name}
                    </p>
                    <p className="text-gray-800">{comment.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {showActions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowActions(false)}
        />
      )}

      {/* Image Modal - Facebook Style */}
      {showImageModal && post.media && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative max-w-4xl max-h-full">
            {/* Close Button */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Main Image */}
            <img
              src={post.media[currentImageIndex]}
              alt={`Post image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Navigation Arrows */}
            {post.media.length > 1 && (
              <>
                {/* Previous Button */}
                {currentImageIndex > 0 && (
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                {/* Next Button */}
                {currentImageIndex < post.media.length - 1 && (
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} of {post.media.length}
                </div>

                {/* Thumbnail Navigation */}
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {post.media.map((media, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex ? 'border-blue-500' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={media}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
