// Global Music Player using popup window
(function() {
    'use strict';

    const MUSIC_KEY = 'syp_music_state';
    let popupWindow = null;
    let isPlaying = false;
    let popupCheckInterval = null;

    function init() {
        // Check if popup is still open
        if (popupWindow && !popupWindow.closed) {
            updateFromPopup();
        } else {
            popupWindow = null;
            clearInterval(popupCheckInterval);
        }
        
        // Restore state
        restoreState();
        
        // Update UI when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', updateUI);
        } else {
            updateUI();
        }
    }

    function createPopupPlayer() {
        const width = 300;
        const height = 150;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        popupWindow = window.open(
            'music-player.html',
            'MusicPlayer',
            'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',status=no,scrollbars=no,resizable=no'
        );
        
        // Check if popup was blocked
        if (!popupWindow) {
            console.log('Popup was blocked by browser');
            alert('Please allow popup windows for music playback');
            return false;
        }
        
        // Monitor popup
        popupCheckInterval = setInterval(function() {
            if (popupWindow.closed) {
                popupWindow = null;
                clearInterval(popupCheckInterval);
                isPlaying = false;
                saveState();
                updateUI();
            }
        }, 500);
        
        return true;
    }

    function playMusic() {
        if (!popupWindow || popupWindow.closed) {
            if (!createPopupPlayer()) return;
        }
        
        // Wait for popup to load, then play
        setTimeout(function() {
            if (popupWindow && !popupWindow.closed) {
                popupWindow.postMessage({ type: 'PLAY' }, '*');
            }
        }, 100);
        
        isPlaying = true;
        saveState();
        updateUI();
    }

    function pauseMusic() {
        if (popupWindow && !popupWindow.closed) {
            popupWindow.postMessage({ type: 'PAUSE' }, '*');
        }
        
        isPlaying = false;
        saveState();
        updateUI();
    }

    window.toggleMusic = function() {
        if (isPlaying) {
            pauseMusic();
        } else {
            playMusic();
        }
    };

    function updateFromPopup() {
        if (popupWindow && !popupWindow.closed) {
            popupWindow.postMessage({ type: 'GET_STATE' }, '*');
        }
    }

    function handleMessage(event) {
        if (event.data && (event.data.type === 'STATE' || event.data.type === 'PLAYING' || event.data.type === 'PAUSED')) {
            const wasPlaying = isPlaying;
            isPlaying = event.data.isPlaying;
            
            if (wasPlaying !== isPlaying) {
                saveState();
                updateUI();
            }
        }
    }

    function getState() {
        try {
            return JSON.parse(localStorage.getItem(MUSIC_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }

    function saveState() {
        const state = {
            isPlaying: isPlaying
        };
        localStorage.setItem(MUSIC_KEY, JSON.stringify(state));
    }

    function restoreState() {
        const state = getState();
        // Don't auto-play on page load, just update UI to show last state
        isPlaying = false;
    }

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

    // Listen for messages
    window.addEventListener('message', handleMessage);

    // Start
    init();
})();
