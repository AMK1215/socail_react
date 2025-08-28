import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { REVERB_CONFIG } from '../config/reverb';

class BroadcastingService {
    constructor() {
        this.echo = null;
        this.channels = new Map();
        this.isConnected = false;
    }

    // Initialize Laravel Echo connection with Reverb
    initialize() {
        if (this.echo) {
            return;
        }

        // Configure Pusher client for Reverb
        window.Pusher = Pusher;
        
        // Debug: Log the configuration being used
        console.log('Reverb Configuration:', {
            appKey: REVERB_CONFIG.appKey,
            host: REVERB_CONFIG.host,
            port: REVERB_CONFIG.port,
            scheme: REVERB_CONFIG.scheme,
            forceTLS: REVERB_CONFIG.scheme === 'https'
        });

        this.echo = new Echo({
            broadcaster: 'reverb',
            key: REVERB_CONFIG.appKey,
            wsHost: REVERB_CONFIG.host,
            wsPort: REVERB_CONFIG.port,
            wssPort: REVERB_CONFIG.port,
            forceTLS: true, // Enable forceTLS for HTTPS
            disableStats: true,
            enabledTransports: ['ws', 'wss'],
            authEndpoint: `https://${REVERB_CONFIG.host}/api/broadcasting/auth`, // Use full HTTPS URL
            auth: {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            },
        });

        // Listen for connection events
        this.echo.connector.pusher.connection.bind('connected', () => {
            console.log('Connected to Laravel Reverb');
            this.isConnected = true;
        });

        this.echo.connector.pusher.connection.bind('disconnected', () => {
            console.log('Disconnected from Laravel Reverb');
            this.isConnected = false;
        });

        this.echo.connector.pusher.connection.bind('error', (error) => {
            console.error('Laravel Reverb connection error:', error);
        });
    }

    // Subscribe to a public channel
    subscribeToChannel(channelName, eventName, callback) {
        if (!this.echo) {
            this.initialize();
        }

        const channel = this.echo.channel(channelName);
        channel.listen(eventName, callback);

        this.channels.set(channelName, channel);
        return channel;
    }

    // Subscribe to a private channel
    subscribeToPrivateChannel(channelName, eventName, callback) {
        if (!this.echo) {
            this.initialize();
        }

        const channel = this.echo.private(channelName);
        channel.listen(eventName, callback);

        this.channels.set(channelName, channel);
        return channel;
    }

    // Subscribe to user-specific notifications
    subscribeToUserNotifications(userId, callback) {
        return this.subscribeToPrivateChannel(`user.${userId}`, 'friendship.request_received', callback);
    }

    // Subscribe to posts feed
    subscribeToPostsFeed(callback) {
        return this.subscribeToChannel('posts', 'post.created', callback);
    }

    // Subscribe to specific post updates
    subscribeToPostUpdates(postId, callback) {
        return this.subscribeToChannel(`post.${postId}`, 'post.liked', callback);
    }

    // Subscribe to conversation messages
    subscribeToConversation(conversationId, callback) {
        return this.subscribeToPrivateChannel(`conversation.${conversationId}`, 'message.new', callback);
    }

    // Unsubscribe from a channel
    unsubscribeFromChannel(channelName) {
        const channel = this.channels.get(channelName);
        if (channel) {
            this.echo.leaveChannel(channelName);
            this.channels.delete(channelName);
        }
    }

    // Unsubscribe from all channels
    unsubscribeFromAllChannels() {
        this.channels.forEach((channel, channelName) => {
            this.echo.leaveChannel(channelName);
        });
        this.channels.clear();
    }

    // Disconnect from Laravel Echo
    disconnect() {
        if (this.echo) {
            this.unsubscribeFromAllChannels();
            this.echo.disconnect();
            this.echo = null;
            this.isConnected = false;
        }
    }

    // Get connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            connectionState: this.echo?.connector.pusher.connection.state || 'disconnected'
        };
    }
}

// Create a singleton instance
const broadcastingService = new BroadcastingService();

export default broadcastingService;
