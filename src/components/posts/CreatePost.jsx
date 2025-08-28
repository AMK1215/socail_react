import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../layout/Layout';
import { 
  X, 
  Image, 
  Video, 
  Link as LinkIcon, 
  Smile, 
  MapPin, 
  Globe, 
  Lock,
  Upload,
  Trash2,
  Camera,
  Mic,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';

const CreatePost = ({ onClose, onPostCreated }) => {
  const { user } = useAuth();
  const { setIsModalOpen } = useModal() || {};
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [postType, setPostType] = useState('text');
  const [isPublic, setIsPublic] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [location, setLocation] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Set modal state when component mounts/unmounts
  useEffect(() => {
    if (setIsModalOpen) {
      setIsModalOpen(true);
      return () => setIsModalOpen(false);
    }
  }, [setIsModalOpen]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm();

  const content = watch('content', '');

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();
      formData.append('content', data.content);
      formData.append('type', postType);
      formData.append('is_public', isPublic ? '1' : '0');
      
      if (location) {
        formData.append('metadata', JSON.stringify({ location }));
      }

      // Add files
      selectedFiles.forEach((file, index) => {
        formData.append(`media[${index}]`, file);
      });

      const response = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post created successfully!');
      handleClose();
      onPostCreated?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create post');
    },
  });

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Automatically set post type based on file types
    if (validFiles.length > 0) {
      const hasImages = validFiles.some(file => file.type.startsWith('image/'));
      const hasVideos = validFiles.some(file => file.type.startsWith('video/'));
      
      if (hasImages && !hasVideos) {
        setPostType('image');
      } else if (hasVideos && !hasImages) {
        setPostType('video');
      } else if (hasImages && hasVideos) {
        setPostType('image'); // Default to image if mixed
      }
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      
      // Update post type based on remaining files
      if (newFiles.length === 0) {
        setPostType('text');
      } else {
        const hasImages = newFiles.some(file => file.type.startsWith('image/'));
        const hasVideos = newFiles.some(file => file.type.startsWith('video/'));
        
        if (hasImages && !hasVideos) {
          setPostType('image');
        } else if (hasVideos && !hasImages) {
          setPostType('video');
        } else if (hasImages && hasVideos) {
          setPostType('image'); // Default to image if mixed
        }
      }
      
      return newFiles;
    });
  };

  const handleSubmitPost = (data) => {
    if (!data.content.trim() && selectedFiles.length === 0) {
      toast.error('Please add some content or media to your post');
      return;
    }

    createPostMutation.mutate(data);
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setPostType('text');
    setIsPublic(true);
    setLocation('');
    setShowEmojiPicker(false);
    reset();
    onClose();
  };

  const emojis = ['😊', '❤️', '👍', '🎉', '🔥', '😍', '🤔', '😂', '😭', '😡', '🥳', '✨', '💯', '🚀', '💪', '👏', '🙌', '🤝', '💡', '🎯'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
      {/* Mobile-first modal - slides up from bottom on mobile */}
      <div className="bg-white w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:w-full rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        
        {/* Enhanced Header with drag indicator */}
        <div className="relative">
          {/* Mobile drag indicator */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>
          
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg sm:text-base">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg sm:text-lg font-bold text-gray-900">{user?.name}</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors p-1.5 rounded-lg hover:bg-white/50 active:scale-95"
                  >
                    {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    <span className="font-medium">{isPublic ? 'Public' : 'Friends only'}</span>
                  </button>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleClose}
              className="p-2.5 sm:p-2 hover:bg-white/50 rounded-full transition-all duration-200 active:scale-95"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* Enhanced Post Type Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-base sm:text-sm font-semibold text-gray-700">Post Type</h4>
              {selectedFiles.length > 0 && (
                <div className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                  Auto-detected: {postType === 'image' ? '🖼️ Photo' : postType === 'video' ? '🎥 Video' : '📝 Text'}
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[
                { type: 'text', icon: '📝', label: 'Text', color: 'from-blue-500 to-blue-600' },
                { type: 'image', icon: '🖼️', label: 'Photo', color: 'from-green-500 to-green-600' },
                { type: 'video', icon: '🎥', label: 'Video', color: 'from-purple-500 to-purple-600' },
                { type: 'link', icon: '🔗', label: 'Link', color: 'from-orange-500 to-orange-600' },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => setPostType(item.type)}
                  disabled={selectedFiles.length > 0 && item.type !== 'text' && item.type !== postType}
                  className={`flex flex-col items-center space-y-2 p-4 sm:p-3 rounded-2xl text-sm font-medium transition-all duration-200 active:scale-95 ${
                    postType === item.type
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg scale-105 border-2 border-white`
                      : selectedFiles.length > 0 && item.type !== 'text' && item.type !== postType
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-102 border-2 border-transparent'
                  }`}
                >
                  <span className="text-2xl sm:text-xl">{item.icon}</span>
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              ))}
            </div>
            {selectedFiles.length > 0 && (
              <p className="text-xs text-gray-500 text-center bg-gray-50 rounded-lg p-2">
                📱 Post type automatically set based on your media files
              </p>
            )}
          </div>

          {/* Enhanced Post Content */}
          <div className="space-y-4">
            <div className="relative">
              <textarea
                {...register('content', {
                  maxLength: {
                    value: 5000,
                    message: 'Post content cannot exceed 5000 characters',
                  },
                })}
                placeholder={`What's on your mind, ${user?.name?.split(' ')[0]}?`}
                className="w-full p-4 sm:p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base sm:text-base leading-relaxed bg-gray-50 focus:bg-white transition-colors min-h-[120px] sm:min-h-[100px]"
                rows={6}
                style={{ fontSize: '16px' }} // Prevents zoom on iOS
              />
              
              {/* Character Counter with Progress Bar */}
              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">{content.length}/5000 characters</span>
                  {content.length > 4000 && (
                    <span className="text-orange-600 font-semibold bg-orange-50 px-2 py-1 rounded-full text-xs">
                      {5000 - content.length} remaining
                    </span>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      content.length > 4500 ? 'bg-red-500' :
                      content.length > 4000 ? 'bg-orange-500' : 
                      'bg-gradient-to-r from-blue-500 to-purple-500'
                    }`}
                    style={{ width: `${Math.min((content.length / 5000) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {errors.content && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600 font-medium">{errors.content.message}</p>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Media Upload */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base sm:text-sm font-semibold text-gray-700">Media Files</h4>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border-2 border-gray-200 shadow-sm">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex flex-col items-center justify-center">
                          <Video className="h-8 w-8 text-purple-500 mb-2" />
                          <span className="text-xs text-purple-600 font-medium">Video</span>
                        </div>
                      )}
                      
                      {/* File overlay info */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2">
                        <div className="text-white text-xs font-medium truncate">
                          {file.name}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg hover:scale-110 active:scale-95"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    
                    {/* File size indicator */}
                    <div className="mt-2 text-center">
                      <p className="text-xs text-gray-500 truncate">
                        {(file.size / (1024 * 1024)).toFixed(1)}MB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Location Input */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2 text-base sm:text-sm font-semibold text-gray-700">
              <MapPin className="h-5 w-5 sm:h-4 sm:w-4 text-blue-500" />
              <span>Add Location (Optional)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where are you?"
              className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-gray-50 focus:bg-white transition-colors"
              style={{ fontSize: '16px' }} // Prevents zoom on iOS
            />
          </div>
        </div>

        {/* Enhanced Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-gray-100 bg-white sm:bg-gray-50 space-y-4">
          
          {/* Quick Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Enhanced File Upload */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 sm:p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 border border-transparent hover:border-blue-200"
                title="Add media"
              >
                <Camera className="h-6 w-6 sm:h-5 sm:w-5" />
              </button>

              {/* Voice Recording (Placeholder) */}
              <button
                type="button"
                onClick={() => setIsRecording(!isRecording)}
                className={`p-3 sm:p-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 border ${
                  isRecording 
                    ? 'text-red-600 bg-red-50 border-red-200' 
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50 border-transparent hover:border-red-200'
                }`}
                title="Voice message"
              >
                <Mic className="h-6 w-6 sm:h-5 sm:w-5" />
              </button>

              {/* Enhanced Emoji Picker */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-3 sm:p-3 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 border border-transparent hover:border-yellow-200"
                title="Add emoji"
              >
                <Smile className="h-6 w-6 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Enhanced Post Button */}
            <button
              onClick={handleSubmit(handleSubmitPost)}
              disabled={createPostMutation.isLoading || (!content.trim() && selectedFiles.length === 0)}
              className="px-6 py-3 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center space-x-2 font-semibold"
            >
              {createPostMutation.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                  <span className="text-base sm:text-sm">Posting...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span className="text-base sm:text-sm">Post</span>
                </>
              )}
            </button>
          </div>

          {/* Enhanced Emoji Picker */}
          {showEmojiPicker && (
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-lg animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-semibold text-gray-700">Add Emoji</h5>
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-2 max-h-40 overflow-y-auto">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const textarea = document.querySelector('textarea[name="content"]');
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const newContent = content.substring(0, start) + emoji + content.substring(end);
                        textarea.value = newContent;
                        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
                        textarea.focus();
                      }
                      setShowEmojiPicker(false);
                    }}
                    className="text-2xl hover:bg-gray-100 rounded-lg p-2 transition-all duration-200 hover:scale-110 active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default CreatePost;
