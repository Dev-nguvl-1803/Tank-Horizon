// Get the audio element and the button
const backgroundMusic = document.getElementById('background-music');
const volumeSlider = document.getElementById('sound-volume');

backgroundMusic.volume = volumeSlider.value / 100; //trong khoang 0.0 va 1.0 nen can chia 100

volumeSlider.addEventListener("input", function () {
    backgroundMusic.volume = this.value / 100;
})

// Tạo và quản lý Device ID
function generateDeviceId() {
    // Tạo device ID ngẫu nhiên với 12 ký tự
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let deviceId = '';
    for (let i = 0; i < 12; i++) {
        deviceId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    // Thêm ngày giờ để đảm bảo tính duy nhất
    return deviceId + '-' + Date.now().toString(36);
}

function getDeviceId() {
    // Lấy ID từ localStorage hoặc tạo mới nếu chưa có
    let deviceId = localStorage.getItem('tank-horizon-device-id');

    if (!deviceId) {
        deviceId = generateDeviceId();
        localStorage.setItem('tank-horizon-device-id', deviceId);
    }

    return deviceId;
}

function displayDeviceId() {
    // Hiển thị device ID nếu người dùng đang ở menu chính
    const menuElement = document.getElementById('menu');
    const deviceIdDisplay = document.getElementById('device-id-display');
    const deviceIdSpan = document.getElementById('device-id');

    if (menuElement && deviceIdDisplay) {
        // Chỉ hiển thị khi menu chính được hiển thị
        const isMenuVisible = window.getComputedStyle(menuElement).display !== 'none';

        if (isMenuVisible) {
            deviceIdSpan.textContent = getDeviceId();
            deviceIdDisplay.style.display = 'block';
        } else {
            deviceIdDisplay.style.display = 'none';
        }
    }
}

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

    // Hiển thị Device ID ban đầu
    displayDeviceId();

    // Đảm bảo ID device được cập nhật khi chuyển đổi giữa các màn hình
    const playBtn = document.getElementById('play-btn');
    const closePlay = document.getElementById('close-play');

    playBtn.addEventListener('click', () => {
        // Ẩn khi vào màn hình chọn phòng
        document.getElementById('device-id-display').style.display = 'none';
    });

    closePlay.addEventListener('click', () => {
        // Hiện lại khi quay về màn hình chính
        document.getElementById('device-id-display').style.display = 'block';
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

    // Giảm kích thước xe tăng xuống còn khoảng 30px
    const tankSize = 30;
    item.style.width = `${tankSize}px`;
    item.style.height = 'auto';

    // Đảm bảo xe tăng luôn ở dưới các thành phần khác
    item.style.zIndex = "-10";

    // Tăng khoảng cách từ rìa màn hình để tránh mắc kẹt
    const safeMargin = 100;
    var startPosition = Math.floor(Math.random() * 4);
    var endPosition = (startPosition + 2) % 4; // Đảm bảo đi qua màn hình, không đi thẳng ra
    var startX, startY, endX, endY;

    // Vị trí bắt đầu ở ngoài màn hình nhiều hơn
    switch (startPosition) {
        case 0: startX = safeMargin + Math.random() * (window.innerWidth - 2 * safeMargin); startY = -safeMargin; break;
        case 1: startX = window.innerWidth + safeMargin; startY = safeMargin + Math.random() * (window.innerHeight - 2 * safeMargin); break;
        case 2: startX = safeMargin + Math.random() * (window.innerWidth - 2 * safeMargin); startY = window.innerHeight + safeMargin; break;
        case 3: startX = -safeMargin; startY = safeMargin + Math.random() * (window.innerHeight - 2 * safeMargin); break;
    }

    // Vị trí kết thúc cũng ở ngoài màn hình nhiều hơn
    switch (endPosition) {
        case 0: endX = safeMargin + Math.random() * (window.innerWidth - 2 * safeMargin); endY = -safeMargin; break;
        case 1: endX = window.innerWidth + safeMargin; endY = safeMargin + Math.random() * (window.innerHeight - 2 * safeMargin); break;
        case 2: endX = safeMargin + Math.random() * (window.innerWidth - 2 * safeMargin); endY = window.innerHeight + safeMargin; break;
        case 3: endX = -safeMargin; endY = safeMargin + Math.random() * (window.innerHeight - 2 * safeMargin); break;
    }

    item.style.left = startX + 'px';
    item.style.top = startY + 'px';

    // Kéo dài thời gian di chuyển để tạo cảm giác chậm hơn
    var duration = 25 + Math.random() * 15; // 25-40s
    var uniqueId = new Date().getTime() + Math.random().toString(16).slice(2);
    var initialRotation = Math.random() * 360;

    // Giảm tốc độ xoay để trông tự nhiên hơn
    var rotationAmount = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360);

    // Thêm animation đường bay có thể là đường cong nhẹ thay vì đường thẳng
    const bezierX1 = 0.3 + Math.random() * 0.4; // 0.3-0.7
    const bezierY1 = 0.3 + Math.random() * 0.4; // 0.3-0.7
    const bezierX2 = 0.3 + Math.random() * 0.4; // 0.3-0.7
    const bezierY2 = 0.3 + Math.random() * 0.4; // 0.3-0.7

    var styleSheet = document.createElement("style");
    styleSheet.innerHTML = `
        @keyframes moveAndRotate${uniqueId} {
            0% { 
                transform: translate(0, 0) rotate(${initialRotation}deg); 
                opacity: 0;
            }
            10% {
                opacity: 0.7;
            }
            90% {
                opacity: 0.7;
            }
            100% { 
                transform: translate(${endX - startX}px, ${endY - startY}px) rotate(${initialRotation + rotationAmount}deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(styleSheet);

    // Thêm cubic-bezier để tạo đường bay cong, tự nhiên hơn
    item.style.animation = `moveAndRotate${uniqueId} ${duration}s cubic-bezier(${bezierX1}, ${bezierY1}, ${bezierX2}, ${bezierY2}) forwards`;
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

function showNotification(message) {
    const noti = document.createElement('div');
    noti.className = 'notification';
    noti.textContent = message;
    document.body.appendChild(noti);
    setTimeout(() => noti.remove(), 3000);
}

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
        playMenu.style.display = "none"; // Hide menu
        play.style.display = "block"; // Show game-container only
    });

    closePlay.addEventListener("click", function () {
        play.style.display = "none";
        playMenu.style.display = "flex";
    });
})

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
            return;
        }
    });

    closeCreateRoomBtn.addEventListener("click", () => {
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

document.addEventListener("DOMContentLoaded", () => {
    const closeIngame = document.getElementById('close-ingame');
    if(closeIngame) {
        const joinRoomDiv = document.getElementById("Join-room");
        const phaserDisplay = document.getElementById('phaser-game-container');

        closeIngame.addEventListener("click", () => {
            joinRoomDiv.classList.add("hidden");
            phaserDisplay.style.display = "none";
            document.getElementById("play").style.display = "block";
            if (window.game && window.game.scene && window.game.scene.scenes[0] && window.game.scene.scenes[0].sound) {
                window.game.scene.scenes[0].sound.stopAll();
            }
        })
    }
})

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
function showSuccess(message) {
    const existingError = document.querySelector(".success-popup");
    if (existingError) existingError.remove();

    const successDiv = document.createElement("div");
    successDiv.classList.add("success-popup");
    successDiv.innerHTML = `
        <div class="error-box">
            <img src="../Source/check.png" class="error-icon"></div>
            <div class="error-text">${message}</div>
        </div>
    `;
    document.body.appendChild(successDiv);

    setTimeout(() => successDiv.style.opacity = "1", 100);
    setTimeout(() => {
        successDiv.style.opacity = "0";
        setTimeout(() => successDiv.remove(), 500);
    }, 3000);
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

// The history
document.addEventListener('DOMContentLoaded', () => {
    const historyBtn = document.getElementById('btnHistory');
    const historyWindow = document.getElementById('History-window');
    const historyClose = document.getElementById('close-History');
    const playMenu = document.getElementById("menu");
    const searchInput = document.querySelector('.search-bar input');

    historyBtn.addEventListener('click', () => {
        historyWindow.classList.remove('hidden');
    });

    historyClose.addEventListener('click', () => {
        historyWindow.classList.add('hidden');
    });

    historyBtn.addEventListener("click", function () {
        playMenu.style.display = "none";
        historyWindow.style.display = "block";
    });

    historyClose.addEventListener("click", function () {
        historyWindow.style.display = "none";
        playMenu.style.display = "flex";
    });

    // Xử lý sự kiện nhấn Enter trong ô tìm kiếm
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const searchValue = this.value.trim();
            if (searchValue) {
                searchByUsername(searchValue);
            }
        }
    });

    function searchByUsername(username) {

        fetch(`/api/matchresult/user/${encodeURIComponent(username)}`)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Không tìm thấy kết quả nào cho người chơi này');
                    }
                    throw new Error('Lỗi khi tìm kiếm');
                }
                return response.json();
            })
            .then(results => {
                displaySearchResults(results);
            })
            .catch(error => {
                showError(`<b>Thất bại!</b><br>${error.message}`);
                // Xóa nội dung hiện tại nếu tìm kiếm không có kết quả
                document.querySelector('.history-content').innerHTML = `
                    <div class="no-results">Không tìm thấy kết quả nào</div>
                `;
            });
    }

    function displaySearchResults(results) {
        const historyContent = document.querySelector('.history-content');
        const historyWindow = document.getElementById('History-window');
        const gameHistory = results;
        function renderHistory() {
            historyContent.innerHTML = "";
            for (let i = 0; i < gameHistory.length; i++) {
                const item = gameHistory[i];
                console.log("Ờ thế có gì không?", item);
                const row = document.createElement('div');
                row.classList.add('history-row');
                // Function to convert date to relative time
                // function getRelativeTime(dateString) {
                //     console.log("Date String:", dateString, typeof(dateString));
                //     const now = new Date();
                //     const past = new Date(dateString)
                //     const diff = Math.floor((now - past) / 1000); // difference in seconds

                //     if (diff < 60) return `${diff} giây trước`;
                //     if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
                //     if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
                //     if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
                //     if (diff < 31536000) return `${Math.floor(diff / 2592000)} tháng trước`;
                //     return `${Math.floor(diff / 31536000)} năm trước`;
                // }

                row.innerHTML = `
                    <div>${item.DeviceName}</div>
                    <div>${item.Username}</div>
                    <div>${item.KD} (${item.Score})</div>
                    <div>${item.NumRound}</div>
                    <div>${item.Statu}</div>
                    <div>${new Date(item.CreateTime).toString().substring(0, 16)}</div>
                `;
                historyContent.appendChild(row);
            }
        }
        renderHistory();
        historyWindow.classList.remove('hidden');
    }
});

window.onload = function () {
    // Sau 4s: logo đã xong fade in/out, bắt đầu fade out intro container
    setTimeout(() => {
      const intro = document.getElementById("intro");
      const main = document.getElementById("main-content");
  
      // Thêm lớp để intro fade out mượt
      intro.classList.add("fade-out-intro");
  
      // Sau khi fade out xong (1s), ẩn intro và hiện main
      setTimeout(() => {
        intro.style.display = "none";
        // main.style.display = "block";
        main.classList.add("fade-in-intro");
      }, 1000);
    }, 4000); // 4s là thời gian logo animation
  };