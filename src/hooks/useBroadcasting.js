import { useEffect, useRef, useCallback } from 'react';
import broadcastingService from '../services/broadcasting';

export const useBroadcasting = () => {
    const channelsRef = useRef(new Map());

    // Subscribe to posts feed
    const subscribeToPostsFeed = useCallback((callback) => {
        const channel = broadcastingService.subscribeToPostsFeed(callback);
        channelsRef.current.set('posts', channel);
        return channel;
    }, []);

    // Subscribe to specific post updates
    const subscribeToPostUpdates = useCallback((postId, callback) => {
        const channelName = `post.${postId}`;
        const channel = broadcastingService.subscribeToPostUpdates(postId, callback);
        channelsRef.current.set(channelName, channel);
        return channel;
    }, []);

    // Subscribe to user notifications
    const subscribeToUserNotifications = useCallback((userId, callback) => {
        const channelName = `user.${userId}`;
        const channel = broadcastingService.subscribeToUserNotifications(userId, callback);
        channelsRef.current.set(channelName, channel);
        return channel;
    }, []);

    // Subscribe to conversation messages
    const subscribeToConversation = useCallback((conversationId, callback) => {
        const channelName = `conversation.${conversationId}`;
        const channel = broadcastingService.subscribeToConversation(conversationId, callback);
        channelsRef.current.set(channelName, channel);
        return channel;
    }, []);

    // Unsubscribe from a specific channel
    const unsubscribeFromChannel = useCallback((channelName) => {
        const channel = channelsRef.current.get(channelName);
        if (channel) {
            broadcastingService.unsubscribeFromChannel(channelName);
            channelsRef.current.delete(channelName);
        }
    }, []);

    // Unsubscribe from all channels
    const unsubscribeFromAllChannels = useCallback(() => {
        channelsRef.current.forEach((channel, channelName) => {
            broadcastingService.unsubscribeFromChannel(channelName);
        });
        channelsRef.current.clear();
    }, []);

    // Get connection status
    const getConnectionStatus = useCallback(() => {
        return broadcastingService.getConnectionStatus();
    }, []);

    // Initialize broadcasting service
    const initialize = useCallback(() => {
        broadcastingService.initialize();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            unsubscribeFromAllChannels();
        };
    }, [unsubscribeFromAllChannels]);

    return {
        subscribeToPostsFeed,
        subscribeToPostUpdates,
        subscribeToUserNotifications,
        subscribeToConversation,
        unsubscribeFromChannel,
        unsubscribeFromAllChannels,
        getConnectionStatus,
        initialize,
    };
};

// Hook for real-time posts feed
export const usePostsFeed = (onNewPost) => {
    const { subscribeToPostsFeed, unsubscribeFromChannel } = useBroadcasting();

    useEffect(() => {
        if (onNewPost) {
            const channel = subscribeToPostsFeed(onNewPost);
            return () => {
                unsubscribeFromChannel('posts');
            };
        }
    }, [onNewPost, subscribeToPostsFeed, unsubscribeFromChannel]);
};

// Hook for real-time post updates
export const usePostUpdates = (postId, onUpdate) => {
    const { subscribeToPostUpdates, unsubscribeFromChannel } = useBroadcasting();

    useEffect(() => {
        if (postId && onUpdate) {
            const channelName = `post.${postId}`;
            const channel = subscribeToPostUpdates(postId, onUpdate);
            return () => {
                unsubscribeFromChannel(channelName);
            };
        }
    }, [postId, onUpdate, subscribeToPostUpdates, unsubscribeFromChannel]);
};

// Hook for real-time user notifications
export const useUserNotifications = (userId, onNotification) => {
    const { subscribeToUserNotifications, unsubscribeFromChannel } = useBroadcasting();

    useEffect(() => {
        if (userId && onNotification) {
            const channelName = `user.${userId}`;
            const channel = subscribeToUserNotifications(userId, onNotification);
            return () => {
                unsubscribeFromChannel(channelName);
            };
        }
    }, [userId, onNotification, subscribeToUserNotifications, unsubscribeFromChannel]);
};

// Hook for real-time conversation messages
export const useConversationMessages = (conversationId, onNewMessage) => {
    const { subscribeToConversation, unsubscribeFromChannel } = useBroadcasting();

    useEffect(() => {
        if (conversationId && onNewMessage) {
            const channelName = `conversation.${conversationId}`;
            const channel = subscribeToConversation(conversationId, onNewMessage);
            return () => {
                unsubscribeFromChannel(channelName);
            };
        }
    }, [conversationId, onNewMessage, subscribeToConversation, unsubscribeFromChannel]);
};
