// Loading screen functionality
const LOADING_TIME = 1000;
let loadingStartTime = Date.now();

function updateLoadingScreen(progress) {
    const loadingScreen = document.querySelector('.loading-screen');
    const progressFill = document.querySelector('.heart-progress-fill');
    const percentElement = document.querySelector('.loading-percent');
    const notification = document.querySelector('.notification');
    
    // Calculate progress in the 5% to 95% range
    const minProgress = 20;
    const maxProgress = 80;
    const adjustedProgress = minProgress + (progress / 100) * (maxProgress - minProgress);
    
    // Update progress bar (left to right, 5% to 95% of the width)
    progressFill.style.clipPath = `polygon(0 0, ${adjustedProgress}% 0, ${adjustedProgress}% 100%, 0% 100%)`;
    
    // Display the actual progress percentage (0-100%)
    const displayProgress = Math.min(100, Math.max(0, progress));
    percentElement.textContent = `${Math.floor(displayProgress)}%`;
    
    // If loading is complete, trigger fade-out with scale
    if (progress >= 100) {
        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                notification.style.display = 'block';
                notification.classList.add('show');
            }, 800); // Match this with the CSS transition duration
        }, 500);
    }
}

// Animate loading progress
function animateLoading() {
    const now = Date.now();
    const elapsed = now - loadingStartTime;
    const progress = Math.min(100, (elapsed / LOADING_TIME) * 100);
    
    updateLoadingScreen(progress);
    
    if (progress < 100) {
        requestAnimationFrame(animateLoading);
    }
}

// Start loading animation
function initLoadingScreen() {
    // Reset loading state
    loadingStartTime = Date.now();
    
    // Start the animation
    requestAnimationFrame(animateLoading);
}

// Initialize loading screen when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoadingScreen);
} else {
    initLoadingScreen();
}

// Export for use in other files if needed
window.loadingScreen = {
    update: updateLoadingScreen,
    init: initLoadingScreen
};
