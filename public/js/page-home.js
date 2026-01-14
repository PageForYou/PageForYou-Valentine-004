document.addEventListener('DOMContentLoaded', function() {
    // Check for ID parameter
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    const errorMessage = document.getElementById('error-message');
    const phoneContainer = document.querySelector('.phone-container');
    const profilePic = document.getElementById('profile-pic');
    
    if (!id) {
        errorMessage.classList.remove('hidden');
        phoneContainer.classList.add('hidden');
        return;
    }

    const unlockBtn = document.querySelector('.unlock');
    if (unlockBtn) {
        unlockBtn.addEventListener('click', function() {
            console.log('press unlock');
            // Add your unlock logic here later
        });
    }
    
    // Set profile picture source
    const profilePicPath = `../../customers/${id}/img/01.jpg`;
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
        setInterval(updateDateTime, 60000);
        
        // Add animation class after a short delay to make it look like a real notification
        setTimeout(() => {
            const notification = document.querySelector('.notification');
            notification.style.animation = 'slideIn 0.5s ease-out forwards';
        }, 500);
    } else {
        mainContent.style.display = 'none';
    }
});