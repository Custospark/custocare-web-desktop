import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { API_BASE_URL } from './apiConfig';

Pusher.logToConsole = true;

const origin = new URL(API_BASE_URL).origin;

const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY ?? 'local',
  wsHost: import.meta.env.VITE_REVERB_HOST ?? '127.0.0.1',
  wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
  wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
  enabledTransports: ['ws', 'wss'],
  authEndpoint: `${origin}/broadcasting/auth`,
  auth: {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken') ?? ''}`,
    },
  },
});

export default echo;
