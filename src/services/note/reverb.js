import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { REVERB_CONFIG } from '../../config/reverb';

// Configure Pusher for Reverb
window.Pusher = Pusher;

// Create Echo instance using your config
const echo = new Echo({
  broadcaster: 'pusher',
  key: REVERB_CONFIG.appKey,
  wsHost: REVERB_CONFIG.host,
  wsPort: REVERB_CONFIG.port,
  wssPort: REVERB_CONFIG.port,
  forceTLS: REVERB_CONFIG.scheme === 'https',
  enabledTransports: ['ws', 'wss'],
  disableStats: true,
  cluster: 'mt1',
});

export default echo;
