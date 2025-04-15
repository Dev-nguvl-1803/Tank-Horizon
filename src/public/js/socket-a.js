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

async function createNewGame() {
    const nameInput = document.getElementById('newName-create');
    const name = nameInput.value.trim();

    if (!name) {
        return;
    }

    socket.emit('wipRoom', { name: name });
    socketRegistry.on('playerAlreadyInRoom', async (data) => {
        if (data.message.includes(name)) {
            showError(`<b>Không thể tham gia!</b><br>${data.message}`);
        } else {
            playerName = name;
            await fetch(`http://100.114.16.81:8008/api/player/${encodeURIComponent(playerName)}`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                },
            }).then(async response => {
                if (!response.ok) {
                    if (response.status == 404) {
                        console.log(response)
                        await fetch('http://100.114.16.81:8008/api/player', {
                            method: "POST",
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ username: playerName })
                        })
                    }
                }
            }).then(() => {
                socket.emit('newGame', { name: playerName });
                socket.emit('deviceConnect', { name: playerName })
            }).catch(error => console.error('Error:', error));
        }
    });

}

function joinExistingGame() {
    const nameInput = document.getElementById('joinName');
    const idInput = document.getElementById('joinId');
    const name = nameInput.value.trim();
    const id = idInput.value.trim();

    if (!name || !id) {
        return;
    }

    socket.emit('wipRoom', { name: name });
    socketRegistry.on('playerAlreadyInRoom', async (data) => {
        playerName = name;
        if (data.message.includes(name)) {
            showError(`<b>Không thể tham gia!</b><br>${data.message}`);
        } else {
            console.log("i'm here");
            await fetch(`http://100.114.16.81:8008/api/player/${encodeURIComponent(playerName)}`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                },
            }).then(async response => {
                console.log("i'm here 22");
                if (!response.ok) {
                    if (response.status == 404) {
                        await fetch('http://100.114.16.81:8008/api/player', {
                            method: "POST",
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ username: playerName })
                        });
                    }
                }
            }).then(() => {
                getRoom(id, true);
                socketRegistry.on('sendRoom', (data) => {
                    if (data.gameInProgress) {
                        showError('Trò chơi đã bắt đầu, không thể tham gia!');
                        return;
                    } else {
                        console.log("i'm here 2");
                        socket.emit('joinGame', { name: playerName, id: id });
                    }
                });
            })
        }
    });
}

function autoJoin() {
    const nameInput = document.getElementById('joinName');
    const name = nameInput.value.trim();

    if (!name) return;

    socket.emit('wipRoom', { name: name });
    socketRegistry.on('playerAlreadyInRoom', async (data) => {
        if (data.message.includes(name)) {
            showError(`<b>Không thể tham gia!</b><br>${data.message}`);
        } else {
            await fetch(`http://100.114.16.81:8008/api/player/${encodeURIComponent(name)}`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                },
            }).then(async response => {
                if (!response.ok) {
                    if (response.status == 404) {
                        await fetch('http://100.114.16.81:8008/api/player', {
                            method: "POST",
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ username: name })
                        });
                    }
                }
            }).then(() => {
                socket.emit('autoJoin', { name: name });
            })
        }
    })
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

var kickWIP = false;
function kickPlayer(id) {
    const playerGetter = document.getElementById(`player-${id}`).innerText;
    const roomId = document.querySelector('.roomId#owner').innerText;
    if (playerGetter && roomId) {
        socket.emit('kickPlayer', { name: playerGetter, room: roomId });
        kickWIP = true;
    } else {
        showError("Không có người chơi")
    }
}

function setupSocketCListeners() {
    socketRegistry.on('invalidRoomId', (roomId) => {
        showError(`ID phòng ${roomId} không tồn tại!`);
    });

    socketRegistry.on('newHost', (data) => {
        if (data.id === socket.id) {
            // Là host mới, chuyển UI sang Create-room
            document.getElementById('Create-room').classList.remove('hidden');
            document.getElementById('Join-room').classList.add('hidden');
            // Cập nhật lại các nút chức năng host nếu cần
            const ownerText = document.querySelector('.owner');
            if (ownerText) ownerText.innerText = 'Bạn là chủ phòng';
            // Hiển thị lại danh sách player trong phòng chờ host
            for (let i = 0; i < 4; i++) {
                const playerBox = document.getElementById(`player-${i + 1}`);
                const playerAvatar = document.getElementById(`player-avatar${i + 1}`);
                if (playerBox) playerBox.innerText = '';
                if (playerAvatar) playerAvatar.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
            }
            if (data.players && data.players.length > 0) {
                for (let i = 0; i < data.players.length; i++) {
                    const player = data.players[i];
                    const playerBox = document.getElementById(`player-${i + 1}`);
                    const playerAvatar = document.getElementById(`player-avatar${i + 1}`);
                    if (playerBox) playerBox.innerText = player.name;
                    if (playerAvatar) playerAvatar.src = `../Source/${player.color}_tank.png`;
                }
            }
        }
    })
    socketRegistry.on('playerLeft', (data) => {
        // Xóa player khỏi UI phòng chờ
        if(kickWIP) {
            showSuccess("<b>Thành công!</b><br>Đã đuổi người dùng");
            kickWIP = false;
        }
        for (let i = 1; i <= 4; i++) {
            const playerBox = document.getElementById(`player-${i}`);
            const playerAvatar = document.getElementById(`player-avatar${i}`);
            if (playerBox && playerBox.innerText === data.name) {
                playerBox.innerText = '';
                playerAvatar.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
            }
            const playerBox2 = document.getElementById(`player-${i}${i}`);
            const playerAvatar2 = document.getElementById(`player-avatar${i}${i}`);
            const startButton = document.getElementById('start-btn');
            if (playerBox2 && playerBox2.innerText === data.name) {
                playerBox2.innerText = '';
                playerAvatar2.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
            }

            if(startButton) {
                if(data.playerCount > 1) {
                    startButton.innerText = `Bắt đầu ngay ${data.playerCount}/4`;
                } else {
                    document.querySelector('.start-text#owner').innerText = `Vui lòng chờ người chơi tham gia ...`;
                    startButton.style = "display: none;"
                }
            }
        }
    });

    socketRegistry.on('roomFull', (message) => {
        showError(message);
        // Đảm bảo không vào phòng, có thể reset UI nếu cần
        document.getElementById('Create-room').classList.add('hidden');
        document.getElementById('Join-room').classList.add('hidden');
        document.getElementById('phaser-game-container').style.display = 'none';
        document.getElementById('play').style.display = 'block';
    });

    socketRegistry.on('playerRoomCheck', (data) => {
        if (!data.inRoom) {
            console.log("Người chơi chưa trong phòng nào, có thể tham gia");
        }
    });

    socketRegistry.on('playerKick', (data) => {
        if (data.message.includes("host")) {
            showError(data.message);
        } else if (data.message.includes("Bạn đã bị kick khỏi phòng")) {
            for (let i = 1; i <= 4; i++) {
                const playerBox = document.getElementById(`player-${i}`);
                const playerAvatar = document.getElementById(`player-avatar${i}`);
                if (playerBox) playerBox.innerText = '';
                if (playerAvatar) playerAvatar.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
                const playerBox2 = document.getElementById(`player-${i}${i}`);
                const playerAvatar2 = document.getElementById(`player-avatar${i}${i}`);
                if (playerBox2) playerBox2.innerText = '';
                if (playerAvatar2) playerAvatar2.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
            }
            
            document.getElementById('Create-room').classList.add('hidden');
            document.getElementById('Join-room').classList.add('hidden');
            document.getElementById('phaser-game-container').style.display = 'none';
            document.getElementById('play').style.display = 'block';
            showError(data.message);
        }
    });

    socketRegistry.on('waitingRoom', async (data) => {
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

        document.getElementById("playerCount").innerText = data.playerCount;
        if (data.playerCount > 1) {
            const startText = document.querySelector(`.start-text#owner`);
            if (startText) {
                startText.innerText = "";
                startText.innerHTML = `<button class="button" id="start-btn">Bắt đầu ngay ${data.playerCount}/4</button>`;
                document.getElementById('start-btn').addEventListener('click', () => {
                    startGame();
                });
            }
            // Player load
            for (let i = 0; i < data.playerCount; i++) {
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
                }
            }
        }

        // Admin load
        for (let i = 0; i < data.playerCount; i++) {
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
        }
    });

    socketRegistry.on('spectateEnd', () => {
        document.getElementById('phaser-game-container').style.display = 'none';
        document.getElementById('Join-room').classList.add('hidden');
        document.getElementById('Create-room').classList.add('hidden');
        document.getElementById('play').style.display = 'block';
    });

    socketRegistry.on('spectateGameInProgress', (data) => {
        roomId = data.roomId;
        gameInProgress = true;
        document.getElementById('play').style.display = 'none';
        document.getElementById('Join-room').classList.add('hidden');
        document.getElementById('Create-room').classList.add('hidden');
        document.getElementById('phaser-game-container').style.display = 'block';
        document.getElementById('roomId').textContent = roomId;
    });

    socketRegistry.on('gameStart', (data) => {
        gameInProgress = true;
        // Ẩn phòng chờ
        document.getElementById('Create-room').classList.add('hidden');
        document.getElementById('Join-room').classList.add('hidden');
        // Hiển thị container Phaser game
        document.getElementById('phaser-game-container').style.display = 'block';
        // Nếu là khán giả, có thể disable điều khiển ở socket-c.js
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
        }

        if (window.updateScore) {
            window.updateScore(data.id, data.score);
        }
    });
    socketRegistry.on('gameOver', async (data) => {
        gameInProgress = false;

        if (window.endGame) {
            window.endGame(data);
        }

        const winnerScreen = document.getElementById('winner-screen');
        const winnerName = document.getElementById('winner-name');
        const winnerScore = document.getElementById('winner-score');
        const ggezPic = document.getElementById('lolez');
        const winSound = document.getElementById('win-sound');
        const owner = data.putSQL.players.find(player => player.id == socket.id);
        ggezPic.innerText = ``;
        winnerName.innerText = `🎉 ${data.winner.name} đã chiến thắng!`;
        winnerScore.innerText = `Điểm số: ${data.winner.score}`;

        winnerScreen.classList.remove('fade-out');
        winnerScreen.classList.add('fade-in');
        setTimeout(() => {
            winnerScreen.style.display = 'flex';
        }, 500);

        if (winSound) {
            winSound.currentTime = 0;
            winSound.volume = 0.3;
            winSound.play();
        }

        if (window.endGame) {
            window.endGame(data);
        }

        setTimeout(() => {
            winnerScreen.classList.remove('fade-in');
            winnerScreen.classList.add('fade-out');
            setTimeout(() => {
                winnerScreen.style.display = 'none';
            }, 500);
        }, 9000)
        setTimeout(() => {
            document.getElementById('phaser-game-container').style.display = 'none';
            if (owner) {
                if (owner.isHost) {
                    document.getElementById('Create-room').classList.remove('hidden');
                } else {
                    document.getElementById('Join-room').classList.remove('hidden');
                }
            }
        }, 10000)

        if (!owner) {
            roomId = data.putSQL.match;

            for (let i = 0; i < data.putSQL.players.length; i++) {
                const player = data.putSQL.players[i];
                const playerBox = document.getElementById(`player-${i + 1}${i + 1}`);
                const playerAvatar = document.getElementById(`player-avatar${i + 1}${i + 1}`);

                if (playerBox) {
                    playerBox.innerText = player.name;
                    playerAvatar.src = `../Source/${player.color}_tank.png`;
                }
            }

            document.getElementById('play').style.display = 'none';
            document.getElementById('phaser-game-container').style.display = 'none';
            document.getElementById('Join-room').classList.remove('hidden');

            document.getElementById('you-r-player').innerText = `Bạn là người xem`;
            Array.from(document.getElementsByClassName('roomId')).forEach(element => {
                element.innerText = data.putSQL.match;
            });
        }
        for (const player of data.putSQL.players) {
            if (player.isHost && player.id === socket.id) {
                console.log("Host đang xử lý lưu kết quả trận đấu");
                try {
                    const playerResponse = await fetch(`http://100.114.16.81:8008/api/player/${encodeURIComponent(player.name)}`);
                    const playerData = await playerResponse.json();

                    // Kiểm tra xem match đã tồn tại chưa
                    const checkMatch = await fetch(`http://100.114.16.81:8008/api/matches/${roomId}`);

                    if (checkMatch.status === 404) {
                        console.log("Trận đấu chưa tồn tại, tạo mới");
                        // Match chưa tồn tại, tạo mới
                        await fetch('http://100.114.16.81:8008/api/matches', {
                            method: "POST",
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                roomId: roomId,
                                playerId: playerData.PlayerID,
                                startTime: data.putSQL.startTime,
                                endTime: data.putSQL.endTime,
                            })
                        }).then(response => {
                            if (!response.ok) {
                                throw new Error(`Lỗi khi tạo match: ${response.status}`);
                            }
                            return response.json();
                        }).then(data => {
                            console.log("Đã tạo match thành công:", data);
                        });
                    } else {
                        console.log("Trận đấu đã tồn tại, cập nhật thông tin");
                        await fetch(`http://100.114.16.81:8008/api/matches/${roomId}`, {
                            method: "PUT",
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                endTime: data.putSQL.endTime,
                            })
                        }).then(response => {
                            if (!response.ok) {
                                throw new Error(`Lỗi khi cập nhật match: ${response.status}`);
                            }
                            console.log("Đã cập nhật match thành công");
                        });
                    }
                } catch (error) {
                    console.error("Lỗi khi xử lý lưu trận đấu:", error);
                }
            }
        }
        setTimeout(async () => {
            for (const player of data.putSQL.players) {
                if (player.id == socket.id) {
                    const device = localStorage.getItem('tank-horizon-device-id');
                    await fetch(`http://100.114.16.81:8008/api/player/${decodeURIComponent(player.name)}`)
                        .then(response => {
                            if (response.ok) {
                                return response.json();
                            }
                        }).then(async playerData => {
                            const kill = data.putSQL.players.find(player => player.id == socket.id).kill
                            const death = data.putSQL.players.find(player => player.id == socket.id).death
                            await fetch('http://100.114.16.81:8008/api/matchresult', {
                                method: "POST",
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    matchId: data.putSQL.match,
                                    playerId: playerData.PlayerID,
                                    deviceId: device,
                                    username: player.name,
                                    kd: `${kill}/${death}`,
                                    deviceName: navigator.platform,
                                    numRound: data.putSQL.round,
                                    status: socket.id == data.winner.id ? "Thắng" : "Thua",
                                    score: player.score,
                                })
                            });
                        });
                }
            }
        }, 1500)
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
}


document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('newGame').addEventListener('click', async () => {
        await createNewGame();
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

    document.getElementById('close-ingame').addEventListener('click', () => {
        backToMenu();
    })

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