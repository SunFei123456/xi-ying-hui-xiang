// Global Music Player with Service Worker and localStorage sync
(function() {
    'use strict';

    const MUSIC_KEY = 'syp_music_state';
    const AUDIO_URL = 'audio/bgm.mp3';
    
    let audio = null;
    let isPlaying = false;
    let swRegistration = null;

    // Initialize
    function init() {
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then((registration) => {
                    swRegistration = registration;
                    console.log('SW registered:', registration);
                })
                .catch((error) => {
                    console.log('SW registration failed:', error);
                });

            // Listen for messages from SW
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SYNC_MUSIC_STATE') {
                    syncFromOtherPage(event.data.isPlaying);
                }
            });
        }

        // Restore state from localStorage
        restoreState();
        
        // Setup visibility change listener
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Setup storage listener for cross-tab sync
        window.addEventListener('storage', handleStorageChange);
    }

    // Create or get audio element
    function getAudio() {
        if (!audio) {
            audio = new Audio(AUDIO_URL);
            audio.loop = true;
            audio.volume = 0.5;
            
            audio.addEventListener('play', () => {
                isPlaying = true;
                saveState();
                updateUI();
                notifyServiceWorker();
            });
            
            audio.addEventListener('pause', () => {
                isPlaying = false;
                saveState();
                updateUI();
                notifyServiceWorker();
            });
        }
        return audio;
    }

    // Toggle music
    window.toggleMusic = function() {
        const music = getAudio();
        
        if (isPlaying) {
            music.pause();
        } else {
            music.play().catch((e) => {
                console.log('Audio play failed:', e);
            });
        }
    };

    // Sync from other page
    function syncFromOtherPage(playing) {
        const music = getAudio();
        
        if (playing && !isPlaying) {
            music.play().catch((e) => console.log('Sync play failed:', e));
        } else if (!playing && isPlaying) {
            music.pause();
        }
    }

    // Handle visibility change
    function handleVisibilityChange() {
        // Don't pause when hidden - let it play in background
        // Just sync state when becoming visible again
        if (!document.hidden) {
            restoreState();
        }
    }

    // Handle storage change (cross-tab sync)
    function handleStorageChange(e) {
        if (e.key === MUSIC_KEY) {
            const state = JSON.parse(e.newValue || '{}');
            if (state.isPlaying !== isPlaying) {
                syncFromOtherPage(state.isPlaying);
            }
        }
    }

    // Save state to localStorage
    function saveState() {
        const state = {
            isPlaying: isPlaying,
            timestamp: Date.now()
        };
        localStorage.setItem(MUSIC_KEY, JSON.stringify(state));
    }

    // Restore state from localStorage
    function restoreState() {
        try {
            const state = JSON.parse(localStorage.getItem(MUSIC_KEY) || '{}');
            if (state.isPlaying && !isPlaying) {
                const music = getAudio();
                music.play().catch((e) => console.log('Restore play failed:', e));
            }
            updateUI();
        } catch (e) {
            console.log('Restore state failed:', e);
        }
    }

    // Update UI
    function updateUI() {
        const btn = document.getElementById('musicBtn');
        if (btn) {
            if (isPlaying) {
                btn.classList.add('playing');
                btn.innerHTML = '🔊';
                btn.title = 'Pause Music';
            } else {
                btn.classList.remove('playing');
                btn.innerHTML = '🎵';
                btn.title = 'Play Music';
            }
        }
    }

    // Notify Service Worker
    function notifyServiceWorker() {
        if (swRegistration && swRegistration.active) {
            swRegistration.active.postMessage({
                type: 'PLAY_MUSIC',
                isPlaying: isPlaying
            });
        }
    }

    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
