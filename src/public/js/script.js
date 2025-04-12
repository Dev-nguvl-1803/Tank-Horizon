// Get the audio element and the button
const backgroundMusic = document.getElementById('background-music');
const volumeSlider = document.getElementById('sound-volume');

backgroundMusic.volume = volumeSlider.value / 100; //trong khoang 0.0 va 1.0 nen can chia 100

volumeSlider.addEventListener("input", function () {
    backgroundMusic.volume = this.value / 100;
})

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

document.addEventListener('DOMContentLoaded', () => {
    const creditBtn = document.getElementById('btnCredit');
    const creditWindow = document.getElementById('Credit-window');
    const closeCredit = document.getElementById('close-credit');
    const leaderboard = document.querySelectorAll('.container');

    creditBtn.addEventListener('click', () => {
        creditWindow.classList.remove('hidden');
        leaderboard.forEach(logo => {
            logo.style.visibility = 'hidden';
        });
    });

    closeCredit.addEventListener('click', () => {
        creditWindow.classList.add('hidden');
        leaderboard.forEach(logo => {
            logo.style.visibility = 'visible';
        });
    });
});

//test xe tang di chuyen trong background
// Biến theo dõi số lượng item
var activeItems = 0;
var maxItems = 5;

function addRandomItems() {
    if (activeItems >= maxItems) {
        setTimeout(addRandomItems, 3000);
        return;
    }

    var images = [
        '../Source/blue_tank.png',
        '../Source/red_tank.png',
        '../Source/green_tank.png',
        '../Source/yellow_tank.png'
    ];

    var item = document.createElement('img');
    item.src = images[Math.floor(Math.random() * images.length)];
    item.className = 'random-item';

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
    setTimeout(addRandomItems, 5000 + Math.random() * 1000);
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
    testImage.src = '../Source/tank.png';
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

//Click Choi se hien ra 3 form
document.addEventListener("DOMContentLoaded", function () {
    const playButton = document.getElementById("play-btn");
    const playMenu = document.getElementById("menu");
    const play = document.getElementById("play");
    const closePlay = document.getElementById('close-play');

    playButton.addEventListener("click", function () {
        anime({
            targets: playMenu,
            opacity: [1, 0],
            easing: 'easeInOutQuad',
            complete: function () {
                playMenu.style.display = "none";
                play.style.display = "block";

                // Animation dạng mảnh ghép
                anime.timeline({
                    easing: 'easeOutExpo',
                    duration: 600
                })
                    .add({
                        targets: '#HelloWorld',
                        opacity: [0, 1],
                        translateY: [40, 0],
                    })
                    .add({
                        targets: '#Description',
                        opacity: [0, 1],
                        translateY: [40, 0],
                    })
                    .add({
                        targets: '#windowTaoPhong',
                        opacity: [0, 1],
                        translateY: [40, 0],
                    })
                    .add({
                        targets: '#windowThamGiaPhong',
                        opacity: [0, 1],
                        translateY: [40, 0],
                    })
                    .add({
                        targets: '#windowKhanGia',
                        opacity: [0, 1],
                        translateY: [40, 0],
                    })
                    .add({
                        targets: '#close-play',
                        opacity: [0, 1],
                        scale: [0.8, 1],
                    });
            }
        });
    });

    closePlay.addEventListener("click", function () {
        anime({
            targets: play,
            opacity: [1, 0],
            duration: 400,
            easing: 'easeInOutQuad',
            complete: function () {
                play.style.display = "none";
                playMenu.style.display = "flex";
                anime({
                    targets: playMenu,
                    opacity: [0, 1],
                    duration: 400,
                    easing: 'easeOutQuad'
                });
            }
        });
    });
});

//Warning for not inputting name
document.addEventListener("DOMContentLoaded", () => {
    const createButton = document.querySelector("#windowTaoPhong button");
    const nameInput = document.getElementById("newName-create");
    const createRoomDiv = document.getElementById("Create-room");
    const closeCreateRoomBtn = document.getElementById("close-createroom");

    function showError(message) {
        const existingError = document.querySelector(".error-popup");
        if (existingError) existingError.remove();

        const errorDiv = document.createElement("div");
        errorDiv.classList.add("error-popup");
        errorDiv.innerHTML = `
            <div class="error-box">
                <img src="../Source/warn.png" class="error-icon"></div>
                <div class="error-text">${message}</div>
            </div>
        `;
        document.body.appendChild(errorDiv);

        setTimeout(() => errorDiv.style.opacity = "1", 100);
        setTimeout(() => {
            errorDiv.style.opacity = "0";
            setTimeout(() => errorDiv.remove(), 500);
        }, 3000);
    }

    createButton.addEventListener("click", (e) => {
        e.preventDefault();
        const nameValue = nameInput.value.trim();
        if (nameValue === "") {
            showError("<b>Thất bại!</b><br>Tên không được để trống");
        }
    });

    closeCreateRoomBtn.addEventListener("click", () => {
        console.log("Close button clicked.");
        createRoomDiv.classList.add("hidden");
        document.getElementById("play").style.display = "block";
    });
});

//Warning missing id or incorrect on Khan Gia
document.addEventListener("DOMContentLoaded", () => {
    const viewButton = document.querySelector("#windowKhanGia button");
    const joinIdInput = document.getElementById("joinId-Spectator");
    const playerImages = [
        "../Source/green_tank.png",
        "../Source/red_tank.png",
        "../Source/blue_tank.png",
        "../Source/yellow_tank.png"
    ];

    function showError(message) {
        const existingError = document.querySelector(".error-popup");
        if (existingError) existingError.remove();

        const errorDiv = document.createElement("div");
        errorDiv.classList.add("error-popup");
        errorDiv.innerHTML = `
            <div class="error-box">
                <img src="../Source/warn.png" class="error-icon"></div>
                <div class="error-text">${message}</div>
            </div>
        `;
        document.body.appendChild(errorDiv);

        setTimeout(() => errorDiv.style.opacity = "1", 100);
        setTimeout(() => {
            errorDiv.style.opacity = "0";
            setTimeout(() => errorDiv.remove(), 500);
        }, 3000);
    }

    viewButton.addEventListener("click", (e) => {
        e.preventDefault();

        const roomCode = joinIdInput.value.trim();

        console.log("Entered Room Code:", roomCode);

        if (roomCode === "") {
            showError("<b>Thất bại!</b><br>Mã phòng không được để trống");
            return;
        }
    });
});

//Warning missing id or incorrect on JoinRoom 1
document.addEventListener("DOMContentLoaded", () => {
    const autoJoinButton = document.querySelector("#joinGame");
    const nameInput = document.getElementById("joinName");
    const joinRoomDiv = document.getElementById("Join-room");
    const closeJoinRoomBtn = document.getElementById("close-joinroom");

    autoJoinButton.classList.add("disabled");

    function showError(message) {
        const existingError = document.querySelector(".error-popup");
        if (existingError) existingError.remove();

        const errorDiv = document.createElement("div");
        errorDiv.classList.add("error-popup");
        errorDiv.innerHTML = `
            <div class="error-box">
                <img src="../Source/warn.png" class="error-icon"></div>
                <div class="error-text">${message}</div>
            </div>
        `;
        document.body.appendChild(errorDiv);

        setTimeout(() => errorDiv.style.opacity = "1", 100);
        setTimeout(() => {
            errorDiv.style.opacity = "0";
            setTimeout(() => errorDiv.remove(), 500);
        }, 3000);
    }

    autoJoinButton.addEventListener("click", (e) => {
        e.preventDefault();

        const nameValue = nameInput.value.trim();

        if (nameValue === "") {
            showError("<b>Thất bại!</b><br>Tên không được để trống");
        }
    });

    closeJoinRoomBtn.addEventListener("click", () => {
        console.log("Close button clicked.");
        joinRoomDiv.classList.add("hidden");
        document.getElementById("play").style.display = "block";
    });
});

//Warning missing id or incorrect on JoinRoom 2
document.addEventListener("DOMContentLoaded", () => {
    const joinButton = document.getElementById("btnJoinroom");
    const nameInput = document.getElementById("joinName");
    const roomIdInput = document.getElementById("joinId");
    const joinRoomDiv = document.getElementById("Join-room");
    const closeJoinRoomBtn = document.getElementById("close-joinroom");

    joinButton.addEventListener("click", (e) => {
        e.preventDefault();

        const nameValue = nameInput.value.trim();
        const roomIdValue = roomIdInput.value.trim();

        if (nameValue === "" || roomIdValue === "") {
            showError("<b>Thất bại!</b><br>Tên và Mã phòng không được để trống");
        }
    });

    closeJoinRoomBtn.addEventListener("click", () => {
        console.log("Close button clicked.");
        joinRoomDiv.classList.add("hidden");
        document.getElementById("play").style.display = "block";
    });
});

// KICK PLAYER LÀ 2 CÁI DƯỚI CÙNG NÀY

// Hiển thị notification (giữ nguyên)
function showNotification(message) {
    const noti = document.createElement('div');
    noti.className = 'notification';
    noti.textContent = message;
    document.body.appendChild(noti);
    setTimeout(() => noti.remove(), 3000);
}

function showError(message) {
    const existingError = document.querySelector(".error-popup");
    if (existingError) existingError.remove();

    const errorDiv = document.createElement("div");
    errorDiv.classList.add("error-popup");
    errorDiv.innerHTML = `
        <div class="error-box">
            <img src="../Source/warn.png" class="error-icon"></div>
            <div class="error-text">${message}</div>
        </div>
    `;
    document.body.appendChild(errorDiv);

    setTimeout(() => errorDiv.style.opacity = "1", 100);
    setTimeout(() => {
        errorDiv.style.opacity = "0";
        setTimeout(() => errorDiv.remove(), 500);
    }, 3000);
}