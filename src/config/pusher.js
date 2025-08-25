// Pusher configuration
export const PUSHER_CONFIG = {
    appKey: import.meta.env.VITE_PUSHER_APP_KEY || 'your_app_key',
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
    encrypted: true,
    authEndpoint: '/api/broadcasting/auth',
};

// Default values for development
export const DEFAULT_PUSHER_CONFIG = {
    appKey: 'your_app_key',
    cluster: 'mt1',
    encrypted: true,
    authEndpoint: '/api/broadcasting/auth',
};
