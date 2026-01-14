document.addEventListener('DOMContentLoaded', function() {
    // Check for ID parameter
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const isLocal = location.hostname === 'localhost';
    
    const errorMessage = document.getElementById('error-message');
    const phoneContainer = document.querySelector('.phone-container');
    const profilePic = document.getElementById('profile-pic');
    
    const SCAN_TIME = 1000;

    const cursor = document.querySelector('.custom-cursor');
    // Move custom cursor with mouse
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
    });
    // Change cursor on click
    document.addEventListener('mousedown', () => {
        document.body.classList.add('clicked');
    });
    document.addEventListener('mouseup', () => {
        document.body.classList.remove('clicked');
    });
    // // Hide default cursor and show custom cursor when mouse enters the window
    // document.addEventListener('mouseenter', () => {
    //     cursor.style.opacity = '1';
    // });
    // // Optional: Hide custom cursor when mouse leaves the window
    // document.addEventListener('mouseleave', () => {
    //     cursor.style.opacity = '0';
    // });
    // // Make sure cursor is visible by default
    // cursor.style.opacity = '1';
    
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
            
            // Reset the circle
            circle.style.strokeDashoffset = circumference;
            circle.style.transition = `stroke-dashoffset ${SCAN_TIME}ms linear`;
            
            // Animate the circle
            setTimeout(() => {
                circle.style.strokeDashoffset = '0';
            }, 10);
            
            // Set up the completion handler
            const onComplete = () => {
                console.log('finger scan finished');
                // Reset the circle when done
                setTimeout(() => {
                    circle.style.transition = 'none';
                    circle.style.strokeDashoffset = circumference;
                }, 100);
            };
            
            // Set a timeout for 2 seconds
            const scanComplete = setTimeout(onComplete, SCAN_TIME);
            
            // Handle mouse up/leave to cancel the scan
            const cancelScan = () => {
                clearTimeout(scanComplete);
                circle.style.transition = 'stroke-dashoffset 0.3s ease';
                circle.style.strokeDashoffset = circumference;
                document.removeEventListener('mouseup', cancelScan);
                document.removeEventListener('mouseleave', cancelScan);
            };
            
            document.addEventListener('mouseup', cancelScan);
            document.addEventListener('mouseleave', cancelScan);
        });

        // Prevent context menu on long press
        newFingerprintIcon.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
        });
    });

    document.addEventListener('click', function(e) {
        const overlay = document.querySelector('.unlock-overlay');
        const fingerprintScan = document.querySelector('.fingerprint-scan');
        const notification = document.querySelector('.notification'); // Add this line to get the notification element
        
        // If the click is on the notification, don't close the overlay
        if (e.target.closest('.notification')) {
            return;
        }
        
        if (overlay.classList.contains('active') && 
            !fingerprintScan.contains(e.target) &&
            !e.target.classList.contains('unlock') &&
            !e.target.closest('.notification')) {  // Additional check for notification
            
            // Add fade-out class
            overlay.classList.add('fade-out');
            
            // Remove active class after animation completes
            setTimeout(() => {
                overlay.classList.remove('active', 'fade-out');
            }, 300);
        }
    });

    const notification = document.querySelector('.notification');
    notification.addEventListener('click', function() {
        openUnlockOverlay();
    });
    
    // Set profile picture source
    const profilePicPath = isLocal ? `../../customers/${id}/img/01.jpg` : `../customers/${id}/img/01.jpg`;
    profilePic.src = profilePicPath;
    
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
    
    // Hide the main content if there's an error
    const mainContent = document.querySelector('.phone-container');
    if (errorMessage.classList.contains('hidden')) {
        mainContent.classList.remove('hidden');
        // Update immediately and then every minute
        updateDateTime();
        setInterval(updateDateTime, 6000);
        
        // Add animation class after a short delay to make it look like a real notification
        setTimeout(() => {
            const notification = document.querySelector('.notification');
            notification.style.animation = 'slideIn 0.5s ease-out forwards';
        }, 500);
    } else {
        mainContent.style.display = 'none';
    }
});