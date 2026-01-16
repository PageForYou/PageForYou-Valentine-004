// Function to load chat messages from data.json
async function loadChatMessages() {
    try {
        // Get the ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        if (!id) {
            console.error('No ID provided in URL');
            return;
        }

        // Determine the correct path based on environment
        const basePath = window.location.hostname === 'localhost' ? 
            `../customers/${id}/data.json` : 
            `./customers/${id}/data.json`;
        
        // Fetch the data
        const response = await fetch(basePath);
        if (!response.ok) {
            throw new Error('Failed to load chat data');
        }
        
        const data = await response.json();
        
        // Update profile images
        // const avatarPath = updateProfileImages(id);
        
        // Render messages if they exist
        if (data.chat && Array.isArray(data.chat)) {
            renderChatMessages(data.chat, id);
        }
    } catch (error) {
        console.error('Error loading chat:', error);
    }
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
    const messagesContainer = document.querySelector('.chat-messages');
    if (!messagesContainer) return;
    
    const isLocal = location.hostname === 'localhost';
    const imagePath = isLocal ? `../customers/${customerId}/img/01.jpg` : `../customers/${customerId}/img/01.jpg`;
    
    // Clear existing messages
    messagesContainer.innerHTML = '';
    
    // Add each message with animation
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
        } else {
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
                resolve();
            }, 2000);
        });
        
        // Scroll to bottom after each message
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Initialize the chat when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // loadChatMessages();
});