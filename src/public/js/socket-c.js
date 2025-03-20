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
let gameInitialized = false; 

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
            this.boardData = data.board;
            this.playersData = data.players;
            this.gameInProgress = true;


            this.createGameObjects();
        };


        this.resetGame = function (data) {
            console.log('Resetting game with data:', data);
            this.boardData = data.board;
            this.playersData = data.players;


            this.clearGameObjects();


            this.createGameObjects();
        };


        this.clearGameObjects = function () {

            if (this.playerSprites) {
                Object.values(this.playerSprites).forEach(sprite => {
                    if (sprite) sprite.destroy();
                });
                this.playerSprites = {};
            }


            if (this.bulletSprites) {
                Object.values(this.bulletSprites).forEach(sprite => {
                    if (sprite) sprite.destroy();
                });
                this.bulletSprites = {};
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
            }
        };


        this.updatePlayerPosition = function (player) {
            const playerSprite = this.playerSprites[player.id];
            if (playerSprite) {
                playerSprite.x = player.x;
                playerSprite.y = player.y;
                playerSprite.rotation = player.rotation;


                if (this.playerTexts[player.id]) {
                    this.playerTexts[player.id].x = player.x;
                    this.playerTexts[player.id].y = player.y - 30;
                }
            }
        };


        this.createBullet = function (bullet) {

            const bulletSprite = this.physics.add.sprite(bullet.x, bullet.y, 'bullet');
            bulletSprite.setScale(0.5);
            bulletSprite.setDepth(1);


            bulletSprite.bulletId = bullet.id;
            bulletSprite.ownerId = bullet.ownerId;


            const velocity = this.physics.velocityFromRotation(bullet.angle, 300);
            bulletSprite.setVelocity(velocity.x, velocity.y);


            this.bulletSprites[bullet.id] = bulletSprite;


            this.physics.add.collider(bulletSprite, this.walls, () => {
                bulletSprite.destroy();
                delete this.bulletSprites[bullet.id];


                window.socketA.bulletDestroyed(bullet.ownerId);
            });


            for (const id in this.playerSprites) {
                const playerSprite = this.playerSprites[id];

                if (bullet.ownerId !== id) {
                    this.physics.add.overlap(bulletSprite, playerSprite, () => {

                        bulletSprite.destroy();
                        delete this.bulletSprites[bullet.id];


                        if (id === socket.id && alive) {

                            window.socketA.playerDied(bullet.ownerId);
                            alive = false;
                        }
                    });
                }
            }
        };


        this.updateScore = function (playerId, score) {
            if (this.playerTexts[playerId]) {
                const player = this.playersData.find(p => p.id === playerId);
                if (player) {
                    const text = this.playerTexts[playerId];
                    text.setText(`${player.name}: ${score}`);
                }
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


        this.enterSpectateMode = function (players) {

            const spectateText = this.add.text(400, 50,
                'Bạn đã chết. Đang ở chế độ theo dõi.',
                { fontSize: '18px', fill: '#ff0000' }
            );
            spectateText.setOrigin(0.5);
            spectateText.setDepth(10);


            this.texts.push(spectateText);
        };


        this.removePlayer = function (playerId) {

            if (this.playerSprites[playerId]) {
                this.playerSprites[playerId].destroy();
                delete this.playerSprites[playerId];
            }


            if (this.playerTexts[playerId]) {
                this.playerTexts[playerId].destroy();
                delete this.playerTexts[playerId];
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

        this.playerSprites = {};
        this.bulletSprites = {};
        this.playerTexts = {};
        this.texts = [];
        this.gameInProgress = false;


        this.walls = this.physics.add.staticGroup();
        this.powerups = this.physics.add.group();


        this.cursors = this.input.keyboard.createCursorKeys();
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);


        this.add.text(400, 300, 'Đang chờ kết nối...', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);


        this.createGameObjects = function () {
            console.log('Creating game objects');

            this.texts.forEach(text => text.destroy());
            this.texts = [];


            if (this.boardData) {

                const cellWidth = 32;
                const cellHeight = 32;
                

                for (let i = 0; i < this.boardData.length; i++) {
                    const cell = this.boardData[i];
                    const x = (cell.col - 1) * cellWidth;
                    const y = (cell.row - 1) * cellHeight;
                    

                    if (cell.left) {
                        const wall = this.walls.create(x, y + cellHeight/2, 'wall_y');
                        wall.setScale(0.5);
                        wall.setOrigin(0.5, 0.5);
                        wall.refreshBody();
                    }
                    

                    if (cell.right) {
                        const wall = this.walls.create(x + cellWidth, y + cellHeight/2, 'wall_y');
                        wall.setScale(0.5);
                        wall.setOrigin(0.5, 0.5);
                        wall.refreshBody();
                    }
                    

                    if (cell.top) {
                        const wall = this.walls.create(x + cellWidth/2, y, 'wall_x');
                        wall.setScale(0.5);
                        wall.setOrigin(0.5, 0.5);
                        wall.refreshBody();
                    }
                    

                    if (cell.bottom) {
                        const wall = this.walls.create(x + cellWidth/2, y + cellHeight, 'wall_x');
                        wall.setScale(0.5);
                        wall.setOrigin(0.5, 0.5);
                        wall.refreshBody();
                    }
                }
            }


            if (this.playersData) {
                this.playersData.forEach(player => {

                    const playerSprite = this.physics.add.sprite(player.x, player.y, 'tank');
                    playerSprite.setScale(0.5);
                    playerSprite.setDepth(2);
                    playerSprite.rotation = player.rotation;
                    playerSprite.playerId = player.id;


                    const playerIndex = this.playersData.findIndex(p => p.id === player.id);

                    /**
                     * Quy tắc màu, đây là dạng màu RGB hexadecimal
                     * 0x là hệ số hex
                     * 00: Màu đỏ
                     * 00: Màu xanh lá
                     * 00: Màu xanh dương
                     */
                    const colors = [0x0000ff, 0xff0000, 0x800080, 0xffa500]; 
                    playerSprite.setTint(colors[playerIndex % colors.length]);


                    this.playerSprites[player.id] = playerSprite;


                    this.physics.add.collider(playerSprite, this.walls);


                    for (const id in this.playerSprites) {
                        if (id !== player.id) {
                            this.physics.add.collider(playerSprite, this.playerSprites[id]);
                        }
                    }


                    const playerText = this.add.text(
                        player.x,
                        player.y - 30,
                        `${player.name}: ${player.score || 0}`,
                        { fontSize: '12px', fill: '#ffffff' }
                    );
                    playerText.setOrigin(0.5);
                    playerText.setDepth(3);


                    this.playerTexts[player.id] = playerText;
                    this.texts.push(playerText);


                    if (player.id === socket.id) {
                        localPlayer = player;
                        
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
        if (!this.gameInProgress || !alive) return;


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


        if (this.cursors.up.isDown) {

            const velocity = this.physics.velocityFromRotation(playerSprite.rotation, 150);


            playerSprite.x += velocity.x * 0.1;
            playerSprite.y += velocity.y * 0.1;
            moved = true;
        } else if (this.cursors.down.isDown) {

            const velocity = this.physics.velocityFromRotation(playerSprite.rotation, -100);


            playerSprite.x += velocity.x * 0.1;
            playerSprite.y += velocity.y * 0.1;
            moved = true;
        }


        if (moved) {

            if (this.playerTexts[socket.id]) {
                this.playerTexts[socket.id].x = playerSprite.x;
                this.playerTexts[socket.id].y = playerSprite.y - 30;
            }


            if (playerSprite.powerupIcon) {
                playerSprite.powerupIcon.x = playerSprite.x;
                playerSprite.powerupIcon.y = playerSprite.y - 50;
            }


            if (oldX !== playerSprite.x || oldY !== playerSprite.y || oldRotation !== playerSprite.rotation) {
                window.socketA.sendPlayerLocation(playerSprite.x, playerSprite.y, playerSprite.rotation);
            }
        }


        if (Phaser.Input.Keyboard.JustDown(this.fireKey)) {
            window.socketA.fireBullet(playerSprite.x, playerSprite.y, playerSprite.rotation, currentPowerup);
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
    

    const config =  new Phaser.Game ({
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'phaser-game',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
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
        if (window.game && window.game.scene && window.game.scene.scenes && window.game.scene.scenes[0]) {
            window.game.scene.scenes[0].updatePlayerPosition(player);
        }
    },
    renderBullet: function (bullet) {
        if (window.game && window.game.scene && window.game.scene.scenes && window.game.scene.scenes[0]) {
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
    gameInProgress = true;
    
    window.gameC.initializeGame(data);
});

socket.on('waitingRoom', (data) => {
    console.log('Received waitingRoom event');
    if (!gameInitialized) {
        console.log('Initializing Phaser for waiting room');
        initPhaserGame();
    }
});

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