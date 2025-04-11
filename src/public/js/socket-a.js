// const hostControls = document.getElementById('host-controls');
const bulletCountElement = document.getElementById('bullet-count');
const scoreElement = document.getElementById('score');

let socket = io();
let connected = false;
let roomId = null;
let playerName = '';
let isHost = false;
let gameInProgress = false;
let bulletCount = 5;
let score = 0;

class SocketEventRegistry {
    constructor(socket) {
        this.socket = socket;
        this.registeredEvents = new Map();
    }

    on(eventName, callback) {
        if (this.registeredEvents.has(eventName)) {
            this.socket.off(eventName, this.registeredEvents.get(eventName));
        }

        this.registeredEvents.set(eventName, callback);

        this.socket.on(eventName, callback);
    }

    off(eventName) {
        if (this.registeredEvents.has(eventName)) {
            this.socket.off(eventName, this.registeredEvents.get(eventName));
            this.registeredEvents.delete(eventName);
        }
    }
}

const socketRegistry = new SocketEventRegistry(socket);

socket.on('connect', async () => {
    connected = true;
});

socket.on('disconnect', () => {
    connected = false;
});

function createNewGame() {
    const nameInput = document.getElementById('newName-create');
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
        return;
    }

    playerName = name;
    getRoom(id, true);
    socketRegistry.on('sendRoom', (data) => {
        if (data.gameInProgress) {
            showError('Trò chơi đã bắt đầu, không thể tham gia!');
            return;
        } else {
            socket.emit('joinGame', { name: playerName, id });
        }
    });
}

function autoJoin() {
    const nameInput = document.getElementById('joinName');
    const name = nameInput.value.trim();

    if (!name) return;
    socket.emit('autoJoin', { name: name });
}

function getRoom(id, isRoom) {
    socket.emit('getRoom', { id: id, isRoom });
}

function spectateGame() {
    const idInput = document.getElementById('joinId-Spectator');
    const id = idInput.value.trim();

    if (!id) {
        return;
    }

    socket.emit('spectateGame', id);
    socketRegistry.on('spectateWaitingRoom', data => {
        roomId = data.roomId;
        gameInProgress = false;

        document.getElementById('play').style.display = 'none';
        document.getElementById('Join-room').classList.remove('hidden');

        document.getElementById('you-r-player').innerText = `Bạn là người xem`;
        Array.from(document.getElementsByClassName('roomId')).forEach(element => {
            element.innerText = roomId;
        });
        for (let i = 0; i < data.players.length; i++) {
            const player = data.players[i];
            const playerBox = document.getElementById(`player-${i + 1}${i + 1}`);
            const playerAvatar = document.getElementById(`player-avatar${i + 1}${i + 1}`);

            if (playerBox) {
                playerBox.innerText = player.name;
                playerAvatar.src = `../Source/${player.color}_tank.png`;
            }
        }
    });
}

function startGame() {
    socket.emit('startGame');
    socketRegistry.on('gameAlreadyStarted', (data) => {
        showError(data);
    });
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

    socketRegistry.off('sendRoom');
    socketRegistry.off('spectateWaitingRoom');
    socketRegistry.off('gameAlreadyStarted');
}

function sendPlayerLocation(x, y, rotation) {
    if (!roomId || !gameInProgress) return;

    socket.emit('sendLocations', { x, y, rotation });
}

function fireBullet(x, y, angle, powerup = null) {
    if (!roomId || !gameInProgress) return;

    // Check if powerup is bomb type and handle differently
    if (powerup && powerup.type === 'bomb') {
        placeBomb(x, y);
        return;
    }

    socket.emit('sendBullet', { x, y, angle, powerup });
}

function placeBomb(x, y) {
    if (!roomId || !gameInProgress) return;

    const bombId = `bomb_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Emit event to server to place a bomb
    socket.emit('placeBomb', {
        x: x,
        y: y,
        bombId: bombId,
        ownerId: socket.id
    });

    // Reset powerup after use
    currentPowerup = null;
}

function bombExploded(bombData) {
    if (!roomId || !gameInProgress) return;

    socket.emit('bombExploded', bombData);
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

function kickPlayer(id) {
    const playerGetter = document.getElementById(`player-${id}`).innerText;
    const roomId = document.querySelector('.roomId#owner').innerText;

    if (playerGetter && roomId) {
        socket.emit('kickPlayer', { name: playerGetter, room: roomId });
    } else {
        showError("Không có player")
    }
}

function setupSocketCListeners() {
    socketRegistry.on('invalidRoomId', (roomId) => {
        alert(`ID phòng ${roomId} không tồn tại!`);
    });

    socketRegistry.on('');
    socketRegistry.on('playerKick', (data) => {
        console.log('EOOEOEOOEOEO:', data);
        if (data.message.includes("host")) {
            showError(data.message);
        } else if (data.message.includes("Bạn đã bị kick khỏi phòng")) {
            console.log("Hả??")
            roomId = null;
            playerName = '';
            isHost = false;
            gameInProgress = false;
            bulletCount = 5;
            score = 0;

            document.getElementById('Create-room').classList.add('hidden');
            document.getElementById('Join-room').classList.add('hidden');
            document.getElementById('phaser-game-container').style.display = 'none';
            document.getElementById('play').style.display = 'block';
        }
    });

    socketRegistry.on('waitingRoom', (data) => {
        roomId = data.roomId;
        isHost = false;
        gameInProgress = false;

        document.getElementById('play').style.display = 'none';
        for (const element of document.getElementsByClassName('roomId')) {
            element.textContent = data.roomId;
        }
        if (data.isHost) {
            document.getElementById('Create-room').classList.remove('hidden');
        } else {
            document.getElementById('Join-room').classList.remove('hidden');
        }

        if (data.players.length > 0) {
            if (data.isHost) {
                for (let i = 0; i < 4; i++) {
                    const playerBox = document.getElementById(`player-${i + 1}`);
                    const playerAvatar = document.getElementById(`player-avatar${i + 1}`);
                    const playBtn = document.getElementById('start-btn');
                    if (playBtn) {
                        playBtn.remove();
                        document.querySelector('.start-text#owner').innerText = `Vui lòng chờ người chơi tham gia ...`;
                    }
                    if (playerBox && playerAvatar) {
                        playerBox.innerText = '';
                        playerAvatar.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
                    }
                }
                for (let i = 0; i < data.players.length; i++) {
                    const player = data.players[i];
                    const playerContainer = document.getElementsByClassName(`player-formal${i + 1}`);
                    const playerBox = document.getElementById(`player-${i + 1}`);
                    const playerBoxImage = document.getElementById(`player-box${i + 1}`);
                    const playerAvatar = document.getElementById(`player-avatar${i + 1}`);


                    if (playerContainer) {
                        if (playerBox) {
                            playerBox.innerText = player.name;
                        }
                        if (playerBox && playerBoxImage) {
                            playerAvatar.src = `../Source/${data.players[i].color}_tank.png`;
                        }
                    }
                }
            } else {
                for (let i = 0; i < data.players.length; i++) {
                    const player = data.players[i];
                    const playerContainer = document.getElementsByClassName(`player-formal${i + 1}${i + 1}`);
                    const playerBox = document.getElementById(`player-${i + 1}${i + 1}`);
                    const playerAvatar = document.getElementById(`player-avatar${i + 1}${i + 1}`);

                    if (playerContainer) {
                        if (playerBox) {
                            playerBox.innerText = player.name;
                            playerAvatar.src = `../Source/${data.players[i].color}_tank.png`;
                        }
                    }
                }
            }
        }
    });

    socketRegistry.on('playerJoined', (data) => {
        const player = data.player;
        isHost = data.player.isHost;

        if (data.playerCount > 1) {
            // thực hiện query đến class start-text -> id owner
            const startText = document.querySelector(`.start-text#owner`);
            if (startText) {
                startText.innerText = "";
                startText.innerHTML = `<button class="button" id="start-btn">Bắt đầu ngay ${data.playerCount}/4</button>`;
                document.getElementById('start-btn').addEventListener('click', () => {
                    startGame();
                });
            }
            // Player load
            for (let i = 0; i <= 3; i++) {
                const playerContainer = document.getElementsByClassName(`player-formal${i + 1}${i + 1}`);
                const playerBox = document.getElementById(`player-${i + 1}${i + 1}`);
                const playerAvatar = document.getElementById(`player-avatar${i + 1}${i + 1}`);

                if (playerContainer) {
                    if (playerBox) {
                        if (playerAvatar.src !== "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==") {
                            continue;
                        } else {
                            if (!data.player.isHost) {
                                playerAvatar.src = `../Source/${data.player.color}_tank.png`;
                                playerBox.innerText = player.name;
                            }
                        }
                    }
                    if (i + 1 == data.playerCount) {
                        break;
                    }
                }
            }
        }

        // Admin load
        for (let i = 0; i <= 3; i++) {
            const playerBox = document.getElementById(`player-${i + 1}`);
            const playerBoxImage = document.getElementById(`player-box${i + 1}`);
            const playerAvatar = document.getElementById(`player-avatar${i + 1}`);

            if (playerBox) {
                if (playerBoxImage) {
                    if (playerAvatar.src !== "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==") {
                        continue;
                    } else {
                        if (!data.player.isHost) {
                            playerAvatar.src = `../Source/${data.player.color}_tank.png`;
                            playerBox.innerText = player.name;
                        }
                    }
                }
            }
            if (i + 1 == data.playerCount) {
                break;
            }
        }
    });

    socketRegistry.on('spectateGameInProgress', (data) => {
        roomId = data.roomId;
        gameInProgress = true;

        // Ẩn menu chọn phòng
        document.getElementById('play').style.display = 'none';

        // Hiển thị Phaser game
        document.getElementById('phaser-game-container').style.display = 'block';

        document.getElementById('roomId').textContent = roomId;
    });

    socketRegistry.on('sendRoom', (data) => {
        roomId = data.roomId;
        gameInProgress = data.gameInProgress;

        for (const element of document.getElementsByClassName('roomId')) {
            element.textContent = roomId;
        }
    });

    socketRegistry.on('notAuthorized', (message) => {
        alert(message);
    });

    socketRegistry.on('notEnoughPlayers', (message) => {
        alert(message);
    });

    socketRegistry.on('newHost', (data) => {
        if (data.id === socket.id) {
            document.getElementById('Join-room').classList.add('hidden');
            document.getElementById('Create-room').classList.remove('hidden');
            isHost = true;
            //Admin load
            for (let i = 0; i < data.players.length; i++) {
                const player = data.players[i];
                const playerBox = document.getElementById(`player-${i + 1}`);
                const playerAvatar = document.getElementById(`player-avatar${i + 1}`);
                if (playerBox) {
                    playerBox.innerText = player.name;
                    playerAvatar.src = `../Source/${player.color}_tank.png`;
                }
            }

            //Player load
            for (let i = 0; i < data.players.length; i++) {
                console.log("[Admin load] Player:", data.players[i]);
                const playerContainer = document.getElementsByClassName(`player-formal${i + 1}${i + 1}`);
                const playerBox = document.getElementById(`player-${i + 1}${i + 1}`);
                const playerAvatar = document.getElementById(`player-avatar${i + 1}${i + 1}`);

                if (playerContainer) {
                    if (playerBox) {
                        playerAvatar.src = `../Source/${data.players[i].color}_tank.png`;
                        playerBox.innerText = data.players[i].name;
                    }
                }
            }
        }
    });

    socketRegistry.on('playerLeft', (data) => {
        // Player load
        for (let i = 0; i <= 3; i++) {
            console.log('[Player load] Player');
            const playerContainer = document.getElementsByClassName(`player-formal${i + 1}${i + 1}`);
            const playerBox = document.getElementById(`player-${i + 1}${i + 1}`);
            const playerAvatar = document.getElementById(`player-avatar${i + 1}${i + 1}`);

            if (playerContainer) {
                if (playerBox.innerText == data.name) {
                    playerAvatar.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
                    playerBox.innerText = '';
                }
            }
        }

        // Admin load
        for (let i = 0; i <= 3; i++) {
            const playerBox = document.getElementById(`player-${i + 1}`);
            const playerAvatar = document.getElementById(`player-avatar${i + 1}`);
            const startBtn = document.getElementById('start-btn');

            if (playerBox) {
                if (playerBox.innerText == data.name) {
                    playerAvatar.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
                    playerBox.innerText = '';
                }
            }
            if (data.playerCount > 1) {
                startBtn.innerText = `Bắt đầu ngay ${data.playerCount}/4`;
            } else {
                startBtn.remove();
                const startText = document.querySelector(`.start-text#owner`);
                startText.innerText = `Vui lòng chờ người chơi tham gia ...`;
            }
        }
    });

    socketRegistry.on('renderMovement', (player) => {
        if (window.updatePlayerPosition) {
            window.updatePlayerPosition(player);
        }
    });

    socketRegistry.on('renderBullet', (bullet) => {
        if (window.renderBullet) {
            window.renderBullet(bullet);
        }
    });

    socketRegistry.on('bulletCountUpdated', (data) => {
        bulletCount = data.count;
        bulletCountElement.textContent = bulletCount;
    });

    socketRegistry.on('scoreUpdated', (data) => {
        if (data.id === socket.id) {
            score = data.score;
            scoreElement.textContent = score;
        }

        if (window.updateScore) {
            window.updateScore(data.id, data.score);
        }
    });

    socketRegistry.on('gameOver', (data) => {
        gameInProgress = false;

        alert(`Trò chơi kết thúc! ${data.winner.name} đã chiến thắng với điểm số ${data.winner.score}`);

        if (window.endGame) {
            window.endGame(data);
        }
    });

    socketRegistry.on('spectateMode', (data) => {
        if (window.enterSpectateMode) {
            window.enterSpectateMode(data.players);
        }
    });

    socketRegistry.on('removePlayer', (playerId) => {
        if (window.removePlayer) {
            window.removePlayer(playerId);
        }
    });

    socketRegistry.on('hasPowerup', (data) => {
        if (window.updatePowerup) {
            window.updatePowerup(data.id, data.powerup);
        }
    });

    socketRegistry.on('newPowerup', (powerup) => {
        console.log('Nhận được powerup mới từ server:', powerup);

        if (window.handleNewPowerup) {
            window.handleNewPowerup(powerup);
        }
    });

    // Thêm xử lý sự kiện khi game bắt đầu
    socketRegistry.on('gameStart', (data) => {
        gameInProgress = true;
        console.log('Game started! Displaying Phaser game.');

        // Ẩn phòng chờ
        document.getElementById('Create-room').classList.add('hidden');
        document.getElementById('Join-room').classList.add('hidden');

        // Hiển thị container Phaser game
        document.getElementById('phaser-game-container').style.display = 'block';
    });
}


document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('newGame').addEventListener('click', () => {
        createNewGame();
    });
    document.getElementById('btnJoinroom').addEventListener('click', () => {
        joinExistingGame();
    });
    document.getElementById('spectateGame').addEventListener('click', () => {
        spectateGame();
    });
    document.getElementById('close-createroom').addEventListener('click', () => {
        backToMenu();
    });
    document.getElementById('close-joinroom').addEventListener('click', () => {
        backToMenu();
    });
    document.getElementById('joinGame').addEventListener('click', () => {
        autoJoin();
    });
    document.getElementById('player-box1').addEventListener('click', () => {
        kickPlayer(1)
    });
    document.getElementById('player-box2').addEventListener('click', () => {
        kickPlayer(2);
    });
    document.getElementById('player-box3').addEventListener('click', () => {
        kickPlayer(3);
    });
    document.getElementById('player-box4').addEventListener('click', () => {
        kickPlayer(4);
    });

    setupSocketCListeners();
});

socketRegistry.on('newBoard', (board) => {
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
    collectPowerup,
    placeBomb,
    bombExploded
};