// Service Worker for background music playback
const CACHE_NAME = 'saiyingpun-music-v1';
const MUSIC_URL = '/audio/bgm.mp3';

// Install event
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Message handling from pages
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PLAY_MUSIC') {
        // Broadcast to all clients to sync music state
        self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
                if (client.id !== event.source.id) {
                    client.postMessage({
                        type: 'SYNC_MUSIC_STATE',
                        isPlaying: event.data.isPlaying
                    });
                }
            });
        });
    }
});

// Fetch event - cache music file
self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('bgm.mp3')) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then((response) => {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                });
            })
        );
    }
});
