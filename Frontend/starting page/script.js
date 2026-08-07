document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    // Full 202-frame sequence at native 24fps (8.417s) -- the complete
    // mandala animation, including its own build and fade, exactly as shot.
    const TOTAL_FRAMES = 202;
    const TARGET_DURATION_SEC = TOTAL_FRAMES / 24;
    const FRAME_DIRECTORY = 'landing_frames';
    const FRAME_EXT = 'webp';

    // After the mandala animation finishes (fading to black on its own),
    // generate a smooth fade to a warm off-white -- government sites read
    // as white-themed, so the intro should hand off into that rather than
    // sit on black. This is procedural (an animated overlay), not a raster
    // asset, so it's pixel-perfect and adds no extra file weight.
    const WHITE_FADE_DURATION_SEC = 1.3;
    const HANDOFF_COLOR = '#F7F4EE'; // warm off-white, not stark #fff

    // State Variables
    let frames = [];
    let isPlaying = false;
    let hasFinished = false;
    let currentTimeSec = 0.0;
    let lastTimestamp = null;

    let inWhiteFade = false;
    let whiteFadeElapsed = 0;

    // DOM Elements
    const canvas = document.getElementById('video-canvas');
    const ctx = canvas.getContext('2d');
    const loaderOverlay = document.getElementById('loader');
    const loaderProgress = document.getElementById('loader-progress');
    const loaderPercent = document.getElementById('loader-percent');
    const vignetteEl = document.querySelector('.vignette-overlay');

    // Format frame filename with 3-digit padding (frame_001.webp ... frame_202.webp)
    function getFramePath(index) {
        const numStr = String(index + 1).padStart(3, '0');
        return `${FRAME_DIRECTORY}/frame_${numStr}.${FRAME_EXT}`;
    }

    // Resize Canvas to match exact browser window resolution
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        renderCurrentState();
    }
    window.addEventListener('resize', resizeCanvas);

    // Preload All Frames into Memory
    function preloadFrames() {
        let loadedCount = 0;

        for (let i = 0; i < TOTAL_FRAMES; i++) {
            const img = new Image();
            img.src = getFramePath(i);

            const onDone = () => {
                loadedCount++;
                const percent = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
                loaderProgress.style.width = `${percent}%`;
                loaderPercent.textContent = `${percent}%`;

                if (loadedCount === TOTAL_FRAMES) {
                    onPreloadComplete();
                }
            };

            img.onload = onDone;
            img.onerror = () => {
                console.error(`Failed to load frame ${i + 1}`);
                onDone();
            };

            frames.push(img);
        }
    }

    // Called when all frames are loaded
    function onPreloadComplete() {
        resizeCanvas(); // draws frame 1 immediately behind the loader

        // Fade out loader and start playback
        setTimeout(() => {
            loaderOverlay.classList.add('fade-out');
            startPlayback();
        }, 300);
    }

    // Draw a single frame with aspect-ratio "cover" fit (fills the screen,
    // crops overflow, always centered).
    function drawCover(img, alpha) {
        if (!img || !img.complete || !img.naturalWidth) return;

        const screenW = canvas.width;
        const screenH = canvas.height;
        const imgW = img.naturalWidth;
        const imgH = img.naturalHeight;

        const scale = Math.max(screenW / imgW, screenH / imgH);
        const drawW = imgW * scale;
        const drawH = imgH * scale;
        const drawX = (screenW - drawW) / 2;
        const drawY = (screenH - drawH) / 2;

        ctx.globalAlpha = alpha;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.globalAlpha = 1;
    }

    // Renders the mandala sequence at a given elapsed time, cross-fading
    // between the two nearest frames to smooth out rAF pacing jitter.
    function renderAtTime(timeSec) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const progress = Math.min(1, timeSec / TARGET_DURATION_SEC);
        const floatIndex = progress * (TOTAL_FRAMES - 1);
        const indexA = Math.floor(floatIndex);
        const indexB = Math.min(indexA + 1, TOTAL_FRAMES - 1);
        const blend = floatIndex - indexA;

        drawCover(frames[indexA], 1);
        if (blend > 0) drawCover(frames[indexB], blend);
    }

    // Draws whatever the current state calls for (used on resize / idle)
    function renderCurrentState() {
        if (inWhiteFade || hasFinished) {
            renderAtTime(TARGET_DURATION_SEC);
            const t = hasFinished ? 1 : Math.min(1, whiteFadeElapsed / WHITE_FADE_DURATION_SEC);
            drawWhiteOverlay(t);
        } else {
            renderAtTime(currentTimeSec);
        }
    }

    function drawWhiteOverlay(alpha) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = HANDOFF_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
    }

    // Main Animation Loop -- mandala playback, then a generated fade to a
    // warm off-white handoff once the source footage finishes.
    function animate(timestamp) {
        if (!isPlaying) return;

        if (!lastTimestamp) {
            lastTimestamp = timestamp;
        }
        const deltaSec = (timestamp - lastTimestamp) / 1000;
        lastTimestamp = timestamp;

        if (!inWhiteFade) {
            currentTimeSec += deltaSec;

            if (currentTimeSec >= TARGET_DURATION_SEC) {
                currentTimeSec = TARGET_DURATION_SEC;
                renderAtTime(currentTimeSec);
                inWhiteFade = true;
                whiteFadeElapsed = 0;
                if (vignetteEl) vignetteEl.style.opacity = '0'; // vignette reads oddly on white
                requestAnimationFrame(animate);
                return;
            }

            renderAtTime(currentTimeSec);
            requestAnimationFrame(animate);
            return;
        }

        // -- White handoff phase --
        whiteFadeElapsed += deltaSec;
        const t = Math.min(1, whiteFadeElapsed / WHITE_FADE_DURATION_SEC);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic, smooth finish

        renderAtTime(TARGET_DURATION_SEC);
        drawWhiteOverlay(eased);

        if (t >= 1) {
            isPlaying = false;
            hasFinished = true;
            return;
        }

        requestAnimationFrame(animate);
    }

    function startPlayback() {
        isPlaying = true;
        hasFinished = false;
        inWhiteFade = false;
        whiteFadeElapsed = 0;
        lastTimestamp = null;
        currentTimeSec = 0;
        if (vignetteEl) vignetteEl.style.opacity = '1';
        requestAnimationFrame(animate);
    }

    // Optional replay: click anywhere once the intro has settled to play it again
    document.addEventListener('click', () => {
        if (hasFinished && !isPlaying) {
            startPlayback();
        }
    });

    // Initialize Preloader
    preloadFrames();
});
