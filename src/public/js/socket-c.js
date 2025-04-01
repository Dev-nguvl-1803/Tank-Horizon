/**
 * Socket C: Kết nối với Socket B thông qua Socket A để xử lý và hiển thị game 
 */

let gameData = {
    board: null,
    players: [],
    bullets: [],
    powerups: []
};

let alive = true;
let currentPowerup = null;
let localPlayer = null;
let pendingGameData = null;
let gameScene;
let gameInitialized = false;
let canShoot = true; 
let coutn = 0;
let resetInProgress = 0;
var killOwnerBullet = {}
var mapper = null;

/**
 * PHASER GAME FR
 * =========================
 */

class Scene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        console.log('Phaser preload function called');

        this.load.image('tank', '/assets/tank/tank.png');
        this.load.image('bullet', '/assets/buff/bullet.png');
        this.load.image('wall_x', '/assets/wall/tile_x.png');
        this.load.image('wall_y', '/assets/wall/tile_y.png');

        this.load.image('powerup_booby', '/assets/buff/booby.png');
        this.load.image('powerup_frag', '/assets/buff/frag.png');
        this.load.image('powerup_gatling', '/assets/buff/gatling.png');
        this.load.image('powerup_homing', '/assets/buff/homing-missile.png');
        this.load.image('powerup_lazer', '/assets/buff/lazer.png');
        this.load.image('powerup_ray', '/assets/buff/ray.png');
        this.load.image('powerup_rc', '/assets/buff/rc-missile.png');


        this.initializeGame = function (data) {
            console.log('Initializing game with data:', data);
            console.log('Game board:', data.board);
            this.boardData = data.board;
            this.playersData = data.players;
            this.gameInProgress = true;

            if (this.waitingText && this.waitingText.destroy) {
                this.waitingText.destroy();
                this.waitingText = null;
            }

            this.createGameObjects();

            const mapSize = 680;
            this.cameras.main.centerOn(mapSize / 2, mapSize / 2);
        };

        this.resetGame = function (data) {
            console.log('Resetting game with data:', data);

            alive = true;
            canShoot = true;
            this.currentAmmo = 5;
            
            let mapReceived = false;

            this.clearGameObjects();

            if (this.texts && this.texts.length > 0) {
                this.texts.forEach(text => {
                    if (text && text.destroy) {
                        text.destroy();
                    }
                });
                this.texts = [];
            }

            console.log('Waiting for new map data...');
            
            const mapTimeout = setTimeout(() => {
                if (!mapReceived) {
                    console.log('Map data timeout, requesting new map data');
                    socket.emit('resetMap');
                }
            }, 3000);

            socket.off('prepareNewGame');
            
            socket.on('prepareNewGame', (newData) => {
                console.log('Received new map data:', newData);
                
                if (!mapReceived) {
                    clearTimeout(mapTimeout);
                    mapReceived = true;
                    
                    mapper = newData.map;
                    
                    this.boardData = newData.map;
                    this.playersData = newData.players;

                    if (this.playersData) {
                        this.playersData.forEach(player => {
                            player.alive = true;
                            if (player.id === socket.id) {
                                console.log('Reset game - Current player status set to alive');
                                localPlayer = player;
                            }
                        });
                    }

                    if (this.boardData) {
                        console.log('Creating new board with data:', this.boardData);
                        const boardCreated = createBoard(this, this.boardData);
                        if (!boardCreated) {
                            console.error('Failed to create board, requesting new map');
                            socket.emit('resetMap');
                            return;
                        }
                    }
                    this.createGameObjects();
                }
            });
        };


        this.clearGameObjects = function () {

            if (this.bulletSprites) {
                for (let key in this.bulletSprites) {
                    if (this.bulletSprites.hasOwnProperty(key)) {
                        this.bulletSprites[key].destroy();
                    }
                }
                this.bulletSprites = {};
            }

            if (this.playerSprites) {
                for (let key in this.playerSprites) {
                    if (this.playerSprites.hasOwnProperty(key)) {
                        this.playerSprites[key].destroy();
                    }
                }
                this.playerSprites = {};
            }

            if (this.walls) {
                this.walls.clear(true, true);
            }


            if (this.powerups) {
                this.powerups.clear(true, true);
            }

            if (this.texts) {
                this.texts.forEach(text => {
                    text.destroy();
                });
                this.texts = [];
            }

            canShoot = true;
        };


        this.updatePlayerPosition = function (player) {
            if (player.id === window.socketA.id) return;
            const playerSprite = this.playerSprites[player.id];
            if (playerSprite) {
                playerSprite.setPosition(player.x, player.y);
                playerSprite.rotation = player.rotation;
                if (this.playerTexts[player.id]) {
                    this.playerTexts[player.id].setPosition(player.x, player.y - 30);
                }
            }
        };


        this.createBullet = function (bullet) {
            if (bullet.ownerId === socket.id && !canShoot) {
                return;
            }

            killOwnerBullet[bullet.id] = false;

            const bulletSprite = this.physics.add.sprite(bullet.x, bullet.y, 'bullet');
            bulletSprite.setScale(0.3);
            bulletSprite.setDepth(1);

            bulletSprite.bulletId = bullet.id;
            bulletSprite.ownerId = bullet.ownerId;

            bulletSprite.body.setBounce(1, 1);
            bulletSprite.body.setCollideWorldBounds(true);

            bulletSprite.body.setSize(bulletSprite.width, bulletSprite.height);

            bulletSprite.bounces = 0;
            bulletSprite.maxBounces = 3;

        
            const velocity = this.physics.velocityFromRotation(bullet.angle, 250);
            bulletSprite.setVelocity(velocity.x, velocity.y);

        
            bulletSprite.body.useDamping = true;
            bulletSprite.body.setDamping(false);

            this.bulletSprites[bullet.id] = bulletSprite;

        
            this.time.delayedCall(5000, () => {
                if (bulletSprite && bulletSprite.active) {
                    bulletSprite.destroy();
                    delete this.bulletSprites[bullet.id];
                    delete killOwnerBullet[bullet.id];
                    if (this.currentAmmo < 5) {
                        this.currentAmmo++;
                    }
                }
            });


        
            this.physics.add.collider(bulletSprite, this.walls, (bullet, wall) => {
                killOwnerBullet[bullet.bulletId] = true;
                let angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, wall.x, wall.y);
                const pushDistance = 2;
                bullet.x -= Math.cos(angle) * pushDistance;
                bullet.y -= Math.sin(angle) * pushDistance;

                if (bullet.justCollided) return;
                bullet.justCollided = true;
                this.time.delayedCall(20, () => {
                    if (bullet && bullet.active) bullet.justCollided = false;
                });
            }, null, this);

        
            for (const id in this.playerSprites) {
                this.physics.add.overlap(bulletSprite, this.playerSprites[id], () => {
                    if (id !== bullet.ownerId) {
                        console.log("[Socket-C] Nhảy điểm à ??? Player");
                    
                        window.socketA.playerDied(id, bullet.ownerId);
                    } else if (id == bullet.ownerId && killOwnerBullet[bullet.id] === true) {
                        console.log("[Socket-C] Nhảy điểm à ??? Owner");
                    
                        window.socketA.playerDied(id, bullet.ownerId);
                    }
                });
            }
        };


        this.updateScore = function (playerId, score) {
            try {
                if (!this.playerTexts || !this.playersData) {
                    console.warn("Player texts or data not initialized yet");
                    return;
                }

                const playerText = this.playerTexts[playerId];
                if (!playerText || !playerText.setText) {
                    console.warn(`Cannot update score: Player text for ${playerId} not found or invalid`);
                    return;
                }

                const playerData = this.playersData.find(p => p.id === playerId);
                if (playerData) {
                    playerData.score = score;
                
                    try {
                        playerText.setText(`${playerData.name}: ${score}`);
                    } catch (error) {
                        console.warn(`Error updating score text: ${error.message}`);
                    }
                }
            } catch (error) {
                console.error(`Error in updateScore: ${error.message}`);
            }
        };


        this.endGame = function (data) {
            this.gameInProgress = false;


            const winnerText = this.add.text(400, 300,
                `Người chiến thắng: ${data.winner.name}\nĐiểm số: ${data.winner.score}`,
                { fontSize: '24px', fill: '#fff', align: 'center' }
            );
            winnerText.setOrigin(0.5);
            winnerText.setDepth(10);


            this.texts.push(winnerText);
        };


        this.enterSpectateMode = function () {
            if (!alive) {
                const spectateText = this.add.text(400, 50, 'Bạn đã chết. Đang ở chế độ theo dõi.', { fontSize: '18px', fill: '#ff0000' });
                spectateText.setOrigin(0.5);
                spectateText.setDepth(10);
                this.texts.push(spectateText);
            }
        };


        this.removePlayer = function (playerId) {
            try {
                if (this.playerSprites[playerId]) {
                    this.playerSprites[playerId].destroy();
                    delete this.playerSprites[playerId];
                }

            
                if (this.playerTexts && this.playerTexts[playerId]) {
                    this.playerTexts[playerId].destroy();
                
                    delete this.playerTexts[playerId];
                }

            
            
                const playerData = this.playersData ? this.playersData.find(p => p.id === playerId) : null;
                if (playerData) {
                    playerData.alive = false;
                }
            } catch (error) {
                console.error(`Error removing player ${playerId}:`, error.message);
            }
        };


        this.updatePlayerPowerup = function (playerId, powerup) {
            const playerSprite = this.playerSprites[playerId];
            if (playerSprite) {

                if (playerSprite.powerupIcon) {
                    playerSprite.powerupIcon.destroy();
                }


                playerSprite.powerupIcon = this.add.text(
                    playerSprite.x,
                    playerSprite.y - 50,
                    `[${powerup.name}]`,
                    { fontSize: '12px', fill: '#ffff00' }
                );
                playerSprite.powerupIcon.setOrigin(0.5);
                playerSprite.powerupIcon.setDepth(3);


                this.texts.push(playerSprite.powerupIcon);


                if (playerId === socket.id) {
                    currentPowerup = powerup;
                }
            }
        };
    }

    create() {
        console.log('Phaser create function called');
        this.add.rectangle(340, 340, 50, 50, 0xff0000);

        this.currentAmmo = 5;
        this.canShoot = true;
        this.playerSprites = {};
        this.bulletSprites = {};
        this.playerTexts = {};
        this.texts = [];
        this.gameInProgress = false;
        gameScene = this;

    
        this.cameras.main.setBackgroundColor('#FFFFFF');

    
        const mapSize = 680;

    
        this.mapBorder = this.add.rectangle(mapSize / 2, mapSize / 2, mapSize, mapSize, 0x000000);
        this.mapBorder.setStrokeStyle(4, 0x000000);
        this.mapBorder.setDepth(0);

    
        this.mapBackground = this.add.rectangle(mapSize / 2, mapSize / 2, mapSize - 4, mapSize - 4, 0xFFFFFF);
        this.mapBackground.setDepth(0);

    
        this.walls = this.physics.add.staticGroup();
        this.powerups = this.physics.add.group();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    
        this.waitingText = this.add.text(400, 300, 'Đang chờ kết nối...', {
            fontSize: '24px',
            fill: '#000000'
        }).setOrigin(0.5);
        this.waitingText.setDepth(10);

    
        this.reloadText = this.add.text(
            this.cameras.main.width - 150,
            50,
            "",
            { fontSize: '16px', fill: '#ff0000' }
        );
        this.reloadText.setScrollFactor(0);
        this.reloadText.setDepth(10);

        this.createGameObjects = function () {
            console.log('Creating game objects');
            this.texts.forEach(text => text.destroy());
            this.texts = [];

        
            createBoard(this, this.boardData);
            printBoard(this.boardData.board);

        
            if (this.playersData) {
                this.playersData.forEach(player => {
                
                    const spawnPosition = getRandomPositionSafe(this, 100);
                    
                
                    player.x = spawnPosition.x;
                    player.y = spawnPosition.y;
                    
                
                    const playerSprite = this.physics.add.sprite(spawnPosition.x, spawnPosition.y, 'tank');
                    playerSprite.setScale(0.7);
                    playerSprite.setDepth(2);
                    playerSprite.rotation = player.rotation;
                    playerSprite.playerId = player.id;
                    playerSprite.setCollideWorldBounds(true);

                
                    const hitboxWidth = Math.floor(playerSprite.width * 0.8);
                    const hitboxHeight = Math.floor(playerSprite.height * 0.8);
                    playerSprite.body.setSize(hitboxWidth, hitboxHeight, true);

                    playerSprite.body.setBounce(0);
                    playerSprite.body.setMass(1);
                    playerSprite.body.setDrag(1000, 1000);
                    playerSprite.body.setCollideWorldBounds(true);

                    const playerIndex = this.playersData.find(p => p.id === player.id);
                    const colors = [0xFF0000, 0xFFFF00, 0x00FF00, 0x0000FF];
                    var colorIndex = 0;
                    /**
                     * red: 0xFF0000
                     * yellow: 0xFFFF00
                     * green: 0x00FF00
                     * blue: 0x0000FF
                     */
                    if (playerIndex.color == "red") {
                        colorIndex = 0;
                    } else if (playerIndex.color == "yellow") {
                        colorIndex = 1;
                    } else if (playerIndex.color == "green") {
                        colorIndex = 2;
                    } else if (playerIndex.color == "blue") {
                        colorIndex = 3;
                    }
                    playerSprite.setTint(colors[colorIndex]);

                    this.playerSprites[player.id] = playerSprite;

                    this.physics.add.collider(playerSprite, this.walls);

                    for (const id in this.playerSprites) {
                        if (id !== player.id) {
                            this.physics.add.collider(playerSprite, this.playerSprites[id]);
                        }
                    }

                    console.log("my player is real", player);
                
                    const playerText = this.add.text(
                        playerSprite.x,
                        playerSprite.y - 30,
                        `${player.name}: ${player.score || 0}`,
                        { fontSize: '12px', fill: '#000000' }
                    );
                    playerText.setOrigin(0.5);
                    playerText.setDepth(3);
                    this.playerTexts[player.id] = playerText;
                    this.texts.push(playerText);

                
                    if (player.id === socket.id) {
                        localPlayer = player;
                        console.log('Local player sprite created at:', playerSprite.x, playerSprite.y);
                    
                        window.socketA.sendPlayerLocation(playerSprite.x, playerSprite.y, playerSprite.rotation);
                    }
                });
            }
        };


        window.initializeGame = this.initializeGame.bind(this);
        window.resetGame = this.resetGame.bind(this);
        window.updatePlayerPosition = this.updatePlayerPosition.bind(this);
        window.renderBullet = this.createBullet.bind(this);
        window.updateScore = this.updateScore.bind(this);
        window.endGame = this.endGame.bind(this);
        window.enterSpectateMode = this.enterSpectateMode.bind(this);
        window.removePlayer = this.removePlayer.bind(this);
        window.updatePowerup = this.updatePlayerPowerup.bind(this);

        console.log('Phaser game methods registered');


        if (pendingGameData) {
            console.log('Processing pending game data in create()');
            const data = pendingGameData;
            pendingGameData = null;
            this.initializeGame(data);
        }
    }

    update() {
        if (!this.gameInProgress) return;

    
        const alivePlayers = Object.values(this.playerSprites).filter(sprite => sprite.active).length;

    
        if (alivePlayers === 1 && this.gameInProgress && resetInProgress === 0) {
            console.log('Only one player alive, initiating reset sequence...');
            
        
            resetInProgress = 1;

        
            setTimeout(() => {
                console.log('Game reset timer completed, resetting game...');
                
            
                socket.emit('resetMap');
                
                this.resetGame({ board: this.boardData, players: this.playersData });

            
                resetInProgress = 2;

            
                setTimeout(() => {
                    resetInProgress = 0;
                }, 1000);
            }, 5000);
            
        
        }

    
        if (!alive) return;

        const playerSprite = this.playerSprites[socket.id];
        if (!playerSprite) return;

        let moved = false;
        let oldX = playerSprite.x;
        let oldY = playerSprite.y;
        let oldRotation = playerSprite.rotation;

        if (this.cursors.left.isDown) {
            playerSprite.rotation -= 0.05;
            moved = true;
        } else if (this.cursors.right.isDown) {
            playerSprite.rotation += 0.05;
            moved = true;
        }

        playerSprite.setVelocity(0);
        if (this.cursors.up.isDown) {
            const velocity = this.physics.velocityFromRotation(playerSprite.rotation, 150);
            playerSprite.setVelocity(velocity.x, velocity.y);
            moved = true;
        } else if (this.cursors.down.isDown) {
            const velocity = this.physics.velocityFromRotation(playerSprite.rotation, -100);
            playerSprite.setVelocity(velocity.x, velocity.y);
            moved = true;
        }

        const mapSize = 680;
        const tankSize = 24;
        playerSprite.x = Phaser.Math.Clamp(playerSprite.x, tankSize / 2, mapSize - tankSize / 2);
        playerSprite.y = Phaser.Math.Clamp(playerSprite.y, tankSize / 2, mapSize - tankSize / 2);

    
        window.socketA.sendPlayerLocation(playerSprite.x, playerSprite.y, playerSprite.rotation);

        if (moved) {
            if (this.playerTexts[socket.id]) {
                this.playerTexts[socket.id].setPosition(playerSprite.x, playerSprite.y - 30);
            }
            if (playerSprite.powerupIcon) {
                playerSprite.powerupIcon.x = playerSprite.x;
                playerSprite.powerupIcon.y = playerSprite.y - 50;
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.fireKey) && this.currentAmmo > 0 && this.canShoot) {
            this.canShoot = false;
            this.currentAmmo--;
            window.socketA.fireBullet(playerSprite.x, playerSprite.y, playerSprite.rotation, currentPowerup);
            this.time.delayedCall(200, () => { this.canShoot = true; });
        }

    
        for (const id in this.playerSprites) {
            if (id !== socket.id) {
                const playerText = this.playerTexts[id];
                const playerSprite = this.playerSprites[id];
                if (playerText && playerSprite) {
                    playerText.x = playerSprite.x;
                    playerText.y = playerSprite.y - 30;
                    if (playerSprite.powerupIcon) {
                        playerSprite.powerupIcon.x = playerSprite.x;
                        playerSprite.powerupIcon.y = playerSprite.y - 50;
                    }
                }
            }
        }
    }
}

let gameInstance = null;

function initPhaserGame() {
    console.log('Initializing Phaser game...');


    const config = new Phaser.Game({
        type: Phaser.AUTO,
        width: 680, 
        height: 680, 
        parent: 'phaser-game',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: true
            }
        },
        backgroundColor: '#FFFFFF',
        scene: [Scene],
    });

    console.log('Creating new Phaser game instance');
    try {
        window.game = config
        gameInstance = window.game;
        gameInitialized = true;


        if (pendingGameData) {
            const data = pendingGameData;
            pendingGameData = null;

            setTimeout(() => {
                console.log('Initializing game with pending data');
                if (window.game && window.game.scene.scenes[0]) {
                    window.game.scene.scenes[0].initializeGame(data);
                }
            }, 500);
        }
    } catch (error) {
        console.error('Error initializing Phaser game:', error);
    }
}

/**
 * SOCKET C COMMUNICATION
 * =========================
 */

const createBoard = (self, board) => {
    console.log('Creating board with data:', board);

    if (!board || typeof board !== 'object') {
        console.error('Invalid board data');
        return false;
    }

    let boardArray = Array.isArray(board) ? board : Object.values(board);
    if (!Array.isArray(boardArray) || boardArray.length === 0) {
        console.error('boardArray is not an array or is empty:', boardArray);
        return false;
    }

    if (self.walls) {
        self.walls.clear(true, true);
    } else {
        self.walls = self.physics.add.staticGroup();
    }

    const mapSize = 680;


    if (boardArray[0] && Array.isArray(boardArray[0])) {
        for (let wall of boardArray[0]) {
            if (!wall || typeof wall !== 'object') continue;

            if (wall.x !== undefined && wall.y !== undefined &&
                wall.width !== undefined && wall.height !== undefined) {
                let tile;
                if (wall.width > wall.height) {
                    tile = self.physics.add.staticSprite(
                        wall.x + wall.width / 2,
                        wall.y + wall.height / 2,
                        "wall_x"
                    );
                } else {
                    tile = self.physics.add.staticSprite(
                        wall.x + wall.width / 2,
                        wall.y + wall.height / 2,
                        "wall_y"
                    );
                }
                tile.displayWidth = wall.width;
                tile.displayHeight = wall.height;
                tile.body.setSize(wall.width, wall.height);
                tile.refreshBody();
                tile.setVisible(true);
                tile.setDepth(1);

            
            
            

                self.walls.add(tile);
            } else {
                console.warn('Invalid wall object:', wall);
            }
        }
    } else {
        console.error('No wall data in boardArray[0]:', boardArray);
    }

    console.log(`Created ${self.walls.getChildren().length} wall tiles`);
    self.cameras.main.centerOn(mapSize / 2, mapSize / 2);
    return true;
};

window.gameC = {
    initializeGame: function (data) {
        console.log('gameC.initializeGame called with data:', data);

        if (!window.game || !window.game.scene || !window.game.scene.scenes || !window.game.scene.scenes[0]) {
            console.log('Game not ready yet, storing data for later');
            pendingGameData = data;

            return;
        }

        window.game.scene.scenes[0].initializeGame(data);
    },
    updatePlayerPosition: function (player) {
        if (window.game && window.game.scene && window.game.scene.scenes[0]) {
            window.game.scene.scenes[0].updatePlayerPosition(player);
        }
    },
    renderBullet: function (bullet) {
        if (window.game && window.game.scene && window.game.scene.scenes[0]) {
            window.game.scene.scenes[0].createBullet(bullet);
        }
    },
    updateScore: function (playerId, score) {
        if (window.game && window.game.scene && window.game.scene.scenes[0]) {
            window.game.scene.scenes[0].updateScore(playerId, score);
        }
    },
    endGame: function (data) {
        if (window.game && window.game.scene && window.game.scene.scenes[0]) {
            window.game.scene.scenes[0].endGame(data);
        }
    },
    enterSpectateMode: function (players) {
        if (window.game && window.game.scene && window.game.scene.scenes[0]) {
            window.game.scene.scenes[0].enterSpectateMode(players);
        }
    },
    removePlayer: function (playerId) {
        if (window.game && window.game.scene && window.game.scene.scenes[0]) {
            window.game.scene.scenes[0].removePlayer(playerId);
        }
    },
    updatePowerup: function (playerId, powerup) {
        if (window.game && window.game.scene && window.game.scene.scenes[0]) {
            window.game.scene.scenes[0].updatePlayerPowerup(playerId, powerup);
        }
    }
};

document.addEventListener('DOMContentLoaded', function () {
    console.log('DOMContentLoaded: Checking if we should initialize Phaser');

    if (document.getElementById('phaser-game') && !gameInitialized) {
        initPhaserGame();
    }
});

socket.on('gameStart', (data) => {
    console.log('Received gameStart event with data:', data);
    if (!data) {
        console.error('No game data received');
        return;
    }

    if (!data.board) {
        console.error('No board data in gameStart event:', data);
    
        data.board = [];
    } else {
        console.log('Board data type:', typeof data.board);
        console.log('Is board an array?', Array.isArray(data.board));
        console.log('Board data length in gameStart:',
            Array.isArray(data.board) ? data.board.length : 'not an array');

    
        if (Array.isArray(data.board) && data.board.length > 0) {
            console.log('Sample board tile:', data.board[0]);
        }
    }

    gameInProgress = true;
    alive = true;
    canShoot = true;
    window.gameC.initializeGame(data);
});

socket.on('waitingRoom', (data) => {
    console.log('Received waitingRoom event');
    if (!gameInitialized) {
        console.log('Initializing Phaser for waiting room');
        initPhaserGame();
    }
});

socket.on('playerDied', (data) => {
    console.log('Player died event received:', data);

    if (data.victimId === socket.id) {
        alive = false;
        gameScene.cursors.left.isDown = false;
        gameScene.cursors.right.isDown = false;
        gameScene.cursors.up.isDown = false;
        gameScene.cursors.down.isDown = false;
        gameScene.fireKey.isDown = false;
        gameScene.enterSpectateMode();

    
    
        if (gameScene.playerSprites[data.victimId]) {
            gameScene.playerSprites[data.victimId].destroy();
            delete gameScene.playerSprites[data.victimId];
        }
    } else {
        if (gameScene.playerSprites[data.victimId]) {
            gameScene.playerSprites[data.victimId].destroy();
            delete gameScene.playerSprites[data.victimId];
        }
    }
});

socket.on('drawBoard', (board) => {
    if (window.game && window.game.scene.scenes[0]) {
        window.game.scene.scenes[0].boardData = board;
        try {
            createBoard(window.game.scene.scenes[0], board);

        
            const mapSize = 680;
            window.game.scene.scenes[0].cameras.main.centerOn(mapSize / 2, mapSize / 2);
        } catch (error) {
            console.error('Error creating board from drawBoard event:', error);
        }
    } else {
        console.error('Game not initialized yet, cannot draw board');
    }
});

socket.on('playerLeft', (playerId) => {
    window.gameC.removePlayer(playerId);
});

socket.on('resetGame', (data) => {
    console.log('Reset event received - EXPLICITLY setting alive=true');
    alive = true;
    canShoot = true;


    if (gameScene && gameScene.texts) {
        gameScene.texts = gameScene.texts.filter(text => {
            if (text && text.active && text.text && text.text.includes('Bạn đã chết')) {
                try {
                    text.destroy();
                    return false;
                } catch (error) {
                    console.warn("Error destroying text:", error);
                }
            }
            return text && text.active;
        });
    }


    if (gameScene && !gameScene.playerTexts) {
        gameScene.playerTexts = {};
    }

    console.log('Calling resetGame with current alive status:', alive);
    window.gameC.resetGame(data);
});

function getRandomPositionSafe(self, maxAttempts = 20) {

    let position;
    let attempt = 0;
    let safePosition = false;
    
    do {
        attempt++;
    
        position = {
            x: Phaser.Math.Between(50, 630), 
            y: Phaser.Math.Between(50, 630)
        };
        
    
        const tempSprite = self.physics.add.sprite(position.x, position.y, 'tank');
        tempSprite.setScale(0.7);
        
    
        const hitboxWidth = Math.floor(tempSprite.width * 0.8);
        const hitboxHeight = Math.floor(tempSprite.height * 0.8);
        tempSprite.body.setSize(hitboxWidth, hitboxHeight, true);
        
    
        const isOverlapping = self.physics.overlap(tempSprite, self.walls);
        
    
        let overlapsWithPlayer = false;
        for (const id in self.playerSprites) {
            if (self.physics.overlap(tempSprite, self.playerSprites[id])) {
                overlapsWithPlayer = true;
                break;
            }
        }
        
    
        safePosition = !isOverlapping && !overlapsWithPlayer;
        
    
        tempSprite.destroy();
        
    } while (!safePosition && attempt < maxAttempts);
    


    if (!safePosition) {
        const corners = [
            { x: 100, y: 100 },
            { x: 580, y: 100 },
            { x: 100, y: 580 },
            { x: 580, y: 580 }
        ];
        return corners[Math.floor(Math.random() * corners.length)];
    }
    
    return position;
}
function resetMap() {
    socket.on('prepareNewGame', datas => {
        mapper = datas.board;
    })
}

function printBoard(board) { //in toàn bộ bảng
    let output = '';
    for (let i of board) { //đối với mỗi ô của bảng
        let string = '' //tạo một chuỗi trống
        i.left ? string += '[' : string += ' ' //nếu tường bên trái của ô là true, thêm [ vào chuỗi
        i.top ? string += '^' : string += ' ' //nếu tường phía trên của ô là true, thêm ^ vào chuỗi
        i.bottom ? string += '_' : string += ' ' //if the tile's bottom wall is true, add _ to the string
        i.right ? string += ']' : string += ' ' //if the tile's right wall is true, add ] to the string
        output += string;
        if (i.col === 10) { //sau khi có 10 cột, thêm một dòng mới
            output += '\n';
        }
    }
    console.log(output);
}

window.addEventListener('error', function (e) {
    console.error('JavaScript error:', e.message, 'at', e.filename, 'line', e.lineno);
});

window.renderBullet = function (bullet) {
    window.gameC.renderBullet(bullet);
};
window.updateScore = function (playerId, score) {
    window.gameC.updateScore(playerId, score);
};
window.updatePlayerPosition = function (player) {
    window.gameC.updatePlayerPosition(player);
};
window.endGame = function (data) {
    window.gameC.endGame(data);
};
window.enterSpectateMode = function (players) {
    window.gameC.enterSpectateMode(players);
};
window.removePlayer = function (playerId) {
    window.gameC.removePlayer(playerId);
};
window.updatePowerup = function (playerId, powerup) {
    window.gameC.updatePowerup(playerId, powerup);
};
window.initializeGame = function (data) {
    window.gameC.initializeGame(data);
};