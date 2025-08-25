import React, { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Edit3, 
  Camera, 
  MapPin, 
  Globe, 
  Link as LinkIcon, 
  Calendar, 
  Users, 
  Settings,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  UserPlus,
  Check,
  X,
  Trash2,
  Flag
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import PostCard from '../posts/PostCard';
import FriendshipButton from '../friendship/FriendshipButton';
import FriendshipStatus from '../friendship/FriendshipStatus';
import FriendsList from '../friendship/FriendsList';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showCoverEdit, setShowCoverEdit] = useState(false);
  const [showAvatarEdit, setShowAvatarEdit] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);

  const isOwnProfile = !userId || userId === currentUser?.id?.toString();
  const profileUserId = userId || currentUser?.id;



  // Fetch profile data
  const { data: profileData, isLoading, error } = useQuery(
    ['profile', profileUserId],
    async () => {
      if (isOwnProfile) {
        const response = await api.get('/me');
        return response.data.data.user;
      } else {
        const response = await api.get(`/profiles/${profileUserId}`);
        return response.data.data;
      }
    },
    {
      enabled: !!profileUserId,
    }
  );

  // Fetch user posts
  const { data: postsData, error: postsError, isLoading: postsLoading } = useQuery(
    ['userPosts', profileUserId],
    async () => {
      const response = await api.get(`/users/${profileUserId}/posts`);
      return response.data.data;
    },
    {
      enabled: !!profileUserId,
    }
  );



  // Update profile mutation
  const updateProfileMutation = useMutation(
    async (data) => {
      const response = await api.put('/profiles', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile', profileUserId]);
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        setShowCoverEdit(false);
        setShowAvatarEdit(false);
      },
      onError: (error) => {
        console.error('Profile update error:', error.response?.data);
        toast.error(error.response?.data?.message || 'Failed to update profile');
      },
    }
  );

  // Send friend request mutation
  const sendFriendRequestMutation = useMutation(
    async () => {
      const response = await api.post(`/friends/${profileUserId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile', profileUserId]);
        toast.success('Friend request sent!');
      },
      onError: () => {
        toast.error('Failed to send friend request');
      },
    }
  );

  // Respond to friend request mutation
  const respondToFriendRequestMutation = useMutation(
    async ({ friendshipId, action }) => {
      const response = await api.put(`/friends/${friendshipId}`, { action });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile', profileUserId]);
        toast.success('Friend request updated!');
      },
      onError: () => {
        toast.error('Failed to update friend request');
      },
    }
  );

  const handleProfileUpdate = (data) => {
    // If data is FormData (from file upload), use it directly
    if (data instanceof FormData) {
      updateProfileMutation.mutate(data);
    } else {
      // If data is an object (from profile edit), convert to FormData
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          if (key === 'social_links') {
            formData.append(key, JSON.stringify(data[key]));
          } else {
            formData.append(key, data[key]);
          }
        }
      });
      updateProfileMutation.mutate(formData);
    }
  };

  const handleSendFriendRequest = () => {
    sendFriendRequestMutation.mutate();
  };

  const handleFriendRequestResponse = (friendshipId, action) => {
    respondToFriendRequestMutation.mutate({ friendshipId, action });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading profile</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const user = profileData;
  const profile = user?.profile;
  const posts = postsData?.data || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Photo */}
      <div className="relative h-48 sm:h-64 lg:h-80 bg-gradient-to-r from-blue-600 to-purple-600">
        {profile?.cover_photo_url && (
          <img
            src={profile.cover_photo_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Cover Photo Edit Button */}
        {isOwnProfile && (
          <button
            onClick={() => setShowCoverEdit(true)}
            className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
          >
            <Camera className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Profile Info Section */}
      <div className="relative px-4 sm:px-6 lg:px-8 -mt-20">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-3xl sm:text-4xl">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* Avatar Edit Button */}
              {isOwnProfile && (
                <button
                  onClick={() => setShowAvatarEdit(true)}
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-lg"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{user.name}</h1>
                  {profile?.username && (
                    <p className="text-lg text-gray-600">@{profile.username}</p>
                  )}
                  {profile?.bio && (
                    <p className="text-gray-700 mt-2 max-w-2xl">{profile.bio}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  {isOwnProfile ? (
                    <button
                      onClick={() => setShowEditProfile(true)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
                      <FriendshipStatus currentUserId={user.id} targetUserId={profileUserId} />
                      <FriendshipButton 
                        targetUserId={profileUserId} 
                        currentUserId={user.id}
                        initialStatus={null}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Details */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile?.location && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                
                {profile?.birth_date && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(profile.birth_date).toLocaleDateString()}</span>
                  </div>
                )}
                
                {profile?.website && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <LinkIcon className="h-4 w-4" />
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Website
                    </a>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {profile?.social_links && Object.keys(profile.social_links).length > 0 && (
                <div className="mt-4 flex space-x-3">
                  {Object.entries(profile.social_links).map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title={platform}
                    >
                      <span className="text-lg">
                        {platform === 'facebook' && '📘'}
                        {platform === 'twitter' && '🐦'}
                        {platform === 'instagram' && '📷'}
                        {platform === 'linkedin' && '💼'}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button 
                onClick={() => setActiveTab('posts')}
                className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === 'posts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Posts
              </button>
              <button 
                onClick={() => setActiveTab('photos')}
                className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === 'photos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Photos
              </button>
              <button 
                onClick={() => setActiveTab('friends')}
                className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === 'friends'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Friends
              </button>
              <button 
                onClick={() => setActiveTab('about')}
                className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === 'about'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                About
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'posts' && (
              <div className="space-y-6">
                {posts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                    <p className="text-gray-500">
                      {isOwnProfile 
                        ? "Share your first post with friends!" 
                        : `${user.name} hasn't shared any posts yet.`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                      <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Post Preview */}
                        <div className="p-4">
                          <p className="text-gray-900 line-clamp-3">{post.content}</p>
                        </div>
                        
                        {/* Post Media Preview */}
                        {post.media && post.media.length > 0 && (
                          <div className="aspect-square">
                            <img
                              src={post.media[0]}
                              alt="Post media"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        {/* Post Footer */}
                        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                                                      <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                              <div className="flex items-center space-x-3">
                                <span className="flex items-center space-x-1">
                                  <Heart className="h-4 w-4" />
                                  <span>{post.likes?.length || 0}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <MessageCircle className="h-4 w-4" />
                                  <span>{post.comments?.length || 0}</span>
                                </span>
                              </div>
                            </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'friends' && (
              <FriendsList userId={profileUserId} />
            )}

            {activeTab === 'photos' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Photos coming soon</h3>
                <p className="text-gray-500">Photo gallery feature will be available soon!</p>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {profile?.location && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                      <p className="text-gray-600">{profile.location}</p>
                    </div>
                  )}
                  
                  {profile?.birth_date && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Birth Date</h4>
                      <p className="text-gray-600">{new Date(profile.birth_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  
                  {profile?.website && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Website</h4>
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {profile.website}
                      </a>
                    </div>
                  )}
                  
                  {profile?.social_links && Object.keys(profile.social_links).length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Social Links</h4>
                      <div className="space-y-2">
                        {Object.entries(profile.social_links).map(([platform, url]) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-600 hover:underline"
                          >
                            <span className="capitalize">{platform}</span>
                            <span>→</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditProfile(false)}
          onUpdate={handleProfileUpdate}
        />
      )}

      {/* Cover Photo Edit Modal */}
      {showCoverEdit && (
        <CoverPhotoModal
          onClose={() => setShowCoverEdit(false)}
          onUpdate={handleProfileUpdate}
        />
      )}

      {/* Avatar Edit Modal */}
      {showAvatarEdit && (
        <AvatarModal
          onClose={() => setShowAvatarEdit(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
};

// Cover Photo Modal Component
const CoverPhotoModal = ({ onClose, onUpdate }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('cover_photo', selectedFile);

      const response = await api.put('/profiles', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Cover photo updated successfully!');
      onUpdate(response.data.data);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update cover photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      const response = await api.put('/profiles', { cover_photo: null });
      toast.success('Cover photo removed successfully!');
      onUpdate(response.data.data);
      onClose();
    } catch (error) {
      toast.error('Failed to remove cover photo');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Cover Photo</h3>
          
          {/* File Input */}
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors text-center"
            >
              <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">Click to select cover photo</p>
              <p className="text-sm text-gray-500">JPG, PNG, GIF up to 5MB</p>
            </button>
          </div>

          {/* Preview */}
          {preview && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
              <div className="relative">
                <img
                  src={preview}
                  alt="Cover preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRemove}
              className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              Remove Current
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? 'Uploading...' : 'Upload Cover Photo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Avatar Modal Component
const AvatarModal = ({ onClose, onUpdate }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }

      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const response = await api.put('/profiles', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Profile picture updated successfully!');
      onUpdate(response.data.data);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      const response = await api.put('/profiles', { avatar: null });
      toast.success('Profile picture removed successfully!');
      onUpdate(response.data.data);
      onClose();
    } catch (error) {
      toast.error('Failed to remove profile picture');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Profile Picture</h3>
          
          {/* File Input */}
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors text-center"
            >
              <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">Click to select profile picture</p>
              <p className="text-sm text-gray-500">JPG, PNG, GIF up to 2MB</p>
            </button>
          </div>

          {/* Preview */}
          {preview && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
              <div className="relative">
                <img
                  src={preview}
                  alt="Avatar preview"
                  className="w-32 h-32 object-cover rounded-full mx-auto"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRemove}
              className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              Remove Current
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? 'Uploading...' : 'Upload Profile Picture'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit Profile Modal Component
const EditProfileModal = ({ profile, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    website: profile?.website || '',
    birth_date: profile?.birth_date || '',
    social_links: profile?.social_links || {},
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Birth Date</label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};



export default Profile;
