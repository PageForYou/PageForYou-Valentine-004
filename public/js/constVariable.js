window.AppAssets = {
    audio: {
        notification: new Audio('../public/assets/sound/noti_2.mp3'),
        unlock: new Audio('../public/assets/sound/unlock.mp3'),
        scan_pass: new Audio('../public/assets/sound/scan_pass.mp3'),
        correct: new Audio('../public/assets/sound/correct.mp3'),
        wrong: new Audio('../public/assets/sound/wrong.mp3'),
        got_prize: new Audio('../public/assets/sound/got_prize.mp3'),
        new_message: new Audio('../public/assets/sound/new_message.mp3'),
        letter_open: new Audio('../public/assets/sound/letter_open.mp3'),
        pop: new Audio('../public/assets/sound/pop.mp3'),
        fast_click: new Audio('../public/assets/sound/fast_click.mp3'),
        BG_SOUND_romantic: new Audio('../public/assets/sound/BG_SOUND_romantic.mp3'),
        shake: new Audio('../public/assets/sound/shake.mp3'),
        shake2: new Audio('../public/assets/sound/shake2.mp3'),
        shake3: new Audio('../public/assets/sound/shake3.mp3'),
    },
};
window.loadingTime = 1000;
window.isWaiting = false;
window.galleryWaitTime = 2000;
window.chatWaitTime = 2000;
window.giftContainterNo = 1;
window.scanVerifyTime = 2000;
window.scanWaitTime = 1000;
let urlParams = new URLSearchParams(window.location.search);
window.customerId = urlParams.get('id');
window.cloudinaryBase = "https://res.cloudinary.com/dbfwylcui/image/upload/PageForYou-Valentine-004";
window.cloudinaryBaseCustomer = `https://res.cloudinary.com/dbfwylcui/image/upload/PageForYou-Valentine-004/customers/${window.customerId}`;
window.getCloudinaryUrl = function (size, path) {
    return `https://res.cloudinary.com/dbfwylcui/image/upload/${size},f_auto,q_auto/PageForYou-Valentine-004/${path}`
}
window.getAssetUrl = function (size, imageName) {
    return `https://res.cloudinary.com/dbfwylcui/image/upload/${size},f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/${imageName}`
}
window.getCustomerImage = function (size, imageName) {
    return `https://res.cloudinary.com/dbfwylcui/image/upload/${size},f_auto,q_auto/PageForYou-Valentine-004/customers/${window.customerId}/img/${imageName}`
}
// sample url: 'https://res.cloudinary.com/dbfwylcui/image/upload/w_100,f_auto,q_auto/PageForYou-Valentine-004/public/assets/img/'