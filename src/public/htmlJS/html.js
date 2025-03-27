// Get the audio element and the button
const backgroundMusic = document.getElementById('background-music');
const volumeSlider = document.getElementById('sound-volume');

backgroundMusic.volume = volumeSlider.value / 100; //trong khoang 0.0 va 1.0 nen can chia 100

volumeSlider.addEventListener("input", function () {
    backgroundMusic.volume = this.value / 100; //trong khoang 0.0 va 1.0 nen can chia 100
})

// Start playing music on page load
window.addEventListener('click', () => {
    backgroundMusic.play();
}, { once: true });

//Test cai dai mini window
document.addEventListener('DOMContentLoaded', () => {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsWindow = document.getElementById('settings-window');
    const closeSettings = document.getElementById('close-settings');

    settingsBtn.addEventListener('click', () => {
        settingsWindow.classList.remove('hidden');
    });

    closeSettings.addEventListener('click', () => {
        settingsWindow.classList.add('hidden');
    });
});

//Test cai skibidi sigmarium
document.addEventListener('DOMContentLoaded', () => {
    const creditBtn = document.getElementById('btnCredit');
    const creditWindow = document.getElementById('Credit-window');
    const closeCredit = document.getElementById('close-credit');

    creditBtn.addEventListener('click', () => {
        creditWindow.classList.remove('hidden');
    });

    closeCredit.addEventListener('click', () => {
        creditWindow.classList.add('hidden');
    });
});

//test xe tang di chuyen trong background
// Biến theo dõi số lượng item
var activeItems = 0;
var maxItems = 5;

// Hàm thêm item ngẫu nhiên
function addRandomItems() {
    if (activeItems >= maxItems) {
        setTimeout(addRandomItems, 3000);
        return;
    }

    var images = [
        'https://media.discordapp.net/attachments/1347464027231490092/1354392392828190801/0a7d186823fe3d6468177ed8fda62123-removebg-preview.png?ex=67e51fb5&is=67e3ce35&hm=f0beb2c994e2469c414002be0cafb18f63c1633fc2d1dbe95eaeec3c9709e308&=&format=webp&quality=lossless&width=761&height=511',
        'https://media.discordapp.net/attachments/1237815793987616954/1354393095197687979/artwork-removebg-preview.png?ex=67e5205d&is=67e3cedd&hm=d3a3f84c974c5b52ce41f5c8cde90b55d3827613ebf966146a8acac3b2a11d51&=&format=webp&quality=lossless&width=863&height=453'
    ];

    var item = document.createElement('img');
    item.src = images[Math.floor(Math.random() * images.length)];
    item.className = 'random-item';

    // Xác định vị trí xuất phát
    var startPosition = Math.floor(Math.random() * 4);
    var endPosition = (startPosition + 2) % 4;
    var startX, startY, endX, endY;

    switch (startPosition) {
        case 0: startX = Math.random() * window.innerWidth; startY = -50; break;
        case 1: startX = window.innerWidth + 50; startY = Math.random() * window.innerHeight; break;
        case 2: startX = Math.random() * window.innerWidth; startY = window.innerHeight + 50; break;
        case 3: startX = -50; startY = Math.random() * window.innerHeight; break;
    }

    switch (endPosition) {
        case 0: endX = Math.random() * window.innerWidth; endY = -50; break;
        case 1: endX = window.innerWidth + 50; endY = Math.random() * window.innerHeight; break;
        case 2: endX = Math.random() * window.innerWidth; endY = window.innerHeight + 50; break;
        case 3: endX = -50; endY = Math.random() * window.innerHeight; break;
    }

    item.style.left = startX + 'px';
    item.style.top = startY + 'px';

    // Tạo animation động
    var duration = 15 + Math.random() * 10;
    var uniqueId = new Date().getTime() + Math.random().toString(16).slice(2);
    var initialRotation = Math.random() * 360;
    var rotationAmount = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720);

    var styleSheet = document.createElement("style");
    styleSheet.innerHTML = `
        @keyframes moveAndRotate${uniqueId} {
            from { transform: translate(0, 0) rotate(${initialRotation}deg); }
            to { transform: translate(${endX - startX}px, ${endY - startY}px) rotate(${initialRotation + rotationAmount}deg); }
        }
    `;
    document.head.appendChild(styleSheet);

    item.style.animation = `moveAndRotate${uniqueId} ${duration}s linear forwards`;
    document.body.appendChild(item);

    // Xóa item sau khi animation kết thúc
    setTimeout(() => {
        if (item.parentNode) {
            item.parentNode.removeChild(item);
            activeItems--;
        }
    }, duration * 1000);

    activeItems++;
    setTimeout(addRandomItems, 5000 + Math.random() * 8000);
}

// Kiểm tra ảnh và khởi động chương trình
window.onload = function () {
    var testImage = new Image();
    testImage.onload = function () {
        console.log("Image loaded successfully");
        setTimeout(addRandomItems, 1000);
    };
    testImage.onerror = function () {
        console.error("Error loading image. Using fallback.");
        setTimeout(addFallbackItems, 1000);
    };
    testImage.src = 'https://media.discordapp.net/attachments/1347464027231490092/1353337693823701003/5818233.png?ex=67e49532&is=67e343b2&hm=f5a46894718a5eb0acb50a1e4fc4fe22cd80788be0f1930eb2b2dd14b4d496e8&=&format=webp&quality=lossless&width=640&height=640';
};

// Hàm fallback nếu không tải được hình ảnh
function addFallbackItems() {
    if (activeItems >= maxItems) {
        setTimeout(addFallbackItems, 3000);
        return;
    }

    var item = document.createElement('div');
    item.textContent = "●";
    item.className = 'random-item';
    item.style.fontSize = "20px";
    item.style.color = "rgba(0,0,0,0.5)";

    activeItems++;
    document.body.appendChild(item);
}

//Click choi se hien ra socket va dong code cua nam
document.addEventListener("DOMContentLoaded", function () {
    const playButton = document.getElementById("play-btn");
    const menu = document.getElementById("menu");
    const gameContainer = document.getElementById("game-container");
    const backButton = document.getElementById("back-to-menu");

    playButton.addEventListener("click", function () {
        menu.style.display = "none"; // Hide menu
        gameContainer.style.display = "block"; // Show game-container only
    });

    backButton.addEventListener("click", function () {
        gameContainer.style.display = "none"; // Hide game-container
        menu.style.display = "flex"; // Show menu again
    });
});

