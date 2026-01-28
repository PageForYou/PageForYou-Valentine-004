// เก็บตัวแปรไว้ใน Scope ที่เข้าถึงได้ (Cache Elements)
let loadingElements = null;
let loadingStartTime = null;
let lastPercent = -1; // ใช้เช็คเพื่อลดการอัปเดต Text

function updateLoadingScreen(progress) {
    // 1. ใช้ Elements ที่ถูก Cache ไว้แล้ว
    const { loadingScreen, progressFill, percentElement, notification } = loadingElements;
    
    const minProgress = 20;
    const maxProgress = 80;
    const adjustedProgress = minProgress + (progress / 100) * (maxProgress - minProgress);
    
    // Update progress bar
    progressFill.style.clipPath = `polygon(0 0, ${adjustedProgress}% 0, ${adjustedProgress}% 100%, 0% 100%)`;
    
    // 2. Performance Trick: อัปเดต Text ต่อเมื่อเลขจำนวนเต็มเปลี่ยนเท่านั้น
    const currentPercent = Math.floor(Math.min(100, Math.max(0, progress)));
    if (currentPercent !== lastPercent) {
        percentElement.textContent = `${currentPercent}%`;
        lastPercent = currentPercent;
    }
    
    if (progress >= 100) {
        // Logic การปิดเหมือนเดิม แต่ใช้ตัวแปรที่ Cache ไว้
        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                notification.style.display = 'block';
                notification.classList.add('show');
                window.AppAssets.audio.notification.play().catch(e => {});
            }, 800);
        }, 500);
    }
}

function animateLoading(timestamp) {
    if (!loadingStartTime) loadingStartTime = timestamp;
    
    // 3. ใช้ timestamp ที่ rAF ส่งมาให้แทน Date.now()
    const elapsed = timestamp - loadingStartTime;
    const progress = Math.min(100, (elapsed / window.loadingTime) * 100);
    
    updateLoadingScreen(progress);
    
    if (progress < 100) {
        requestAnimationFrame(animateLoading);
    }
}

function initLoadingScreen() {
    // 4. Cache DOM Elements ตั้งแต่เริ่มครั้งเดียว
    loadingElements = {
        loadingScreen: document.querySelector('.loading-screen'),
        progressFill: document.querySelector('.heart-progress-fill'),
        percentElement: document.querySelector('.loading-percent'),
        notification: document.querySelector('.notification')
    };
    
    lastPercent = -1;
    loadingStartTime = null; // Reset สำหรับ rAF
    requestAnimationFrame(animateLoading);
}

// การเรียกใช้งานคงเดิม
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoadingScreen);
} else {
    initLoadingScreen();
}