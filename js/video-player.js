/**
 * Video Player Logic
 * Handles playing full-screen videos with skip functionality.
 */

const VideoPlayer = {
    overlay: document.getElementById('video-overlay'),
    videoElement: document.getElementById('game-video'),
    skipBtn: document.getElementById('skip-video-btn'),
    activeCallback: null,

    init() {
        this.videoElement.addEventListener('ended', () => this.onVideoEnded());
        this.skipBtn.addEventListener('click', () => this.stopVideo());
    },

    /**
     * Plays a video in the full-screen overlay.
     * @param {string} src - The video file path (relative to assets/).
     * @param {boolean} allowSkip - Whether the skip button should be shown.
     * @param {Function} onComplete - Callback when video ends or is skipped.
     */
    play(src, allowSkip = true, onComplete = null) {
        this.activeCallback = onComplete;
        this.videoElement.src = src;
        
        if (allowSkip) {
            this.skipBtn.classList.remove('hidden');
        } else {
            this.skipBtn.classList.add('hidden');
        }

        this.overlay.classList.remove('hidden');
        
        const playPromise = this.videoElement.play();
        if (playPromise !== undefined) {
             playPromise.catch(error => {
                 console.warn("Autoplay prevented:", error);
                 // If autoplay fails (common in browsers), show a "Play" button or just skip
                 // For now, we'll just stop to unblock the flow
                 this.stopVideo();
             });
        }
    },

    stopVideo() {
        this.videoElement.pause();
        this.videoElement.currentTime = 0;
        this.overlay.classList.add('hidden');
        if (this.activeCallback) {
            this.activeCallback();
            this.activeCallback = null;
        }
    },

    onVideoEnded() {
        this.stopVideo();
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    VideoPlayer.init();
});
