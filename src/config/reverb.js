// Laravel Reverb configuration
export const REVERB_CONFIG = {
    appKey: 'qlgzrt6nvzuux1a4eliu', // Updated to match environment variable
    host: 'luckymillion.online', // Updated to match actual domain
    port: 443, // Use HTTPS port (443) since Nginx will proxy to Reverb
    scheme: 'https', // Use HTTPS since we're going through Nginx
    // authEndpoint is now dynamically constructed in broadcasting.js
};

console.log('Environment variables:', {
  VITE_REVERB_APP_KEY: import.meta.env.VITE_REVERB_APP_KEY,
  VITE_REVERB_HOST: import.meta.env.VITE_REVERB_HOST,
  VITE_REVERB_PORT: import.meta.env.VITE_REVERB_PORT,
  VITE_REVERB_SCHEME: import.meta.env.VITE_REVERB_SCHEME,
});

// Default values for development
export const DEFAULT_REVERB_CONFIG = {
    appKey: 'qlgzrt6nvzuux1a4eliu', // Updated to match environment variable
    host: 'luckymillion.online', // Updated to match actual domain
    port: 443, // Use HTTPS port (443) since Nginx will proxy to Reverb
    scheme: 'https', // Use HTTPS since we're going through Nginx
    // authEndpoint is now dynamically constructed in broadcasting.js
};
