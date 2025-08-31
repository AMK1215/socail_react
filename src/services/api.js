import axios from 'axios';

// Create axios instance
export const api = axios.create({
  baseURL: 'https://luckymillion.online/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth
  login: '/login',
  register: '/register',
  logout: '/logout',
  me: '/me',
  
  // Posts
  posts: '/posts',
  post: (id) => `/posts/${id}`,
  likePost: (id) => `/posts/${id}/like`,
  
  // Shares
  sharePost: (id) => `/posts/${id}/share`,
  unsharePost: (id) => `/posts/${id}/unshare`,
  getPostShares: (id) => `/posts/${id}/shares`,
  getShareStats: (id) => `/posts/${id}/share-stats`,
  copyPostLink: (id) => `/posts/${id}/copy-link`,
  getUserShares: '/my-shares',
  
  // Profiles
  profiles: '/profiles', // Current user's profile
  profileUsers: '/profiles/users', // All other users
  profile: (id) => `/profiles/${id}`, // Specific user profile
  
  // Friendships
  friends: '/friends',
  sendFriendRequest: (id) => `/friends/${id}`,
  respondToFriendRequest: (id) => `/friends/${id}`,
  
  // Messages
  conversations: '/conversations',
  conversationMessages: (id) => `/conversations/${id}/messages`,
  startConversation: (id) => `/conversations/start/${id}`,
  
  // Search
  search: '/search',
  searchUsers: '/search/users',
  searchPosts: '/search/posts',
  searchSuggestions: '/search/suggestions',
};

export default api;
