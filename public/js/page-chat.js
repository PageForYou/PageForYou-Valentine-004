window.isWaiting = false;
window.galleryWaitTime = 2000;
window.chatWaitTime = 2000;
window.giftContainterNo = 1;
let isReachLimitCurrent = false;
const isLocal = location.hostname === 'localhost';
const urlParams = new URLSearchParams(window.location.search);
const customerId = urlParams.get('id');

async function loadChatMessages() {
    try {
        const basePath = window.location.hostname === 'localhost' ? `../../customers/${customerId}/data.json` : `../customers/${customerId}/data.json`;
        
        const response = await fetch(basePath);
        if (!response.ok) {
            throw new Error('Failed to load chat data');
        }
        const data = await response.json();
        if (data.chat && Array.isArray(data.chat)) {
            renderChatMessages(data.chat);
        }
    } catch (error) {
        console.error('Error loading chat:', error);
    }
}

async function renderChatMessages(messages) {
    const messagesContainer = document.querySelector('.chat-messages');
    const imagePath = isLocal ? `../customers/${customerId}/img/01.jpg` : `../customers/${customerId}/img/01.jpg`;
    messagesContainer.innerHTML = '';
    
    for (let i = 0; i < messages.length; i++) {
        // if (i<10) continue;
        const msg = messages[i];
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.sender} hidden-message`;
        
        if (msg.sender === 'received') {
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
                    <img src="../public/assets/img/letter_close.png" class="letter-thumbnail">
                </div>
            `;
            messageDiv.dataset.letterInsideImage = msg.letterInsideImage;
            messageDiv.dataset.letterText = msg.letterText;
        } else if (msg.sender === 'quiz') {
            window.isWaiting = true;
            messageDiv.innerHTML = `
                <div class="quiz-thumbnail">
                    <img src="../public/assets/img/quiz_1.png" alt="Quiz" class="quiz-thumbnail-image">
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
                        <img src="${gift.gift_close_image}" alt="Gift" class="gift-close">
                        <img src="${gift.gift_open_image}" alt="Opened Gift" class="gift-open" style="display: none;">
                        <div class="gift-content-wrapper">
                            <img src="${shuffledImage}" alt="Gift Content" class="gift-content" style="display: none;">
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
        await new Promise(resolve => setTimeout(resolve, 100));
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
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
            await sleep(window.chatWaitTime);
            while (window.isWaiting === true) {
                await sleep(window.chatWaitTime);
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
    const basePath = isLocal ? `../customers/${customerId}/img/` : `../customers/${customerId}/img/`;
    const thumbnail = letterContainer.querySelector('.letter-thumbnail');
    const overlay = document.querySelector('.letter-overlay');
    const closeBtn = overlay.querySelector('.close-letter');
    const itemsContainer = overlay.querySelector('.letter-items-container');

    thumbnail.addEventListener('click', async () => {
        if (!thumbnail.src.includes("letter_open.png")) {
            thumbnail.src = "../public/assets/img/letter_open.png";
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
        const textToPrint = letterContainer.dataset.letterText;

        itemsContainer.innerHTML = `
            <div class="letter-content-wrapper">
                <div class="letter-image-container">
                    <img src="${basePath + letterContainer.dataset.letterInsideImage}" alt="Letter Content" class="letter-inside-image">
                </div>
                
                <div class="letter-text-container">
                    <div class="letter-text ghost-text" style="visibility: hidden;">${textToPrint}</div>
                    
                    <div class="letter-text" id="typing-text"></div>
                </div>
            </div>
        `;

        typeWriter("typing-text", textToPrint, 50);
        closeBtn.style.display = 'block';
    });

    // Close button handler
    closeBtn.addEventListener('click', () => {
        overlay.classList.remove('show');
        setTimeout(() => {
            document.body.style.overflow = 'auto';
            window.isWaiting = false; // Allow next message to load
        }, 300);
    });
}

function typeWriter(elementId, text, speed) {
    let i = 0;
    const element = document.getElementById(elementId);
    element.innerHTML = ""; // เคลียร์ค่าว่างก่อนเริ่ม

    function typing() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(typing, speed);
        }
    }
    typing();
}

async function showGalleryItems(container, items) {
    container.innerHTML = '';
    container.style.overflow = 'hidden'; // Prevent user scrolling
    
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemElement = createGalleryItem(item, i);
        container.appendChild(itemElement);
        
        // Show the current item
        itemElement.style.opacity = '1';
        itemElement.style.transform = 'translateY(0)';
        
        await new Promise(resolve => setTimeout(resolve, 100));
        // Custom smooth scroll to the new item
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
    const basePath = isLocal ? `../customers/${customerId}/img/` : `../customers/${customerId}/img/`;
    
    // Different layouts based on alignment
    if (item.align === 'left' || item.align === 'right') {
        itemElement.style.display = 'flex';
        itemElement.style.flexDirection = item.align === 'left' ? 'row' : 'row-reverse';
        itemElement.style.alignItems = 'flex-start';
        
        itemElement.innerHTML = `
            <div style="flex: 0 0 50%;">
                <img src="${basePath}${item.imageName}.jpg" 
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
                <img src="${basePath}${item.imageName}.jpg" 
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