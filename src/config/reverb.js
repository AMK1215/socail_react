// Laravel Reverb configuration
export const REVERB_CONFIG = {
    appKey: import.meta.env.VITE_REVERB_APP_KEY || 'rtk5ssu7lwwd90gwtdou',
    host: import.meta.env.VITE_REVERB_HOST || 'localhost',
    port: import.meta.env.VITE_REVERB_PORT || 8081,
    scheme: import.meta.env.VITE_REVERB_SCHEME || 'http',
    authEndpoint: '/api/broadcasting/auth',
};

console.log('Environment variables:', {
  VITE_REVERB_APP_KEY: import.meta.env.VITE_REVERB_APP_KEY,
  VITE_REVERB_HOST: import.meta.env.VITE_REVERB_HOST,
  VITE_REVERB_PORT: import.meta.env.VITE_REVERB_PORT,
  VITE_REVERB_SCHEME: import.meta.env.VITE_REVERB_SCHEME,
});

// Default values for development
export const DEFAULT_REVERB_CONFIG = {
    appKey: 'rtk5ssu7lwwd90gwtdou',
    host: 'localhost',
    port: 8081,
    scheme: 'http',
    authEndpoint: '/api/broadcasting/auth',
};
