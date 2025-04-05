const socketAStatus = document.getElementById('socket-a-status');
const socketBStatus = document.getElementById('socket-b-status');
const eventLog = document.getElementById('eventLog');
const hostControls = document.getElementById('host-controls');
const bulletCountElement = document.getElementById('bullet-count');
const scoreElement = document.getElementById('score');
const showAToB = document.getElementById('show-a-to-b');
const showBToC = document.getElementById('show-b-to-c');
const showAll = document.getElementById('show-all');

let logFilter = 'all';

let socket = io();
let connected = false;
let roomId = null;
let playerName = '';
let isHost = false;
let gameInProgress = false;
let bulletCount = 5;
let score = 0;

socket.on('connect', async() => {
    connected = true;
    socketAStatus.textContent = 'Đã kết nối';
    socketAStatus.style.color = 'green';
});

socket.on('disconnect', () => {
    connected = false;
    socketAStatus.textContent = 'Đã ngắt kết nối';
    socketAStatus.style.color = 'red';
    socketBStatus.textContent = 'Đã ngắt kết nối';
    socketBStatus.style.color = 'red';
});

socket.on('socketBConnected', () => {
    socketBStatus.textContent = 'Đã kết nối';
    socketBStatus.style.color = 'green';
});

function createNewGame() {
    const nameInput = document.getElementById('newName');
    const name = nameInput.value.trim();

    if (!name) {
        alert('Vui lòng nhập tên của bạn!');
        return;
    }

    playerName = name;
    socket.emit('newGame', { name: playerName });
}

function joinExistingGame() {
    const nameInput = document.getElementById('joinName');
    const idInput = document.getElementById('joinId');
    const name = nameInput.value.trim();
    const id = idInput.value.trim();

    if (!name || !id) {
        alert('Vui lòng nhập cả tên và ID phòng!');
        return;
    }

    playerName = name;
    getRoom(id, true);
    socket.on('sendRoom', (data) => {
        console.log('SendRoom:', data);
        if (data.gameInProgress) {
            alert('Trò chơi đã bắt đầu, không thể tham gia!');
            return;
        } else {
            socket.emit('joinGame', { name: playerName, id });
        }
    })
}

function getRoom(id, isRoom) {
    socket.emit('getRoom', { id: id, isRoom });
}

function spectateGame() {
    const idInput = document.getElementById('joinId');
    const id = idInput.value.trim();

    if (!id) {
        alert('Vui lòng nhập ID phòng để xem!');
        return;
    }

    socket.emit('spectateGame', id);
    socket.on('spectateWaitingRoom', data => {
        console.log('Đang xem trận đấu:', data);
    })
}

function startGame() {
    socket.emit('startGame');
    socket.on('gameAlreadyStarted', (data) => {
        alert(data);
    })
}

function backToMenu() {
    if (roomId) {
        socket.emit('leaveRoom');
    }

    roomId = null;
    playerName = '';
    isHost = false;
    gameInProgress = false;
    bulletCount = 5;
    score = 0;

    document.getElementById('game').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    hostControls.style.display = 'none';
}

function sendPlayerLocation(x, y, rotation) {
    if (!roomId || !gameInProgress) return;

    socket.emit('sendLocations', { x, y, rotation });
}

function fireBullet(x, y, angle, powerup = null) {
    if (!roomId || !gameInProgress) return;

    socket.emit('sendBullet', { x, y, angle, powerup });
}

function bulletDestroyed(bulletOwnerId) {
    if (!roomId || !gameInProgress) return;

    socket.emit('bulletDestroyed', bulletOwnerId);
}

function playerDied(victimId, killerId) {
    if (!roomId || !gameInProgress) return;
    console.log("[Socket-A]: Nhảy điểm");
    socket.emit('playerDied', { victimId, killerId });
}

function collectPowerup(powerup) {
    if (!roomId || !gameInProgress) return;

    socket.emit('getPowerup', powerup);
}

function setupSocketCListeners() {

    socket.on('invalidRoomId', (roomId) => {
        alert(`ID phòng ${roomId} không tồn tại!`);
    });

    socket.on('waitingRoom', (data) => {
        roomId = data.roomId;
        isHost = data.isHost;
        gameInProgress = false;

        document.getElementById('roomId').textContent = roomId;
        document.getElementById('playerCount').textContent = data.players.length;


        if (isHost) {
            hostControls.style.display = 'block';
        } else {
            hostControls.style.display = 'none';
        }

        document.getElementById('menu').style.display = 'none';
        document.getElementById('game').style.display = 'block';

    });

    socket.on('playerJoined', (data) => {
        document.getElementById('playerCount').textContent = data.playerCount;
    });

    socket.on('spectateGameInProgress', (data) => {
        roomId = data.roomId;
        gameInProgress = true;

        document.getElementById('roomId').textContent = roomId;
        document.getElementById('playerCount').textContent = data.players.length;
        document.getElementById('menu').style.display = 'none';
        document.getElementById('game').style.display = 'block';

    });

    socket.on('spectateWaitingRoom', (data) => {
        roomId = data.roomId;
        gameInProgress = false;

        document.getElementById('roomId').textContent = roomId;
        document.getElementById('playerCount').textContent = data.players.length;
        document.getElementById('menu').style.display = 'none';
        document.getElementById('game').style.display = 'block';

    });

    socket.on('sendRoom', (data) => {
        roomId = data.roomId;
        gameInProgress = data.gameInProgress;

        document.getElementById('roomId').textContent = roomId;
        document.getElementById('playerCount').textContent = data.playerCount;

    });

    socket.on('notAuthorized', (message) => {
        alert(message);
    });

    socket.on('notEnoughPlayers', (message) => {
        alert(message);
    });



    socket.on('newHost', (data) => {
        if (data.id === socket.id) {
            isHost = true;
            hostControls.style.display = 'block';
        } else {
        }
    });


    socket.on('playerLeft', (data) => {
        document.getElementById('playerCount').textContent = data.playerCount;
    });

    socket.on('renderMovement', (player) => {
        if (window.updatePlayerPosition) {
            window.updatePlayerPosition(player);
        }
    });

    socket.on('renderBullet', (bullet) => {
        if (window.renderBullet) {
            window.renderBullet(bullet);
        }
    });

    socket.on('bulletCountUpdated', (data) => {
        bulletCount = data.count;
        bulletCountElement.textContent = bulletCount;
    });

    socket.on('scoreUpdated', (data) => {
        if (data.id === socket.id) {
            score = data.score;
            scoreElement.textContent = score;
        }

        if (window.updateScore) {
            window.updateScore(data.id, data.score);
        }
    });

    socket.on('gameOver', (data) => {
        gameInProgress = false;

        alert(`Trò chơi kết thúc! ${data.winner.name} đã chiến thắng với điểm số ${data.winner.score}`);

        if (window.endGame) {
            window.endGame(data);
        }
    });

    socket.on('spectateMode', (data) => {


        if (window.enterSpectateMode) {
            window.enterSpectateMode(data.players);
        }
    });

    socket.on('removePlayer', (playerId) => {


        if (window.removePlayer) {
            window.removePlayer(playerId);
        }
    });

    socket.on('hasPowerup', (data) => {


        if (window.updatePowerup) {
            window.updatePowerup(data.id, data.powerup);
        }
    });
}

function logSocketEvent(direction, event, data) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${direction}: ${event} ${JSON.stringify(data, null, 2)}`;


    if (
        logFilter === 'all' ||
        (logFilter === 'a-to-b' && direction === 'Socket A → B') ||
        (logFilter === 'b-to-c' && direction === 'Socket B → C') ||
        direction === 'info'
    ) {

        eventLog.innerHTML = logMessage + '\n' + eventLog.innerHTML;
    }


    console.log(logMessage);
}

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('newGame').addEventListener('click', createNewGame);
    document.getElementById('joinGame').addEventListener('click', joinExistingGame);
    document.getElementById('getRoom').addEventListener('click', getRoom);
    document.getElementById('spectateGame').addEventListener('click', spectateGame);
    document.getElementById('start-game').addEventListener('click', startGame);
    document.getElementById('back-to-menu').addEventListener('click', backToMenu);


    showAToB.addEventListener('click', () => {
        logFilter = 'a-to-b';
        eventLog.innerHTML = '';
        showAToB.style.fontWeight = 'bold';
        showBToC.style.fontWeight = 'normal';
        showAll.style.fontWeight = 'normal';
    });

    showBToC.addEventListener('click', () => {
        logFilter = 'b-to-c';
        eventLog.innerHTML = '';
        showAToB.style.fontWeight = 'normal';
        showBToC.style.fontWeight = 'bold';
        showAll.style.fontWeight = 'normal';
    });

    showAll.addEventListener('click', () => {
        logFilter = 'all';
        eventLog.innerHTML = '';
        showAToB.style.fontWeight = 'normal';
        showBToC.style.fontWeight = 'normal';
        showAll.style.fontWeight = 'bold';
    });


    setupSocketCListeners();
});

socket.on('newBoard', (board) => {
    console.log('Received new board:', board);
    if (window.createBoard) {
        window.createBoard(window.gameScene, board);
    }
});

window.socketA = {
    sendPlayerLocation,
    fireBullet,
    bulletDestroyed,
    playerDied,
    collectPowerup
};