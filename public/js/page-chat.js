// Function to load chat messages from data.json
async function loadChatMessages() {
    try {
        // Get the ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');

        showToast('A0');
        showToast(id);
        
        if (!id) {
            showToast("A1");
            console.error('No ID provided in URL');
            return;
        }

        showToast("A2");
        // Determine the correct path based on environment
        const basePath = window.location.hostname === 'localhost' ? 
            `../customers/${id}/data.json` : 
            `./customers/${id}/data.json`;
        
        showToast("A3");
        // Fetch the data
        const response = await fetch(basePath);
        if (!response.ok) {
            showToast("A4");
            throw new Error('Failed to load chat data');
        }
        
        showToast("A5");
        const data = await response.json();
        
        // Update profile images
        // const avatarPath = updateProfileImages(id);
        
        showToast("A6");
        // Render messages if they exist
        if (data.chat && Array.isArray(data.chat)) {
            showToast('A7');
            renderChatMessages(data.chat, id);
        }
    } catch (error) {
        console.error('Error loading chat:', error);
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    console.log(toast.textContent);
    toast.textContent = toast.textContent + "\n" + message;
}

// Function to update profile images
function updateProfileImages(customerId) {
    const isLocal = location.hostname === 'localhost';

    // Update chat header profile
    // const chatProfile = document.querySelector('.chat-profile-pic');
    // const messageAvatars = document.querySelectorAll('.message-avatar img');
    const imagePath = isLocal ? `../customers/${customerId}/img/01.jpg` : `../customers/${customerId}/img/01.jpg`;
    
    // chatProfile.src = imagePath;
    // messageAvatars.forEach(avatar => {
    //     avatar.src = imagePath;
    // });

    return imagePath;
}

// Function to render chat messages
// Function to render chat messages with animation
async function renderChatMessages(messages, customerId) {
    showToast('A8');
    const messagesContainer = document.querySelector('.chat-messages');
    if (!messagesContainer) return;
    
    const isLocal = location.hostname === 'localhost';
    const imagePath = isLocal ? `../customers/${customerId}/img/01.jpg` : `../customers/${customerId}/img/01.jpg`;
    
    // Clear existing messages
    messagesContainer.innerHTML = '';
    
    // Add each message with animation
    showToast(`Loading ${messages.length} messages...`);
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
            // Handle gift box message
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
            
            // Store gift data for interaction
            messageDiv.dataset.quota = msg.quota || 1;
            messageDiv.dataset.openedCount = '0';
        } else {
            // Default to sent message
            messageDiv.innerHTML = `
                <div class="message-bubble">
                    ${msg.message}
                </div>
            `;
        }
        
        messagesContainer.appendChild(messageDiv);
        
        // Animate each message with a delay
        await new Promise(resolve => {
            setTimeout(() => {
                messageDiv.classList.remove('hidden-message');
                messageDiv.classList.add('animate-message');
                
                // Initialize gift box interactions after the message is shown
                if (msg.sender === 'giftbox') {
                    initializeGiftBox(messageDiv);
                }
                
                resolve();
            }, 2000);
        });
        
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
            // Prevent interaction during animation or if quota is reached
            if (isAnimating || giftItem.dataset.opened === 'true' || openedCount >= maxOpens) {
                return;
            }
            
            isAnimating = true;
            
            // Close any currently open gift
            if (currentOpenGift && currentOpenGift !== giftItem) {
                await closeGift(currentOpenGift);
            }
            
            // Open the clicked gift
            await openGift(giftItem);
            openedCount++;
            giftContainer.dataset.openedCount = openedCount.toString();
            currentOpenGift = giftItem;
            
            // If quota is reached, disable other gifts
            if (openedCount >= maxOpens) {
                giftItems.forEach(item => {
                    if (item.dataset.opened !== 'true') {
                        item.classList.add('disabled-gift');
                    }
                });
                
                // Auto-close after delay
                setTimeout(() => {
                    if (currentOpenGift) {
                        closeGift(currentOpenGift).then(() => {
                            currentOpenGift = null;
                            isAnimating = false;
                        });
                    } else {
                        isAnimating = false;
                    }
                }, 2000);
            } else {
                isAnimating = false;
            }
        });
    });
    
    async function openGift(giftItem) {
        const giftClose = giftItem.querySelector('.gift-close');
        const giftOpen = giftItem.querySelector('.gift-open');
        const giftContent = giftItem.querySelector('.gift-content');
        
        // Add shake animation
        giftItem.classList.add('shake');
        
        // Wait for shake animation to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        giftItem.classList.remove('shake');
        
        // Switch to open gift
        giftClose.style.display = 'none';
        giftOpen.style.display = 'block';
        
        // Show gift content with pop animation
        await new Promise(resolve => setTimeout(resolve, 300));
        giftContent.style.display = 'block';
        giftContent.classList.add('gift-pop');
        
        // Mark as opened
        giftItem.dataset.opened = 'true';
    }
    
    async function closeGift(giftItem) {
        const giftContent = giftItem.querySelector('.gift-content');
        
        // Add close animation
        giftContent.classList.add('gift-drop');
        giftContent.classList.add('disabled-gift');
        
        // Wait for drop animation to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Reset states
        giftContent.style.display = 'none';
        giftContent.classList.remove('gift-pop', 'gift-drop');
    }
}

// Initialize the chat when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // loadChatMessages();
});