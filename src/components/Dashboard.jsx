import React, { useState } from 'react';
import { useInfiniteQuery, useQueryClient } from 'react-query';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Share2, MoreHorizontal, Image, Video, Link as LinkIcon } from 'lucide-react';
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
  } = useInfiniteQuery(
    'posts',
    async ({ pageParam = 1 }) => {
      const response = await api.get(`/posts?page=${pageParam}`);
      return response.data;
    },
    {
      getNextPageParam: (lastPage, pages) => {
        // Check if there's a next page
        if (lastPage.data.current_page < lastPage.data.last_page) {
          return lastPage.data.current_page + 1;
        }
        return undefined;
      },
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const handlePostCreated = () => {
    setShowCreatePost(false);
    // Invalidate and refetch posts to show the new post
    queryClient.invalidateQueries('posts');
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading posts</p>
          <button
            onClick={() => queryClient.invalidateQueries('posts')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-sm sm:text-base text-blue-100">
          Share your thoughts, connect with friends, and stay updated with what's happening.
        </p>
      </div>

      {/* People You May Know Section */}
      <PeopleYouMayKnow />

      {/* Create Post Button */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4">
        <button
          onClick={() => setShowCreatePost(true)}
          className="w-full text-left p-3 sm:p-4 border border-gray-300 rounded-lg sm:rounded-xl hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm sm:text-lg">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm sm:text-base text-gray-500">What's on your mind?</span>
          </div>
        </button>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePost
          onClose={() => setShowCreatePost(false)}
          onPostCreated={handlePostCreated}
        />
      )}

      {/* Posts Feed */}
      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Posts</h2>
        
        {allPosts.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">
              Be the first to share something with your friends!
            </p>
            <button
              onClick={() => setShowCreatePost(true)}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Create your first post
            </button>
          </div>
        ) : (
          allPosts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={() => queryClient.invalidateQueries('posts')} />
          ))
        )}
      </div>

      {/* Enhanced Load More Button */}
      {hasNextPage && (
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
          >
            {isFetchingNextPage ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Loading more posts...</span>
              </>
            ) : (
              <>
                <span>Load more posts</span>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  {allPosts.length} loaded
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* End of posts message */}
      {!hasNextPage && allPosts.length > 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 text-sm">
            🎉 You've reached the end! That's all the posts for now.
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;