import React, { useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Share2, MoreHorizontal, Image, Video, Link as LinkIcon, Plus, TrendingUp, Users } from 'lucide-react';
import CreatePost from './posts/CreatePost';
import PostCard from './posts/PostCard';
import PeopleYouMayKnow from './friendship/PeopleYouMayKnow';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const queryClient = useQueryClient();

  // Fetch posts with infinite query
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get(`/posts?page=${pageParam}`);
      return response.data;
    },
    getNextPageParam: (lastPage, pages) => {
      // Check if there's a next page
      if (lastPage.data.current_page < lastPage.data.last_page) {
        return lastPage.data.current_page + 1;
      }
      return undefined;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handlePostCreated = () => {
    setShowCreatePost(false);
    // Invalidate and refetch posts to show the new post
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    toast.success('Post created successfully!');
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Flatten all posts from all pages
  const allPosts = data?.pages?.flatMap(page => page.data.data) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="flex items-center justify-center min-h-screen">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-blue-600 rounded-full animate-spin" style={{ clipPath: 'inset(0 0 50% 0)' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-600 mb-6">We couldn't load your posts right now</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['posts'] })}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg"
          >
            Try again
          </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6">
          {/* Left Sidebar - Hidden on mobile, shown as cards on larger screens */}
          <div className="hidden lg:block lg:col-span-3 space-y-6">
            {/* Profile Card */}
            <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white font-bold text-2xl">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">{user?.name}</h3>
                <p className="text-sm text-gray-600">@{user?.email?.split('@')[0]}</p>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{allPosts.length}</div>
                    <div className="text-xs text-gray-600">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">42</div>
                    <div className="text-xs text-gray-600">Friends</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                Your Activity
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Posts this week</span>
                  <span className="font-semibold text-blue-600">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Likes received</span>
                  <span className="font-semibold text-red-600">127</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Comments made</span>
                  <span className="font-semibold text-green-600">24</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-1 lg:col-span-6 space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Mobile Profile Quick View - Only visible on mobile */}
            <div className="lg:hidden bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/30 p-3 sm:p-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-14 h-14 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl sm:text-lg">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-base sm:text-base truncate">{user?.name}</h3>
                  <p className="text-sm text-gray-600 truncate">@{user?.email?.split('@')[0]}</p>
                </div>
                <div className="flex space-x-3 sm:space-x-4 text-center">
                  <div>
                    <div className="text-lg sm:text-lg font-bold text-blue-600">{allPosts.length}</div>
                    <div className="text-xs text-gray-600">Posts</div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-lg font-bold text-purple-600">42</div>
                    <div className="text-xs text-gray-600">Friends</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Welcome Hero */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl sm:rounded-3xl shadow-xl">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative p-4 sm:p-6 lg:p-8 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2 leading-tight">
                      Welcome back, {user?.name?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-blue-100 opacity-90 text-sm sm:text-base leading-relaxed">
                      Ready to share something amazing today?
                    </p>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <span className="text-xl sm:text-2xl lg:text-3xl">🚀</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Create Post Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/30 p-3 sm:p-4 lg:p-6">
              <button
                onClick={() => setShowCreatePost(true)}
                className="w-full group"
              >
                <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 active:scale-[0.98]">
                  <div className="w-12 h-12 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-gray-600 group-hover:text-blue-600 transition-colors text-sm sm:text-base truncate">
                      What's on your mind, {user?.name?.split(' ')[0]}?
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <Image className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Video className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* People You May Know */}
            <PeopleYouMayKnow />

            {/* Posts Feed */}
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              {allPosts.length === 0 ? (
                <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/30 p-6 sm:p-8 lg:p-12 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">No posts yet</h3>
                  <p className="text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base">
                    Be the first to share something amazing with your friends and start the conversation!
                  </p>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="px-6 py-2.5 sm:px-8 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg inline-flex items-center space-x-2 active:scale-95"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">Create your first post</span>
                  </button>
                </div>
              ) : (
                allPosts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onUpdate={() => queryClient.invalidateQueries({ queryKey: ['posts'] })} 
                  />
                ))
              )}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
              <div className="text-center py-4 sm:py-6 lg:py-8">
                <button
                  onClick={handleLoadMore}
                  disabled={isFetchingNextPage}
                  className="px-6 py-3 sm:px-8 sm:py-4 bg-white/70 backdrop-blur-lg border border-white/30 text-gray-700 rounded-2xl hover:bg-white/80 transition-all duration-300 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2 sm:space-x-3 active:scale-95"
                >
                  {isFetchingNextPage ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm sm:text-base">Loading more posts...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm sm:text-base">Load more posts</span>
                      <div className="px-2 py-1 sm:px-3 sm:py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-medium">
                        {allPosts.length} loaded
                      </div>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* End of posts message */}
            {!hasNextPage && allPosts.length > 0 && (
              <div className="text-center py-4 sm:py-6 lg:py-8">
                <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/30 p-4 sm:p-6">
                  <div className="text-gray-600 flex items-center justify-center space-x-2 text-sm sm:text-base">
                    <span>🎉</span>
                    <span>You've reached the end! That's all the posts for now.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block lg:col-span-3 space-y-6">
            {/* Trending Topics */}
            <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
                Trending Now
              </h4>
              <div className="space-y-3">
                {['#WebDevelopment', '#React', '#SocialMedia', '#Tech2024'].map((tag, index) => (
                  <div key={tag} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/50 transition-colors cursor-pointer">
                    <span className="text-sm font-medium text-blue-600">{tag}</span>
                    <span className="text-xs text-gray-500">{Math.floor(Math.random() * 100) + 10}k posts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Actions */}
            <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/50 transition-colors text-left">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Find Friends</div>
                    <div className="text-xs text-gray-600">Discover people you know</div>
                  </div>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/50 transition-colors text-left">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Start Chat</div>
                    <div className="text-xs text-gray-600">Message your friends</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePost
          onClose={() => setShowCreatePost(false)}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
};

export default Dashboard;