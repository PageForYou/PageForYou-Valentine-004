let isWaiting = false;

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
    let currentOpenGift = null;
    
    giftItems.forEach((giftItem, index) => {
        giftItem.addEventListener('click', async () => {
            if (isAnimating) return;
            if (giftItem.dataset.opened === 'true') {
                await closeGift(giftItem, openedCount >= maxOpens);
                return;
            }
            if (openedCount >= maxOpens) return;
            
            isAnimating = true;
            
            // Close any currently open gift
            if (currentOpenGift && currentOpenGift !== giftItem) {
                await closeGift(currentOpenGift);
            }
            
            await openGift(giftItem);
            openedCount++;
            giftContainer.dataset.openedCount = openedCount.toString();
            currentOpenGift = giftItem;
            setTimeout(() => {isAnimating = false;}, 1000);
            
            if (openedCount >= maxOpens) {
                giftItems.forEach(item => {
                    if (item.dataset.opened !== 'true') {
                        item.classList.add('disabled-gift');
                    }
                });
            }
        });
    });
    
    async function openGift(giftItem) {
        const giftClose = giftItem.querySelector('.gift-close');
        const giftOpen = giftItem.querySelector('.gift-open');
        const giftContent = giftItem.querySelector('.gift-content');
        
        giftItem.classList.add('shake');
        await new Promise(resolve => setTimeout(resolve, 1000));
        giftItem.classList.remove('shake');
        
        // Switch to open gift
        giftClose.style.display = 'none';
        giftOpen.style.display = 'block';
        
        // Show gift content with pop animation
        await new Promise(resolve => setTimeout(resolve, 300));
        giftContent.style.display = 'block';
        giftContent.classList.add('gift-pop');
        giftItem.dataset.opened = 'true';
    }
    
    async function closeGift(giftItem, isReachLimit) {
        const giftContent = giftItem.querySelector('.gift-content');
        giftContent.classList.add('gift-drop');
        await new Promise(resolve => setTimeout(resolve, 500));
        giftContent.style.display = 'none';
        giftContent.classList.remove('gift-pop', 'gift-drop');
        if (isReachLimit) isWaiting = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
});