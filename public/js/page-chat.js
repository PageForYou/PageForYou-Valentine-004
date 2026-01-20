let isWaiting = false;
let isReachLimitCurrent = false;

async function loadChatMessages() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        const basePath = window.location.hostname === 'localhost' ? `../../customers/${id}/data.json` : `../customers/${id}/data.json`;
        
        const response = await fetch(basePath);
        if (!response.ok) {
            throw new Error('Failed to load chat data');
        }
        const data = await response.json();
        if (data.chat && Array.isArray(data.chat)) {
            renderChatMessages(data.chat, id);
        }
    } catch (error) {
        console.error('Error loading chat:', error);
    }
}

async function renderChatMessages(messages, customerId) {
    const messagesContainer = document.querySelector('.chat-messages');
    const isLocal = location.hostname === 'localhost';
    const imagePath = isLocal ? `../customers/${customerId}/img/01.jpg` : `../customers/${customerId}/img/01.jpg`;
    messagesContainer.innerHTML = '';
    
    for (let i = 0; i < messages.length; i++) {
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
        } else if (msg.sender === 'giftbox') {
            isWaiting = true;
            const giftsHtml = msg.gifts.map((gift, index) => `
                <div class="gift-item" data-index="${index}" data-opened="false">
                    <img src="${gift.gift_close_image}" alt="Gift" class="gift-close">
                    <img src="${gift.gift_open_image}" alt="Opened Gift" class="gift-open" style="display: none;">
                    <img src="${gift.gift_image}" alt="Gift Content" class="gift-content" style="display: none;">
                </div>
            `).join('');
            
            const labelHtml = msg.showLabel ? 
                `<div class="gift-label">${msg.label.replace('<quota>', msg.quota)}</div>` : '';
            
            messageDiv.innerHTML = `
                <div class="gift-container">
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
        
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        await (async () => {
            messageDiv.classList.remove('hidden-message');
            messageDiv.classList.add('animate-message');
            if (msg.sender === 'giftbox') {
                initializeGiftBox(messageDiv);
            }
            await sleep(500);
            while (isWaiting === true) {
                await sleep(1000);
            }
        })();
        
        // Scroll to bottom after each message
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Initialize gift box interactions
function initializeGiftBox(giftContainer) {
    const giftItems = giftContainer.querySelectorAll('.gift-item');
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
    
    if (isReachLimitCurrent) {
        isWaiting = false;
        isReachLimitCurrent = false; // reset for next gift box message type
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const giftContentOutsideBg = document.querySelector('.gift-content-outside-background');
    giftContentOutsideBg.addEventListener('click', () => { closeGift(); });
});