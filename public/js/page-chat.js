let isReachLimitCurrent = false;
const isLocal = location.hostname === 'localhost';

const romanticAudio = window.AppAssets.audio.BG_SOUND_romantic;
const LOOP_START = 1.5;
const LOOP_END = 179;

setInterval(() => {
    const audio = window.AppAssets.audio.BG_SOUND_romantic;
    if (audio.currentTime >= LOOP_END && !audio.dataset.isFading) {
        audio.currentTime = LOOP_START;
        audio.play();
    }
}, 500);

async function loadChatMessages() {
    try {
        const basePath = window.location.hostname === 'localhost' ? `../../customers/${window.customerId}/data.json` : `../customers/${window.customerId}/data.json`;
        
        const response = await fetch(basePath);
        if (!response.ok) {
            throw new Error('Failed to load chat data');
        }
        const data = await response.json();
        renderChatMessages(data.chat);
        window.AppAssets.audio.BG_SOUND_romantic.currentTime = 1.5;
        window.AppAssets.audio.BG_SOUND_romantic.play();
    } catch (error) {
        console.error('Error loading chat:', error);
    }
}

// เก็บ AudioContext ไว้ข้างนอกเพื่อใช้ซ้ำ
let audioCtx;
let audioSource;
let gainNode;

function fadeAndSlowStop(audio, duration) {
    audio.dataset.isFading = "true";

    // 1. เริ่มต้น AudioContext (Safari ต้องการเวทย์มนต์ตรงนี้หน่อย)
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioSource = audioCtx.createMediaElementSource(audio);
        gainNode = audioCtx.createGain();
        audioSource.connect(gainNode);
        gainNode.connect(audioCtx.destination);
    }

    // กลับมาเริ่มที่ความดังปกติก่อน
    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    
    // 2. สั่ง Fade เสียงแบบนุ่มนวล (Safari ยอมรับวิธีนี้)
    // ลดจาก 1 เหลือ 0.01 (ถ้าใช้ 0 เลยบางทีมันจะไม่นวล) ในเวลา duration
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (duration / 1000));

    // 3. ส่วนลดความเร็ว (PlaybackRate) ใช้ setInterval เดิมได้เพราะ Safari ยอมให้แก้
    const startRate = audio.playbackRate;
    const intervalTime = 100;
    const steps = duration / intervalTime;
    const rateStep = (startRate - 0.5) / steps;
    let currentStep = 0;

    const fadeEffect = setInterval(() => {
        currentStep++;
        
        // ลดความเร็ว
        audio.playbackRate = Math.max(0.5, audio.playbackRate - rateStep);

        if (currentStep >= steps) {
            clearInterval(fadeEffect);
            audio.pause();
            
            // รีเซ็ตค่าเพื่อเปิดรอบหน้า
            audio.playbackRate = startRate;
            gainNode.gain.setValueAtTime(1, audioCtx.currentTime); // คืนค่าเสียง
            delete audio.dataset.isFading;
        }
    }, intervalTime);
}

async function renderChatMessages(messages) {
    const messagesContainer = document.querySelector('.chat-messages');
    const imagePath = window.getCloudinaryUrl('w_200', `customers/${window.customerId}/img/01.jpg`);
    messagesContainer.innerHTML = '';
    
    for (let i = 0; i < messages.length; i++) {
        // skip chat
        // if (i<10) continue;
        const msg = messages[i];
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.sender} hidden-message`;
        
        if (msg.sender === 'received') {
            messageDiv.dataset.waitTime = msg.waitTime;
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <img src="${imagePath}" alt="Profile" class="message-profile-pic">
                </div>
                <div class="message-bubble">
                    ${msg.message}
                </div>
            `;
        } else if (msg.sender === 'gallery') {
            window.isWaiting = true;
            messageDiv.innerHTML = `
                <div class="gallery-container">
                    <img src="${msg.galleryImage}" alt="Gallery" class="gallery-thumbnail">
                </div>
            `;
            messageDiv.dataset.galleryItems = JSON.stringify(msg.gallery_items);
        } else if (msg.sender === 'letter') {
            window.isWaiting = true;
            messageDiv.innerHTML = `
                <div class="letter-container">
                    <img src="https://res.cloudinary.com/dbfwylcui/image/upload/w_500,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/letter_close.png" class="letter-thumbnail">
                </div>
            `;
            messageDiv.dataset.letterInsideImage = msg.letterInsideImage;
            messageDiv.dataset.letterText = msg.letterText;
        } else if (msg.sender === 'quiz') {
            window.isWaiting = true;
            messageDiv.innerHTML = `
                <div class="quiz-thumbnail">
                    <img src="https://res.cloudinary.com/dbfwylcui/image/upload/w_500,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/quiz_1.png" alt="Quiz" class="quiz-thumbnail-image">
                </div>
            `;
            
            // Add click handler for the quiz image
            const quizImage = messageDiv.querySelector('.quiz-thumbnail-image');
            quizImage.style.cursor = 'pointer';
            quizImage.addEventListener('click', (e) => {
                e.stopPropagation();
                // Make sure we're passing a clean copy of the quiz data
                const quizData = JSON.parse(JSON.stringify(msg));
                if (window.startQuiz) {
                    window.startQuiz(quizData);
                } else {
                    console.error('startQuiz function not found');
                }
            });
        } else if (msg.sender === 'giftbox') {
            messageDiv.dataset.giftAmount = msg.gifts.length;
            window.isWaiting = true;
            const shuffledGiftImages = [...msg.gifts].sort(() => Math.random() - 0.5).map(g => g.gift_image);
            const giftsHtml = msg.gifts.map((gift, index) => {
                // Use the shuffled image for this gift
                const shuffledImage = shuffledGiftImages[index];
                return `
                    <div class="gift-item" data-index="${index}" data-opened="false">
                        <img src="${window.getAssetUrl("w_500", gift.gift_close_image)}" alt="Gift" class="gift-close">
                        <img src="${window.getAssetUrl("w_500", gift.gift_open_image)}" alt="Opened Gift" class="gift-open" style="display: none;">
                        <div class="gift-content-wrapper">
                            <img src="${window.getAssetUrl("w_500", shuffledImage)}" alt="Gift Content" class="gift-content" style="display: none;">
                        </div>
                    </div>
                `;
            }).join('');
            
            const labelHtml = msg.showLabel ? 
                `<div class="gift-label">${msg.label.replace('<quota>', msg.quota)}</div>` : '';
            
            messageDiv.innerHTML = `
                <div class="gift-container-${window.giftContainterNo}">
                    <div class="gifts-wrapper">
                        ${giftsHtml}
                    </div>
                    ${labelHtml}
                </div>
            `;
            
            messageDiv.dataset.quota = msg.quota || 1;
            messageDiv.dataset.openedCount = '0';
        } else {
            messageDiv.innerHTML = `
                <div class="message-bubble">
                    ${msg.message}
                </div>
            `;
        }
        
        messagesContainer.appendChild(messageDiv);
        window.AppAssets.audio.pop.play();
        await new Promise(resolve => setTimeout(resolve, 100));
        smoothScrollTo(messagesContainer, messagesContainer.scrollHeight, 800);
        
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        await (async () => {
            messageDiv.classList.remove('hidden-message');
            messageDiv.classList.add('animate-message');
            if (msg.sender === 'giftbox') {
                initializeGiftBox(messageDiv);
            } else if (msg.sender === 'gallery') {
                initializeGallery(messageDiv);
            } else if (msg.sender === 'letter') {
                initializeLetter(messageDiv);
            }
            const calculatedWaitTime = messageDiv.dataset.waitTime ? messageDiv.dataset.waitTime : window.chatWaitTime;
            await sleep(calculatedWaitTime);
            while (window.isWaiting === true) {
                await sleep(calculatedWaitTime);
            }
        })();
    }
}

// Initialize gift box interactions
function initializeGiftBox(giftContainer) {
    const giftItems = giftContainer.querySelectorAll('.gift-item');
    if (giftContainer.dataset.giftAmount === "1") {
        giftItems[0].classList.add('single-gift');
    } else {
        giftItems[0].classList.remove('single-gift');
    }
    const maxOpens = parseInt(giftContainer.dataset.quota, 10) || 1;
    let openedCount = 0;
    let isAnimating = false;
    
    giftItems.forEach((giftItem, index) => {
        giftItem.addEventListener('click', async () => {
            if (isAnimating) return;
            if (giftItem.dataset.opened === 'true') {
                await closeGift(giftItem, openedCount >= maxOpens);
                return;
            }
            if (openedCount >= maxOpens) return;
            
            isAnimating = true;
            
            await openGift(giftItem);
            openedCount++;
            giftContainer.dataset.openedCount = openedCount.toString();
            setTimeout(() => {isAnimating = false;}, 1000);
            
            if (openedCount >= maxOpens) {
                giftItems.forEach(item => {
                    if (item.dataset.opened !== 'true') {
                        item.classList.add('disabled-gift');
                    }
                });
                isReachLimitCurrent = true;
            }
        });
    });
    
    async function openGift(giftItem) {
        const giftClose = giftItem.querySelector('.gift-close');
        const giftOpen = giftItem.querySelector('.gift-open');
        const giftContent = giftItem.querySelector('.gift-content');
        const giftContentOutside = document.querySelector('.gift-content-outside');
        const giftContentOutsideBg = document.querySelector('.gift-content-outside-background');
        
        giftItem.classList.add('shake');
        const shakeAudio = window.AppAssets.audio.shake3;
        shakeAudio.currentTime = 1.3;
        shakeAudio.play();
        setTimeout(() => {
            shakeAudio.pause();
        }, 500)
        await new Promise(resolve => setTimeout(resolve, 1000));
        giftItem.classList.remove('shake');
        
        // Switch to open gift
        giftClose.style.display = 'none';
        giftOpen.style.display = 'block';
        
        // Show gift content in the outside container
        await new Promise(resolve => setTimeout(resolve, 300));
        giftItem.dataset.opened = 'true';
        
        // Clone the gift content to the outside container
        giftContentOutside.innerHTML = '';
        const clonedContent = giftContent.cloneNode(true);
        clonedContent.style.display = 'block';
        giftContentOutside.appendChild(clonedContent);
        
        giftContentOutsideBg.style.visibility = "visible";
        giftContentOutsideBg.classList.add('active');
        // Show the outside container with animation
        setTimeout(() => {
            window.AppAssets.audio.got_prize.play();
            giftContentOutside.classList.add('active');
        }, 300);
    }
}

function initializeGallery(galleryContainer) {
    const thumbnail = galleryContainer.querySelector('.gallery-thumbnail');
    const overlay = document.querySelector('.gallery-overlay');
    const closeBtn = overlay.querySelector('.close-gallery');
    const itemsContainer = overlay.querySelector('.gallery-items-container');
    const galleryItems = JSON.parse(galleryContainer.dataset.galleryItems);
    let isFirstOpen = true;

    // Thumbnail click handler
    thumbnail.addEventListener('click', async () => {
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        if (isFirstOpen) {
            await showGalleryItems(itemsContainer, galleryItems);
            isFirstOpen = false;
        } else {
            // Show all items immediately on subsequent opens
            itemsContainer.innerHTML = '';
            galleryItems.forEach((item, index) => {
                const itemElement = createGalleryItem(item, index);
                itemsContainer.appendChild(itemElement);
                // Make them all visible immediately
                setTimeout(() => {
                    itemElement.style.opacity = '1';
                    itemElement.style.transform = 'translateY(0)';
                }, 50);
            });
        }
        closeBtn.style.display = 'block';
    });

    // Close button handler
    closeBtn.addEventListener('click', () => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
            document.body.style.overflow = 'auto';
            overlay.style.opacity = '1';
            window.isWaiting = false; // Allow next message to load
        }, 300);
    });

    // Close when clicking outside content
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeBtn.click();
        }
    });
}

function initializeLetter(letterContainer) {
    const letterImageUrl = window.getCloudinaryUrl("w_1200", `customers/${window.customerId}/img/${letterContainer.dataset.letterInsideImage}`);
    const thumbnail = letterContainer.querySelector('.letter-thumbnail');
    const overlay = document.querySelector('.letter-overlay');
    const itemsContainer = overlay.querySelector('.letter-items-container');

    // สร้าง Element สำหรับข้อความแนะนำ (ถ้ายังไม่มีในหน้าเว็บ)
    let hintText = document.querySelector('.click-to-close');
    if (!hintText) {
        hintText = document.createElement('div');
        hintText.className = 'click-to-close';
        hintText.innerText = "...กดที่หน้าจอเพื่อปิดจดหมาย";
        document.body.appendChild(hintText);
    }

    overlay.addEventListener('click', () => {
        // เช็คว่าถ้า Hint Text ขึ้นมาแล้ว (แปลว่าพิมพ์จบและหน่วงเวลาครบแล้ว) ถึงจะให้ปิดได้
        if (hintText.classList.contains('visible')) {
            overlay.classList.remove('show');
            hintText.classList.remove('visible', 'pulse-text');
            overlay.style.cursor = 'default';
            
            setTimeout(() => {
                document.body.style.overflow = 'auto';
                window.isWaiting = false; // ปลดล็อคให้ข้อความถัดไปมาได้
            }, 300);
        }
    });

    thumbnail.addEventListener('click', async () => {
        // 1. จัดการรูปและเสียงเปิด
        if (!thumbnail.src.includes("letter_open.png")) {
            thumbnail.src = "https://res.cloudinary.com/dbfwylcui/image/upload/w_500,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/letter_open.png";
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        window.AppAssets.audio.letter_open.currentTime = 0.3;
        window.AppAssets.audio.letter_open.play();

        // 2. เคลียร์สถานะเก่าและโชว์ Overlay
        overlay.classList.add('show');
        hintText.classList.remove('visible', 'pulse-text'); // ซ่อนไว้ก่อน
        document.body.style.overflow = 'hidden';
        
        const textToPrint = letterContainer.dataset.letterText;
        const isAlreadyTyped = letterContainer.getAttribute('data-is-typed') === 'true';

        itemsContainer.innerHTML = `
            <div class="letter-content-wrapper">
                <div class="letter-image-container">
                    <img src="https://res.cloudinary.com/dbfwylcui/image/upload/w_600,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/polaroid.png" class="letter-inside-image">
                    <img src="${letterImageUrl}" class="user-photo">
                </div>
                <div class="letter-text-container">
                    <div class="letter-text" id="typing-text"></div>
                </div>
            </div>
        `;

        const typingElement = document.getElementById('typing-text');

        // 3. จัดการการพิมพ์และหน่วงเวลาโชว์คำแนะนำปิด
        if (isAlreadyTyped) {
            typingElement.innerHTML = `<span>${textToPrint}</span>`;
            // ถ้าเคยอ่านแล้ว หน่วง 1 วิพอให้เห็นคำแนะนำ
            setTimeout(() => {
                hintText.classList.add('visible', 'pulse-text');
                overlay.style.cursor = 'pointer'; // เปลี่ยน cursor ให้รู้ว่ากดได้
            }, 1000);
        } else {
            await typeWriter("typing-text", textToPrint, 50, window.AppAssets.audio.BG_SOUND_romantic);
            letterContainer.setAttribute('data-is-typed', 'true');
            
            // หน่วง 5 วิหลังจากพิมพ์จบตามโจทย์
            setTimeout(() => {
                hintText.classList.add('visible', 'pulse-text');
                overlay.style.cursor = 'pointer';
            }, 5000);
        }
    });
}

function typeWriter(elementId, text, speed, audioToFade) {
    return new Promise(resolve => {
        const element = document.getElementById(elementId);
        const segments = Array.from(new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(text.trim()));
        element.innerHTML = ''; 

        const fragment = document.createDocumentFragment();
        const characters = segments.map(s => {
            if (s.segment === '\n') {
                const br = document.createElement('br');
                fragment.appendChild(br);
                return br;
            }
            const span = document.createElement('span');
            span.textContent = s.segment; 
            span.className = 'char-unit';
            fragment.appendChild(span);
            return span;
        });
        element.appendChild(fragment);

        let startTime = null;
        let lastInx = -1;

        function render(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            
            // คำนวณว่า ณ เวลานี้ ควรแสดงถึงตัวอักษรที่เท่าไหร่
            const currentIdx = Math.floor(elapsed / speed);

            // วนลูปโชว์ตัวอักษรที่ควรจะขึ้นมาแล้ว (เผื่อกรณีเครื่องกระตุก มันจะโผล่มาพร้อมกันทีเดียว ไม่ข้ามตัว)
            for (let j = lastInx + 1; j <= currentIdx && j < characters.length; j++) {
                characters[j].classList.add('appeared');
                lastInx = j;
            }

            if (currentIdx < characters.length) {
                requestAnimationFrame(render);
            } else {
                resolve();
            }
        }

        requestAnimationFrame(render);
    });
}

async function showGalleryItems(container, items) {
    container.innerHTML = '';
    container.style.overflow = 'hidden';
    
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemElement = createGalleryItem(item, i);
        container.appendChild(itemElement);
        
        // Show the current item
        itemElement.style.opacity = '1';
        itemElement.style.transform = 'translateY(0)';
        
        await new Promise(resolve => setTimeout(resolve, 100));
        await smoothScrollTo(container, itemElement.offsetTop - (container.offsetHeight / 2) + (itemElement.offsetHeight / 2));

        // Wait before showing next item
        if (i < items.length - 1) {
            await new Promise(resolve => setTimeout(resolve, window.galleryWaitTime));
        } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Re-enable scrolling after all items are shown
    container.style.overflow = 'auto';
}

// Custom smooth scroll function
function smoothScrollTo(element, to, duration = 800) {
    const start = element.scrollTop;
    const change = to - start;
    const startTime = performance.now();
    
    function animateScroll(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeInOutCubic = progress < 0.5 
            ? 4 * progress * progress * progress 
            : (progress - 1) * (2 * progress - 2) * (2 * progress - 2) + 1;
        
        element.scrollTop = start + change * easeInOutCubic;
        
        if (elapsed < duration) {
            requestAnimationFrame(animateScroll);
        }
    }
    
    return new Promise(resolve => {
        requestAnimationFrame((timestamp) => {
            animateScroll(timestamp);
            setTimeout(resolve, duration);
        });
    });
}

// Helper function to check if element is in the middle of the viewport
function isElementInMiddleViewport(el) {
    const rect = el.getBoundingClientRect();
    const containerRect = el.parentElement.getBoundingClientRect();
    const middle = containerRect.top + containerRect.height / 2;
    return rect.top <= middle && rect.bottom >= middle;
}

function createGalleryItem(item, index) {
    const itemElement = document.createElement('div');
    itemElement.className = 'gallery-item';
    itemElement.style.opacity = '0';
    itemElement.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    itemElement.style.transform = 'translateY(20px)';
    itemElement.style.marginBottom = '30px';
    itemElement.style.width = '100%';
    itemElement.style.maxWidth = '800px';
    const imageUrl = window.getCloudinaryUrl('w_1200', `customers/${window.customerId}/img/${item.imageName}.jpg`)
    
    // Different layouts based on alignment
    if (item.align === 'left' || item.align === 'right') {
        itemElement.style.display = 'flex';
        itemElement.style.flexDirection = item.align === 'left' ? 'row' : 'row-reverse';
        itemElement.style.alignItems = 'flex-start';
        
        itemElement.innerHTML = `
            <div style="flex: 0 0 50%;">
                <img src="${imageUrl}" 
                     alt="${item.title}" 
                     style="width: 100%; 
                            border-radius: 12px; 
                            aspect-ratio: ${item.aspectRatio};
                            object-fit: cover;">
            </div>
            <div style="flex: 1;">
                <h3 style="margin: 0 0 10px 0; color: #e91e63; font-size: 1.4em;">${item.title}</h3>
                <p style="margin: 0; color: #555; line-height: 1.5;">${item.description}</p>
            </div>
        `;
    } else {
        // Center alignment
        itemElement.style.textAlign = 'center';
        itemElement.innerHTML = `
            <div style="margin-bottom: 15px;">
                <img src="${imageUrl}" 
                     alt="${item.title}" 
                     style="width: 100%; 
                            border-radius: 12px; 
                            aspect-ratio: ${item.aspectRatio};
                            object-fit: cover;">
            </div>
            <h3 style="margin: 0 0 10px 0; color: #e91e63; font-size: 1.4em;">${item.title}</h3>
            <p style="margin: 0 auto; color: #555; line-height: 1.5; max-width: 600px;">${item.description}</p>
        `;
    }
    
    return itemElement;
}
    
async function closeGift() {
    const giftContentOutside = document.querySelector('.gift-content-outside');
    const giftContentOutsideBg = document.querySelector('.gift-content-outside-background');
    
    // Hide the outside container with animation
    giftContentOutside.classList.remove('active');
    await new Promise(resolve => setTimeout(resolve, 300));
    giftContentOutsideBg.classList.remove('active');
    await new Promise(resolve => setTimeout(resolve, 300));
    giftContentOutsideBg.style.visibility = "hidden";
    giftContentOutside.innerHTML = '';
    
    const giftContainer = document.querySelector(`.gift-container-${window.giftContainterNo}`);
    if (!giftContainer) return;
    const giftItems = giftContainer.querySelectorAll('.gift-item');
    giftItems.forEach(async item => {
        const giftOpen = item.querySelector('.gift-open');
        const giftContent = item.querySelector('.gift-content');
        if (item.dataset.opened === 'true' && giftOpen.style.display === 'block') {
            giftOpen.classList.add('hide');
            await new Promise(resolve => setTimeout(resolve, 200));
            giftOpen.style.display = 'none';
            giftContent.style.display = 'block';
            giftContent.classList.add('pop');
        }
    });
    
    if (isReachLimitCurrent) {
        window.isWaiting = false;
        isReachLimitCurrent = false; // reset for next gift box message type
        window.giftContainterNo++;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const giftContentOutsideBg = document.querySelector('.gift-content-outside-background');
    giftContentOutsideBg.addEventListener('click', () => { closeGift(); });
});