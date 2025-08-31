import { api, endpoints } from './api';

export const shareService = {
  // Share a post
  sharePost: async (postId, shareData) => {
    try {
      const response = await api.post(endpoints.sharePost(postId), shareData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Unshare a post
  unsharePost: async (postId, shareType) => {
    try {
      const response = await api.delete(endpoints.unsharePost(postId), {
        data: { share_type: shareType }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get shares for a post
  getPostShares: async (postId, page = 1) => {
    try {
      const response = await api.get(`${endpoints.getPostShares(postId)}?page=${page}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get share statistics for a post
  getShareStats: async (postId) => {
    try {
      const response = await api.get(endpoints.getShareStats(postId));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Copy post link
  copyPostLink: async (postId) => {
    try {
      const response = await api.post(endpoints.copyPostLink(postId));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user's shares
  getUserShares: async (page = 1) => {
    try {
      const response = await api.get(`${endpoints.getUserShares}?page=${page}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Share to specific platform (message)
  shareToMessage: async (postId, conversationId, content = '') => {
    try {
      // This would be implemented to share a post in a conversation
      const shareData = {
        share_type: 'message',
        content: content,
        conversation_id: conversationId,
      };
      const response = await api.post(endpoints.sharePost(postId), shareData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Generate shareable link
  generateShareableLink: (postId) => {
    return `${window.location.origin}/posts/${postId}`;
  },

  // Copy to clipboard utility
  copyToClipboard: async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // Use modern clipboard API
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'absolute';
        textarea.style.left = '-999999px';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        textarea.remove();
        return success;
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  },

  // Share via Web Share API (for mobile)
  nativeShare: async (postData) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${postData.user?.name}`,
          text: postData.content,
          url: shareService.generateShareableLink(postData.id),
        });
        return true;
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
        return false;
      }
    }
    return false;
  }
};

export default shareService;
