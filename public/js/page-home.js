// Function to reset scan and show phone menu
function resetScanAndShowMenu() {
    const overlay = document.querySelector('.unlock-overlay');
    const identification = document.querySelector('.identification');
    const circle = document.querySelector('.progress-ring__circle');
    const phoneMenu = document.getElementById('phoneMenu');
    
    // Reset progress ring
    if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        circle.style.transition = 'none';
        circle.style.strokeDashoffset = circumference;
    }
    
    // Hide identification popup with animation
    if (identification) {
        identification.classList.remove('show');
        setTimeout(() => {
            identification.style.display = 'none';
        }, 300);
    }
    
    // Hide overlay with fade out
    overlay.classList.add('fade-out');
    setTimeout(() => {
        overlay.classList.remove('active', 'fade-out');
        overlay.dataset.scanInProgress = 'false';
    }, 300);
    
    // Show phone menu
    setTimeout(() => {
        phoneMenu.style.display = 'block';
        // Trigger reflow
        void phoneMenu.offsetWidth;
        phoneMenu.classList.add('visible');

        setTimeout(() => {

            if (window.loadChatMessages) {
                loadChatMessages();
            }
        }, 500);
    }, 100);
}

document.addEventListener('DOMContentLoaded', function() {
    // Check for ID parameter
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const isLocal = location.hostname === 'localhost';
 
    // Preload customer images
    const imageNumbers = ["01", "02", "03", "04", "05", "Q01", "L01"];
    const hiddenContainer = document.createElement('div');
    hiddenContainer.style.display = 'none';
    hiddenContainer.id = 'image-preload-container';
    document.body.appendChild(hiddenContainer);

    imageNumbers.forEach(imageNumber => {
        const img = new Image();
        img.src = `/customers/${id}/img/${imageNumber}.jpg`;
        hiddenContainer.appendChild(img);
    });

    fetch(`/customers/${id}/data.json`)
        .then(response => response.json())
        .then(data => {
            if (data.phoneBackground) {
                const phoneContainer = document.querySelector('.phone-container');
                if (phoneContainer) {
                    phoneContainer.style.backgroundImage = `url('/customers/${id}/img/${data.phoneBackground}')`;
                    phoneContainer.style.backgroundSize = 'cover';
                    phoneContainer.style.backgroundPosition = 'center';
                    phoneContainer.style.backgroundRepeat = 'no-repeat';
                }
            }
            if (data.chatBackground) {
                const chatContainer = document.querySelector('.chat-messages');
                if (chatContainer) {
                    chatContainer.style.backgroundImage = data.chatBackground.includes("public") ? `url('${data.chatBackground}')` : `url('/customers/${id}/img/${data.chatBackground}')`;
                    chatContainer.style.backgroundSize = 'cover';
                    chatContainer.style.backgroundPosition = 'center';
                    chatContainer.style.backgroundRepeat = 'no-repeat';
                }
            }
            if (data.Username) {
                const notificationTitle = document.querySelector('.notification-title');
                const chatName = document.querySelector('.chat-name');
                notificationTitle.textContent = data.Username;
                chatName.textContent = data.Username;
            }
        })
        .catch(error => console.error('Error loading customer data:', error));
    
    const errorMessage = document.getElementById('error-message');
    const phoneContainer = document.querySelector('.phone-container');
    const profilePic = document.getElementById('profile-pic');
    const chatProfile = document.querySelector('.chat-profile-pic');

    startHeartAnimation();

    const cursor = document.querySelector('.custom-cursor');
    // Only initialize cursor for non-touch devices
    if (window.matchMedia('(pointer: fine)').matches) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
        }, { passive: true });
    }
    
    if (!id) {
        errorMessage.classList.remove('hidden');
        phoneContainer.classList.add('hidden');
        return;
    }

    function openUnlockOverlay() {
        const overlay = document.querySelector('.unlock-overlay');
        overlay.classList.add('active');
    }

    const unlockBtn = document.querySelector('.unlock');
    unlockBtn.addEventListener('click', function() {
        openUnlockOverlay();
    });

    const notification = document.querySelector('.notification');
    notification.addEventListener('click', function() {
        openUnlockOverlay();
    });

    // Add click handler for fingerprint icon
    const fingerprintIcon = document.querySelector('.fingerprint-icon');
    // Remove any existing event listeners to prevent duplicates
    const newFingerprintIcon = fingerprintIcon.cloneNode(true);
    fingerprintIcon.parentNode.replaceChild(newFingerprintIcon, fingerprintIcon);
    
    // Inside the newFingerprintIcon event listener
    newFingerprintIcon.addEventListener('mousedown', function(e) {
        e.stopPropagation();
        document.body.classList.add('clicked');

        const circle = document.querySelector('.progress-ring__circle');
        const radius = circle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        const overlay = document.querySelector('.unlock-overlay');

        if (overlay.dataset.scanInProgress === 'true') return;
        
        // Set flag to prevent overlay closure
        overlay.dataset.scanInProgress = 'true';
        
        // Reset the circle
        circle.style.strokeDashoffset = circumference;
        circle.style.transition = `stroke-dashoffset ${window.scanWaitTime}ms linear`;
        
        // Animate the circle
        setTimeout(() => {
            circle.style.strokeDashoffset = '0';
        }, 10);
        
        // Create identification popup if it doesn't exist
        const partnerProfilePicPath = isLocal ? `../../customers/${id}/img/02.jpg` : `../customers/${id}/img/02.jpg`;
        const dataPath = isLocal ? `../../customers/${id}/data.json` : `../customers/${id}/data.json`;
        
        // Fetch identification data from JSON
        fetch(dataPath)
            .then(response => response.json())
            .then(data => {
                let identification = document.querySelector('.identification');
                if (!identification) {
                    identification = document.createElement('div');
                    identification.className = 'identification';
                    
                    // Generate HTML from identification data
                    const detailsHTML = data.identification.map(item => {
                        if (item.title === 'Personal Information') {
                            return `<h3>${item.text || item.title}</h3>`;
                        }
                        return `<p>${item.title}${item.text}</p>`;
                    }).join('');
                    
                    identification.innerHTML = `
                        <div class="identification-content">
                            <div class="identification-profile">
                                <img src="${partnerProfilePicPath}" alt="Profile" class="profile-pic">
                            </div>
                            <div class="identification-details">
                                ${detailsHTML}
                                <div class="verification-status">
                                    <span class="verification-icon">
                                        <img src="assets/img/loading_icon.png" alt="Loading" class="loading-icon">
                                    </span>
                                    <span class="verification-text">กำลังตรวจสอบ...</span>
                                </div>
                            </div>
                        </div>
                    `;
                    document.querySelector('.unlock-overlay').appendChild(identification);
                }
            })
            .catch(error => {
                console.error('Error loading identification data:', error);
                // Fallback to default content if there's an error
                let identification = document.querySelector('.identification');
                if (!identification) {
                    identification = document.createElement('div');
                    identification.className = 'identification';
                    identification.innerHTML = `
                        <div class="identification-content">
                            <div class="identification-profile">
                                <img src="${partnerProfilePicPath}" alt="Profile" class="profile-pic">
                            </div>
                            <div class="identification-details">
                                <h3>Fingerprint Data</h3>
                                <p>Error loading identification data</p>
                                <div class="verification-status">
                                    <span class="verification-icon">
                                        <img src="assets/img/loading_icon.png" alt="Loading" class="loading-icon">
                                    </span>
                                    <span class="verification-text">กำลังตรวจสอบ...</span>
                                </div>
                            </div>
                        </div>
                    `;
                    document.querySelector('.unlock-overlay').appendChild(identification);
                }
            });
        
        // Set up the completion handler
        const onComplete = () => {
            console.log('finger scan finished');
            // Keep the circle full
            circle.style.transition = 'all 0.3s ease';
            circle.style.strokeDashoffset = '0';
            overlay.dataset.scanFinished = 'true';
            
            // Show identification popup with animation
            const identification = document.querySelector('.identification');
            setTimeout(() => {
                identification.style.display = 'block';
                void identification.offsetWidth; // Trigger reflow
                identification.classList.add('show');
                window.AppAssets.audio.unlock.play();
                
                // After 3 seconds, update to success state
                setTimeout(() => {
                    window.AppAssets.audio.scan_pass.play();
                    const verificationIcon = identification.querySelector('.verification-icon');
                    const verificationText = identification.querySelector('.verification-text');
                    
                    if (verificationIcon && verificationText) {
                        verificationIcon.innerHTML = '✓';
                        verificationText.textContent = 'ตรวจสอบสำเร็จ';
                        identification.classList.add('verification-success');
                        console.log('open phone menu');
                        
                        // Reset scan and show phone menu after a short delay
                        setTimeout(resetScanAndShowMenu, 500);
                    }
                }, window.scanVerifyTime);
            }, 300);
            
            // Allow overlay closure after scan is complete
            setTimeout(() => {
                overlay.dataset.scanInProgress = 'false';
                overlay.dataset.scanFinished = 'false';
            }, 4000);
        };
        
        // Set a timeout for the scan
        const scanComplete = setTimeout(onComplete, window.scanWaitTime);
        
        // Handle mouse up/leave to cancel the scan
        const cancelScan = () => {
            if (overlay.dataset.scanFinished === 'true') return;
            clearTimeout(scanComplete);
            circle.style.transition = 'stroke-dashoffset 0.3s ease';
            circle.style.strokeDashoffset = circumference;
            document.removeEventListener('mouseup', cancelScan);
            document.removeEventListener('mouseleave', cancelScan);
            overlay.dataset.scanInProgress = 'false';
            
            // Hide identification popup if visible
            const identification = document.querySelector('.identification');
            if (identification) {
                identification.classList.remove('show');
                setTimeout(() => {
                    identification.style.display = 'none';
                }, 300);
            }
        };
        
        document.addEventListener('mouseup', cancelScan);
        document.addEventListener('mouseleave', cancelScan);
    });

    newFingerprintIcon.addEventListener('touchstart', function(e) {
        e.preventDefault();
        // Trigger the mousedown event
        const event = new MouseEvent('mousedown');
        this.dispatchEvent(event);
    }, { passive: false });
    // Update the existing contextmenu event listener
    newFingerprintIcon.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });

    // Prevent context menu on long press
    newFingerprintIcon.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    document.addEventListener('click', function(e) {
        const overlay = document.querySelector('.unlock-overlay');
        if (overlay.dataset.scanInProgress === 'true') return;
        const fingerprintScan = document.querySelector('.fingerprint-scan');
        const identification = document.querySelector('.identification');
        
        // Don't close if click is on notification, identification, or during scan
        if (e.target.closest('.notification') || 
            e.target.closest('.identification') ||
            overlay.dataset.scanInProgress === 'true') {
            return;
        }
        
        if (overlay.classList.contains('active') && 
            !fingerprintScan.contains(e.target) &&
            !e.target.classList.contains('unlock')) {
            
            // Hide identification popup if visible
            if (identification) {
                identification.classList.remove('show');
            }
            
            // Add fade-out class
            overlay.classList.add('fade-out');
            
            // Remove active class after animation completes
            setTimeout(() => {
                overlay.classList.remove('active', 'fade-out');
                // Reset scan state when overlay is closed
                overlay.dataset.scanInProgress = 'false';
                // Reset progress ring
                const circle = document.querySelector('.progress-ring__circle');
                if (circle) {
                    const radius = circle.r.baseVal.value;
                    const circumference = 2 * Math.PI * radius;
                    circle.style.transition = 'none';
                    circle.style.strokeDashoffset = circumference;
                }
            }, 300);
        }
    });
    
    // Set profile picture source
    const profilePicPath = isLocal ? `../../customers/${id}/img/01.jpg` : `../customers/${id}/img/01.jpg`;
    profilePic.src = profilePicPath;
    chatProfile.src = profilePicPath;
    
    // Handle image loading errors
    profilePic.onerror = function() {
        // Fallback to a default profile picture if the image fails to load
        profilePic.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVlZWVlIi8+PHRleHQgeD0iNTAiIHk9IjUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5+QH4je31+PC90ZXh0Pjwvc3ZnPg==';
    };
    
    // Update time and date
    function updateDateTime() {
        const now = new Date();
        
        // Update time (HH:MM format)
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.querySelector('.time-text').textContent = `${hours}:${minutes}`;
        
        // Update date in Thai
        const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
        const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
                       'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
        
        const dayName = days[now.getDay()];
        const day = now.getDate();
        const month = months[now.getMonth()];
        const year = now.getFullYear() + 543; // Convert to Buddhist year
        
        document.querySelector('.date-text').textContent = 
            `วัน${dayName}ที่ ${day} ${month} ${year}`;
    }
    
    const mainContent = document.querySelector('.phone-container');
    if (errorMessage.classList.contains('hidden')) {
        mainContent.classList.remove('hidden');
        updateDateTime();
        setInterval(updateDateTime, 6000);
    } else {
        mainContent.style.display = 'none';
    }
});

function startHeartAnimation() {
    const screenWidth = window.innerWidth;
    const generationInterval = 1500 / (screenWidth / 150); 
    const heartImagePath = "./assets/img/heart_red.png";

    setInterval(() => {
        const heart = document.createElement('div');
        const size = Math.floor(Math.random() * 31) + 30; // 30-60px
        const duration = 8 * (size / 30);
        const posX = Math.random() * screenWidth;
        const rotate = (Math.random() * 40 - 20);

        heart.className = 'floating-heart';
        
        heart.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${posX}px;
            background-image: url('${heartImagePath}');
            animation: floatUp ${duration}s linear forwards;
            --random-rotate: ${rotate}deg;
        `;

        document.body.appendChild(heart);
        heart.addEventListener('animationend', () => heart.remove(), { once: true });
        
    }, generationInterval);
}