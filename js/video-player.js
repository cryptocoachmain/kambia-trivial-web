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

        // FORCE VISIBILITY (Safety measure)
        this.overlay.classList.remove('hidden');
        this.overlay.style.display = 'flex';
        this.overlay.style.zIndex = '99999';

        const playPromise = this.videoElement.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Autoplay prevented:", error);
                // Show a manual Play button overlay instead of skipping
                this.showManualPlayButton();
            });
        }
    },

    showManualPlayButton() {
        // Create or show a play button centered
        let btn = document.getElementById('manual-play-overlay-btn');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'manual-play-overlay-btn';
            btn.innerHTML = '<span class="material-icons" style="font-size: 64px; color: white;">play_circle_filled</span>';
            btn.style.position = 'absolute';
            btn.style.top = '50%';
            btn.style.left = '50%';
            btn.style.transform = 'translate(-50%, -50%)';
            btn.style.background = 'transparent';
            btn.style.border = 'none';
            btn.style.cursor = 'pointer';
            btn.style.zIndex = '10001'; // Above video

            btn.onclick = () => {
                this.videoElement.play();
                btn.style.display = 'none';
            };
            this.overlay.appendChild(btn);
        }
        btn.style.display = 'block';
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
