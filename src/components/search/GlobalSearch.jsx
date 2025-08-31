import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, FileText, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], posts: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Search function
  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults({ users: [], posts: [], total: 0 });
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/search', {
        params: {
          query: searchQuery,
          type: selectedTab,
          limit: 10
        }
      });

      if (response.data.success) {
        setResults(response.data.data);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Show user-friendly error message
      if (error.response?.status === 500) {
        console.log('Server error occurred, please try again');
      }
      setResults({ users: [], posts: [], total: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedTab]);

  // Save search to recent searches
  const saveRecentSearch = (searchTerm) => {
    if (!searchTerm.trim()) return;

    const newRecentSearches = [
      searchTerm,
      ...recentSearches.filter(s => s !== searchTerm)
    ].slice(0, 5); // Keep only 5 recent searches

    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
  };

  // Handle user click
  const handleUserClick = (user) => {
    saveRecentSearch(query);
    navigate(`/profile/${user.id}`);
    onClose();
  };

  // Handle post click
  const handlePostClick = (post) => {
    saveRecentSearch(query);
    navigate(`/post/${post.id}`);
    onClose();
  };

  // Handle recent search click
  const handleRecentSearchClick = (searchTerm) => {
    setQuery(searchTerm);
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-16">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for people and posts..."
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={onClose}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Tabs */}
          <div className="flex space-x-1 mt-3">
            {[
              { key: 'all', label: 'All' },
              { key: 'users', label: 'People' },
              { key: 'posts', label: 'Posts' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTab === tab.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Searching...</span>
            </div>
          ) : query.length < 2 ? (
            /* Recent Searches */
            <div className="p-4">
              {recentSearches.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">Recent searches</h3>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Clear all
                    </button>
                  </div>
                  {recentSearches.map((searchTerm, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(searchTerm)}
                      className="flex items-center w-full p-2 hover:bg-gray-50 rounded-lg text-left"
                    >
                      <Search className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-gray-700">{searchTerm}</span>
                    </button>
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Start typing to search for people and posts</p>
                </div>
              )}
            </div>
          ) : results.total === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No results found for "{query}"</p>
              <p className="text-sm">Try searching for something else</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Users Section */}
              {(selectedTab === 'all' || selectedTab === 'users') && results.users.length > 0 && (
                <div>
                  <div className="flex items-center mb-3">
                    <User className="w-4 h-4 text-gray-600 mr-2" />
                    <h3 className="text-sm font-medium text-gray-700">People</h3>
                  </div>
                  {results.users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserClick(user)}
                      className="flex items-center w-full p-3 hover:bg-gray-50 rounded-lg text-left"
                    >
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium mr-3">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        {user.bio && (
                          <p className="text-xs text-gray-400 truncate">{user.bio}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Posts Section */}
              {(selectedTab === 'all' || selectedTab === 'posts') && results.posts.length > 0 && (
                <div>
                  <div className="flex items-center mb-3">
                    <FileText className="w-4 h-4 text-gray-600 mr-2" />
                    <h3 className="text-sm font-medium text-gray-700">Posts</h3>
                  </div>
                  {results.posts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => handlePostClick(post)}
                      className="flex w-full p-3 hover:bg-gray-50 rounded-lg text-left"
                    >
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-medium mr-3 flex-shrink-0">
                        {post.user.avatar ? (
                          <img src={post.user.avatar} alt={post.user.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          post.user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium text-gray-900">{post.user.name}</p>
                          <span className="text-xs text-gray-500">•</span>
                          <p className="text-xs text-gray-500">{post.created_at}</p>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{post.likes_count} likes</span>
                          <span>{post.comments_count} comments</span>
                          {post.type === 'image' && <span>📷 Image</span>}
                          {post.type === 'video' && <span>🎥 Video</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
