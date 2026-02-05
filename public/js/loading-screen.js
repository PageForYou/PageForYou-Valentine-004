// เก็บตัวแปรไว้ใน Scope ที่เข้าถึงได้ (Cache Elements)
let loadingElements = null;
let loadingStartTime = null;
let lastPercent = -1; // ใช้เช็คเพื่อลดการอัปเดต Text

const ImagePreloader = {
    queue: [],
    isLoading: false,

    // ฟังก์ชันสำหรับเพิ่มรายการรูปที่อยากโหลด (รับเป็น Array)
    add: function(imageUrls) {
        this.queue.push(...imageUrls);
        this.processQueue();
    },

    // ฟังก์ชันสำหรับเพิ่มรูปที่ต้องประกอบ URL เอง (Cloudinary)
    // เช่น addCloudinary('my-image-id', 'w_500,q_auto')
    addCloudinary: function(publicId, transformations) {
        const baseUrl = "https://res.cloudinary.com/dbfwylcui/image/upload/";
        const fullUrl = `${baseUrl}${transformations}/PageForYou-Valentine-004/${publicId}`;
        this.add([fullUrl]);
    },

    // ตัวจัดการคิว (โหลดทีละรูป เพื่อไม่ให้เน็ตแย่งกันจนกระตุก)
    processQueue: function() {
        if (this.isLoading || this.queue.length === 0) return;

        this.isLoading = true;
        const nextUrl = this.queue.shift(); // ดึงตัวแรกออกมา

        const img = new Image();
        
        // พอโหลดเสร็จ (หรือ error) ให้ไปโหลดตัวต่อไปทันที
        img.onload = img.onerror = () => {
            console.log(`Cached: ${nextUrl}`); // (ลบออกได้ถ้าไม่อยากให้รก console)
            this.isLoading = false;
            this.processQueue(); // เรียกตัวเองซ้ำเพื่อโหลดตัวถัดไป
        };

        img.src = nextUrl; // เริ่มโหลด
    }
};

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

    ImagePreloader.add([
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_100,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/heart_red.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_300,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/fingerprint.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_100,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/loading_icon.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/h_1400,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/chat_bg_pink.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_500,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/GiftBox_1_pink_close.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_500,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/GiftBox_1_pink_open.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_500,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/quiz_1.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_500,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/quiz_finish_1.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_300,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/cat_happy_1.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_300,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/cat_sad_1.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_500,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/letter_open.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_600,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/polaroid.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_500,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/GiftBox_1_blue_close.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_500,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/GiftBox_1_blue_open.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_500,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/GiftBox_1_red_close.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_500,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/GiftBox_1_red_open.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_500,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/GiftBox_1_yellow_close.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_500,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/GiftBox_1_yellow_open.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_500,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/GiftBox_1_green_close.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_500,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/GiftBox_1_green_open.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_500,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/GiftBox_1_purple_close.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_500,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/GiftBox_1_purple_open.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_900,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/prize_cosmetics_text.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_900,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/prize_dessert_text.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_900,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/prize_food_text.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_900,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/prize_movie_text.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_900,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/prize_wish_text.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_900,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/prize_500_text.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_1000,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/letter_bg.png",
        "https://res.cloudinary.com/dbfwylcui/image/upload/w_500,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/letter_close.png",
    ]);
    fetch(`/customers/${window.customerId}/data.json`)
        .then(response => response.json())
        .then(data => {
            if (data.imageList) {
                ImagePreloader.add(data.imageList.map(({size, name}) => window.getCustomerImage(size, name)));
            }
        })
        .catch(error => console.error('Error loading customer data:', error));
}

// การเรียกใช้งานคงเดิม
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoadingScreen);
} else {
    initLoadingScreen();
}