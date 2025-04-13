/**
 * Socket C: Kết nối với Socket B thông qua Socket A để xử lý và hiển thị game 
 */


/**
 * Fix case:
 * - Lỗi đồng bộ map
 *  + Một trong số các client không nhận được map hoặc bị nhận map chậm ngay cả khi tôi kiểm thử localhost giữa bất cứ số lượng client nào
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

        // Tải các hình ảnh buff có sẵn trong thư mục
        this.load.image('powerup_booby', '/assets/buff/booby.png');
        this.load.image('powerup_gatling', '/assets/buff/gatling.png');
        this.load.image('powerup_homing', '/assets/buff/homing-missile.png');
        this.load.image('powerup_lazer', '/assets/buff/lazer.png');
        this.load.image('powerup_ray', '/assets/buff/ray.png');
        this.load.image('powerup_rc', '/assets/buff/rc-missile.png');
        this.load.image('powerup_bomb', '/assets/buff/bomb.png');
        this.load.image('bomb_smoke', '/assets/buff/bomb_smoke.png');
        this.load.image('bomb', '/assets/buff/bomb.png');

        // Add bomb-specific functions
        this.placeBomb = function (x, y, ownerId) {
            console.log('Placing bomb at:', x, y);

            // Create bomb sprite
            const bomb = this.physics.add.sprite(x, y, 'bomb');
            bomb.setScale(0.4);
            bomb.setDepth(2);
            bomb.bombId = `bomb_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            bomb.ownerId = ownerId;
            bomb.isArmed = false;

            // Store the bomb reference
            if (!this.bombs) this.bombs = {};
            this.bombs[bomb.bombId] = bomb;

            // Create a safety timer (3 seconds)
            this.time.delayedCall(3000, () => {
                if (bomb && bomb.active) {
                    bomb.isArmed = true;
                    console.log('Bomb is now armed!');

                    // Add a pulsing effect to indicate armed state
                    this.tweens.add({
                        targets: bomb,
                        scale: { from: 0.35, to: 0.45 },
                        duration: 500,
                        yoyo: true,
                        repeat: -1
                    });

                    // Add collision detection with players
                    this.setupBombTrigger(bomb);

                    // Emit event to tell other clients the bomb is armed
                    socket.emit('bombArmed', {
                        bombId: bomb.bombId,
                        x: bomb.x,
                        y: bomb.y
                    });
                }
            });

            return bomb;
        };

        this.setupBombTrigger = function (bomb) {
            // Create trigger area around the bomb (larger than the bomb itself)
            const triggerRadius = 50;
            bomb.triggerArea = this.add.circle(bomb.x, bomb.y, triggerRadius, 0xff0000, 0.0);
            this.physics.add.existing(bomb.triggerArea);

            // Check for players entering the trigger area
            for (const id in this.playerSprites) {
                const playerSprite = this.playerSprites[id];
                this.physics.add.overlap(playerSprite, bomb.triggerArea, () => {
                    if (bomb && bomb.active && bomb.isArmed) {
                        this.explodeBomb(bomb);
                    }
                });
            }
        };

        this.explodeBomb = function (bomb) {
            if (!bomb || !bomb.active) return;
            if (bomb.isExploding) return;  // Prevent multiple explosions

            bomb.isExploding = true;
            console.log('Bomb exploding!', bomb.bombId);

            // Notify server about explosion
            socket.emit('bombExploded', {
                bombId: bomb.bombId,
                x: bomb.x,
                y: bomb.y,
                ownerId: bomb.ownerId,
                timestamp: Date.now() // Thêm timestamp để đồng bộ thời gian nổ
            });

            // Tạm dừng xử lý hiệu ứng và damage cho đến khi nhận được lệnh từ server
            // để đảm bảo tất cả client xử lý vụ nổ cùng một thời điểm
        };

        // Tách riêng phần xử lý hiệu ứng nổ và damage để server kiểm soát
        this.processBombExplosion = function (bombData) {
            console.log('Xử lý vụ nổ bomb:', bombData);

            // Create explosion effect
            this.createExplosionEffect(bombData.x, bombData.y);

            // Apply camera shake
            this.cameras.main.shake(200, 0.01);

            // Check which players are caught in the explosion
            const explosionRadius = 100;
            for (const id in this.playerSprites) {
                const playerSprite = this.playerSprites[id];
                if (!playerSprite || !playerSprite.active) continue;

                // Calculate distance from bomb to player
                const distance = Phaser.Math.Distance.Between(
                    bombData.x, bombData.y,
                    playerSprite.x, playerSprite.y
                );

                if (distance <= explosionRadius) {
                    console.log('Player caught in explosion:', id);
                    // Kill the player caught in the explosion
                    window.socketA.playerDied(id, bombData.ownerId);
                }
            }

            // Xử lý xóa bomb khỏi scene
            if (this.bombs) {
                // Xóa bomb từ data của scene
                const bomb = this.bombs[bombData.bombId];
                if (bomb && bomb.active) {
                    console.log('Đang xóa bomb:', bombData.bombId);

                    // Dừng tất cả tweens trên bomb (hiệu ứng nhấp nháy, v.v.)
                    this.tweens.killTweensOf(bomb);

                    // Xóa trigger area một cách an toàn
                    if (bomb.triggerArea) {
                        bomb.triggerArea.destroy();
                        bomb.triggerArea = null;
                    }

                    // Xóa bomb sprite
                    bomb.destroy();

                    // Quan trọng: Xóa bomb từ object cache của scene
                    delete this.bombs[bombData.bombId];

                    console.log('Đã xóa bomb thành công:', bombData.bombId);
                } else {
                    // Tìm bomb trên bản đồ dựa vào tọa độ trong trường hợp ID không khớp
                    let foundBomb = false;
                    Object.keys(this.bombs).forEach(key => {
                        const b = this.bombs[key];
                        if (b && b.active) {
                            const distance = Phaser.Math.Distance.Between(b.x, b.y, bombData.x, bombData.y);
                            if (distance < 10) { // Nếu bomb ở gần vị trí nổ
                                console.log('Tìm thấy bomb gần vị trí nổ, đang xóa:', key);

                                // Xóa giống như trên
                                this.tweens.killTweensOf(b);
                                if (b.triggerArea) {
                                    b.triggerArea.destroy();
                                    b.triggerArea = null;
                                }
                                b.destroy();
                                delete this.bombs[key];
                                foundBomb = true;
                            }
                        }
                    });

                    if (!foundBomb) {
                        console.log('Không tìm thấy bomb nào để xóa tại:', bombData.x, bombData.y);
                    }
                }
            }

            // Thêm log để debug
            console.log('Số lượng bomb hiện tại sau khi xử lý:', this.bombs ? Object.keys(this.bombs).length : 0);
        };

        this.createExplosionEffect = function (x, y) {
            // Create a smoke particle effect
            const smokeCloud = this.add.sprite(x, y, 'bomb_smoke');
            smokeCloud.setScale(0.1);
            smokeCloud.setAlpha(0.9);
            smokeCloud.setDepth(5); // Above players but below UI

            // Create smoke animation
            this.tweens.add({
                targets: smokeCloud,
                scale: { from: 0.5, to: 2.5 },
                alpha: { from: 0.8, to: 0 },
                duration: 2000,
                ease: 'Power1',
                onComplete: () => {
                    smokeCloud.destroy();
                }
            });
        };

        // Handle remote bomb explosion
        this.handleRemoteBombExplosion = function (data) {
            const bomb = this.bombs ? this.bombs[data.bombId] : null;
            if (bomb && bomb.active) {
                this.explodeBomb(bomb);
            } else {
                // If we don't have this bomb locally, just show the explosion effect
                this.createExplosionEffect(data.x, data.y);
                this.cameras.main.shake(200, 0.01);
            }
        };

        // Add ability to handle a newly placed bomb from another player
        this.handleRemoteBombPlaced = function (data) {
            const bomb = this.placeBomb(data.x, data.y, data.ownerId);
            bomb.bombId = data.bombId; // Use the same ID sent by the owner
        };

        // Hàm xử lý khi một power-up được thu thập
        this.collectPowerup = function (powerupId) {
            // Tìm power-up trong nhóm power-up
            this.powerups.getChildren().forEach((powerupSprite) => {
                if (powerupSprite.powerupId === powerupId) {
                    // Hiệu ứng trước khi xóa
                    this.tweens.add({
                        targets: powerupSprite,
                        scale: { from: 0.4, to: 0 },
                        alpha: { from: 1, to: 0 },
                        duration: 300,
                        onComplete: () => {
                            powerupSprite.destroy();
                        }
                    });
                }
            });
        };

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

            this.clearGameObjects();
            this.createGameObjects();

            const mapSize = 680;
            this.cameras.main.centerOn(mapSize / 2, mapSize / 2);
        };

        this.resetGame = function (data) {
            console.log('[SYNC] Resetting game with data:', data);

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

            console.log('[SYNC] Waiting for new map data...');

            const mapTimeout = setTimeout(() => {
                if (!mapReceived) {
                    console.log('[SYNC] Map data timeout, requesting new map data');
                    socket.emit('resetMap');
                }
            }, 3000);

            socket.off('prepareNewGame');

            socket.on('prepareNewGame', (newData) => {
                console.log('[SYNC] Received new map data:', newData);

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
                                console.log('[SYNC] Reset game - Current player status set to alive');
                                localPlayer = player;
                            }
                        });
                    }

                    // Không gọi createBoard cục bộ ở đây
                    // Server sẽ emit sự kiện drawBoard để đồng bộ bản đồ giữa các client
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

            // Xóa tất cả các bomb khi reset map
            if (this.bombs) {
                for (let key in this.bombs) {
                    if (this.bombs.hasOwnProperty(key)) {
                        // Xóa vùng kích hoạt của bomb nếu có
                        if (this.bombs[key].triggerArea) {
                            this.bombs[key].triggerArea.destroy();
                        }
                        // Xóa bomb
                        this.bombs[key].destroy();
                    }
                }
                this.bombs = {};
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
            bulletSprite.body.setDamping(false)

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
                        window.socketA.playerDied(id, bullet.ownerId);
                    } else if (id == bullet.ownerId && killOwnerBullet[bullet.id] === true) {
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
            this.clearGameObjects();

            const winnerText = this.add.text(400, 300,
                `Người chiến thắng: ${data.name}\nĐiểm số: ${data.score}`,
                { fontSize: '24px', fill: '#fff', align: 'center' }
            );
            winnerText.setOrigin(0.5);
            winnerText.setDepth(10);

            this.texts.push(winnerText);
            this.waitingText = this.add.text(400, 300, 'Đang chờ kết nối...', {
                fontSize: '24px',
                fill: '#000000'
            }).setOrigin(0.5);
            this.waitingText.setDepth(10);
            this.gameInProgress = false;
            this.playersData = this.playersData.map(player => {
                player.score = 0
                this.gameInProgress = false;
                return player;
            });
            this.gameInProgress = false;
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
                this.playersData = this.playersData.filter(p => p.id !== playerId);
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
            console.log('[SYNC] Creating game objects');
            this.texts.forEach(text => text.destroy());
            this.texts = [];

            // Không gọi createBoard ở đây, việc tạo bản đồ được xử lý thông qua event drawBoard
            // Chỉ in thông tin bản đồ để debug
            if (this.boardData && this.boardData.board) {
                printBoard(this.boardData.board);
            }

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

        this.handleNewPowerup = function (powerup) {
            console.log('Adding new powerup:', powerup);

            let powerupSprite;

            switch (powerup.type) {
                case 'bomb':
                    powerupSprite = this.physics.add.sprite(powerup.x, powerup.y, 'powerup_bomb');
                    break;
                case 'gatling':
                    powerupSprite = this.physics.add.sprite(powerup.x, powerup.y, 'powerup_gatling');
                    break;
                case 'lazer':
                    powerupSprite = this.physics.add.sprite(powerup.x, powerup.y, 'powerup_lazer');
                    break;
                case 'shield':
                    powerupSprite = this.physics.add.sprite(powerup.x, powerup.y, 'powerup_booby');
                    break;
                case 'speed':
                    powerupSprite = this.physics.add.sprite(powerup.x, powerup.y, 'powerup_homing');
                    break;
                default:
                    powerupSprite = this.physics.add.sprite(powerup.x, powerup.y, 'powerup_gatling');
            }

            powerupSprite.setScale(0.4);
            powerupSprite.setDepth(1);
            powerupSprite.powerupId = powerup.id;
            powerupSprite.powerupType = powerup.type;

            this.tweens.add({
                targets: powerupSprite,
                rotation: { from: 0, to: Math.PI * 2 },
                duration: 3000,
                repeat: -1
            });

            this.tweens.add({
                targets: powerupSprite,
                y: { from: powerup.y - 5, to: powerup.y + 5 },
                duration: 1000,
                yoyo: true,
                repeat: -1
            });

            this.powerups.add(powerupSprite);

            for (const id in this.playerSprites) {
                const playerSprite = this.playerSprites[id];
                this.physics.add.overlap(playerSprite, powerupSprite, () => {
                    console.log('Player collected powerup:', powerup.type);

                    // Chỉ người chơi hiện tại gửi thông báo thu thập powerup
                    if (id === socket.id) {
                        window.socketA.collectPowerup({
                            id: powerup.id,
                            type: powerup.type,
                            name: powerup.type.charAt(0).toUpperCase() + powerup.type.slice(1)
                        });
                    }

                    // Xóa powerup
                    powerupSprite.destroy();
                });
            }

            return powerupSprite;
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
        window.placeBomb = this.placeBomb.bind(this);
        window.handleRemoteBombExplosion = this.handleRemoteBombExplosion.bind(this);
        window.handleRemoteBombPlaced = this.handleRemoteBombPlaced.bind(this);
        window.handleNewPowerup = this.handleNewPowerup.bind(this);
        window.collectPowerup = this.collectPowerup.bind(this);

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

        if (this.playersData.length == 1) {
            console.log("now end one", this.playersData[0])
            this.endGame(this.playersData[0]);
            this.gameInProgress = false;
            alert("Chỉ còn một người chơi, bạn đã thắng!");
        } else if ((alivePlayers === 1 || alivePlayers === 0) && this.gameInProgress && resetInProgress === 0 && this.playersData.length > 1) {
            // Sửa đổi điều kiện để xử lý cả trường hợp tất cả người chơi cùng chết (alivePlayers === 0)
            console.log('Reset sequence initiated. Players alive:', alivePlayers);
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
            playerSprite.rotation -= 0.03;
            moved = true;
        } else if (this.cursors.right.isDown) {
            playerSprite.rotation += 0.03;
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

        // Khi nhấn nút space (bắn)
        if (Phaser.Input.Keyboard.JustDown(this.fireKey) && this.currentAmmo > 0 && this.canShoot) {
            this.canShoot = false;
            this.currentAmmo--;

            // Kiểm tra xem người chơi có buff bomb không
            if (currentPowerup && currentPowerup.type === 'bomb') {
                console.log('Đặt bomb thay vì bắn đạn!');
                window.socketA.placeBomb(playerSprite.x, playerSprite.y);

                // Reset currentPowerup sau khi sử dụng
                currentPowerup = null;

                // Xóa hiển thị powerup trên tank
                if (playerSprite.powerupIcon) {
                    playerSprite.powerupIcon.destroy();
                    playerSprite.powerupIcon = null;
                }
            } else {
                // Bắn đạn bình thường nếu không có buff bomb
                window.socketA.fireBullet(playerSprite.x - 6.5, playerSprite.y, playerSprite.rotation, currentPowerup);
            }

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
    console.log('[DEBUG] Creating board with data:', board);

    if (!board || typeof board !== 'object') {
        console.error('[ERROR] Invalid board data');
        return false;
    }

    // Xóa bản đồ cũ nếu có
    if (self.walls) {
        self.walls.clear(true, true);
    } else {
        self.walls = self.physics.add.staticGroup();
    }

    const mapSize = 680;

    // Xử lý cấu trúc đa dạng của dữ liệu bản đồ
    if (board.walls && Array.isArray(board.walls)) {
        console.log(`[DEBUG] Creating walls from board.walls array with ${board.walls.length} walls`);
        // Nếu có thuộc tính walls là mảng (cấu trúc phổ biến)
        for (let wall of board.walls) {
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
            }
        }
    } else if (Array.isArray(board) && board.length > 0) {
        console.log(`[DEBUG] Board is array with length ${board.length}`);
        // Nếu board là mảng và mảng đầu tiên chứa các bức tường
        if (Array.isArray(board[0])) {
            console.log(`[DEBUG] First element is array with length ${board[0].length}`);
            // Nếu mảng đầu tiên là mảng (cấu trúc cũ)
            for (let wall of board[0]) {
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
                }
            }
        } else {
            // Có thể các bức tường là mảng trực tiếp
            console.error(`[ERROR] Unexpected board structure`);
            console.log(JSON.stringify(board).substring(0, 200) + '...');
            return false;
        }
    } else if (board.board && Array.isArray(board.board)) {
        // Xử lý cấu trúc dữ liệu board.board - tạo tường từ dữ liệu lưới
        console.log(`[DEBUG] Creating walls from board.board with ${board.board.length} cells`);
        const tileSize = 68;

        for (let cell of board.board) {
            if (!cell) continue;

            const x = (cell.col - 1) * tileSize;
            const y = (cell.row - 1) * tileSize;

            if (cell.top) {
                let tile = self.physics.add.staticSprite(
                    x + tileSize / 2,
                    y,
                    "wall_x"
                );
                tile.displayWidth = tileSize;
                tile.displayHeight = 4;
                tile.body.setSize(tileSize, 4);
                tile.refreshBody();
                tile.setVisible(true);
                tile.setDepth(1);
                self.walls.add(tile);
            }

            if (cell.left) {
                let tile = self.physics.add.staticSprite(
                    x,
                    y + tileSize / 2,
                    "wall_y"
                );
                tile.displayWidth = 4;
                tile.displayHeight = tileSize;
                tile.body.setSize(4, tileSize);
                tile.refreshBody();
                tile.setVisible(true);
                tile.setDepth(1);
                self.walls.add(tile);
            }

            // Bức tường phía dưới của hàng cuối cùng
            if (cell.row === 10 && cell.bottom) {
                let tile = self.physics.add.staticSprite(
                    x + tileSize / 2,
                    y + tileSize,
                    "wall_x"
                );
                tile.displayWidth = tileSize;
                tile.displayHeight = 4;
                tile.body.setSize(tileSize, 4);
                tile.refreshBody();
                tile.setVisible(true);
                tile.setDepth(1);
                self.walls.add(tile);
            }

            // Bức tường bên phải của cột cuối cùng
            if (cell.col === 10 && cell.right) {
                let tile = self.physics.add.staticSprite(
                    x + tileSize,
                    y + tileSize / 2,
                    "wall_y"
                );
                tile.displayWidth = 4;
                tile.displayHeight = tileSize;
                tile.body.setSize(4, tileSize);
                tile.refreshBody();
                tile.setVisible(true);
                tile.setDepth(1);
                self.walls.add(tile);
            }
        }
    } else {
        console.error('[ERROR] Unrecognized board structure:', board);
        return false;
    }

    const wallsCount = self.walls.getChildren().length;
    console.log(`[DEBUG] Created ${wallsCount} wall tiles`);

    // Nếu không có bức tường nào được tạo, coi như có lỗi
    if (wallsCount === 0) {
        console.error('[ERROR] No walls were created!');
        return false;
    }

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
    },
    placeBomb: function (x, y, ownerId) {
        if (window.game && window.game.scene && window.game.scene.scenes[0]) {
            return window.game.scene.scenes[0].placeBomb(x, y, ownerId);
        }
    },
    handleRemoteBombExplosion: function (data) {
        if (window.game && window.game.scene && window.game.scene.scenes[0]) {
            window.game.scene.scenes[0].handleRemoteBombExplosion(data);
        }
    },
    handleRemoteBombPlaced: function (data) {
        if (window.game && window.game.scene && window.game.scene.scenes[0]) {
            window.game.scene.scenes[0].handleRemoteBombPlaced(data);
        }
    },
    handleNewPowerup: function (powerup) {
        if (window.game && window.game.scene && window.game.scene.scenes[0]) {
            window.game.scene.scenes[0].handleNewPowerup(powerup);
        }
    },
    collectPowerup: function (powerupId) {
        if (window.game && window.game.scene && window.game.scene.scenes[0]) {
            window.game.scene.scenes[0].collectPowerup(powerupId);
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
    console.log('[SYNC] Received drawBoard event:', new Date().toISOString());

    if (window.game && window.game.scene.scenes[0]) {
        // Lưu dữ liệu bản đồ vào game scene
        window.game.scene.scenes[0].boardData = board;

        try {
            // Xóa bản đồ cũ nếu có
            if (window.game.scene.scenes[0].walls) {
                window.game.scene.scenes[0].walls.clear(true, true);
            }

            // Tạo bản đồ mới từ dữ liệu nhận được
            createBoard(window.game.scene.scenes[0], board);

            // Căn giữa camera
            const mapSize = 680;
            window.game.scene.scenes[0].cameras.main.centerOn(mapSize / 2, mapSize / 2);

            console.log('[SYNC] Map successfully created from drawBoard event');
        } catch (error) {
            console.error('[SYNC] Error creating board from drawBoard event:', error);
        }
    } else {
        console.error('[SYNC] Game not initialized yet, storing map data for later');
        // Lưu dữ liệu bản đồ để sử dụng sau khi game được khởi tạo
        if (!pendingGameData) {
            pendingGameData = {};
        }
        pendingGameData.board = board;
    }
});

socket.on('playerLeft', (player) => {
    window.gameC.removePlayer(player.id);
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

socket.on('bombPlaced', (data) => {
    console.log('Bomb placed event received:', data);
    window.gameC.handleRemoteBombPlaced(data);
});

socket.on('bombExploded', (data) => {
    console.log('Bomb exploded event received:', data);
    window.gameC.handleRemoteBombExplosion(data);
});

socket.on('processBombExplosion', (data) => {
    console.log('Nhận lệnh processBombExplosion từ server:', data);

    // Đảm bảo rằng tất cả client xử lý vụ nổ cùng một lúc, thay vì dựa vào client phát hiện va chạm với bomb
    if (window.game && window.game.scene && window.game.scene.scenes[0]) {
        window.game.scene.scenes[0].processBombExplosion(data);
    }
});

socket.on('newPowerup', (powerup) => {
    console.log('New powerup event received:', powerup);
    window.gameC.handleNewPowerup(powerup);
});

function getRandomPositionSafe(self, maxAttempts = 20) {
    console.log('[SAFE SPAWN] Tìm vị trí an toàn để spawn player...');

    // Kích thước bản đồ và an toàn
    const mapSize = 680;
    const safeMargin = 50; // Margin an toàn từ rìa bản đồ
    const tankSize = 24;   // Kích thước xe tăng
    const safeZoneSize = 40; // Khoảng cách an toàn từ tường

    // Các vị trí spawn cố định ở 4 góc, được đảm bảo an toàn
    const safeCorners = [
        { x: 100, y: 100 },
        { x: mapSize - 100, y: 100 },
        { x: 100, y: mapSize - 100 },
        { x: mapSize - 100, y: mapSize - 100 }
    ];

    // Trước tiên thử tìm vị trí ngẫu nhiên an toàn
    let position;
    let attempt = 0;
    let safePosition = false;

    do {
        attempt++;

        // Sinh vị trí ngẫu nhiên, tránh xa rìa bản đồ
        position = {
            x: Phaser.Math.Between(safeMargin, mapSize - safeMargin),
            y: Phaser.Math.Between(safeMargin, mapSize - safeMargin)
        };

        // Tạo sprite tạm thời để kiểm tra va chạm
        const tempSprite = self.physics.add.sprite(position.x, position.y, 'tank');
        tempSprite.setScale(0.7);

        // Thiết lập hitbox phù hợp với xe tăng
        const hitboxWidth = Math.floor(tempSprite.width * 0.8);
        const hitboxHeight = Math.floor(tempSprite.height * 0.8);
        tempSprite.body.setSize(hitboxWidth, hitboxHeight, true);

        // Kiểm tra overlap với tường, dùng phương pháp cải tiến hơn
        let isOverlapping = false;

        // Kiểm tra va chạm với tất cả các tường
        if (self.walls) {
            self.walls.getChildren().forEach(wall => {
                // Tính khoảng cách từ tâm vị trí đến tâm tường
                const dx = Math.abs(position.x - wall.x);
                const dy = Math.abs(position.y - wall.y);

                // Tổng kích thước hitbox (xe tăng + tường + vùng an toàn)
                const combinedWidth = (hitboxWidth / 2) + (wall.width / 2) + safeZoneSize;
                const combinedHeight = (hitboxHeight / 2) + (wall.height / 2) + safeZoneSize;

                // Kiểm tra va chạm "mở rộng" (bao gồm vùng an toàn)
                if (dx < combinedWidth && dy < combinedHeight) {
                    isOverlapping = true;
                }
            });
        }

        // Kiểm tra overlap với các player khác
        let overlapsWithPlayer = false;
        for (const id in self.playerSprites) {
            if (self.physics.overlap(tempSprite, self.playerSprites[id])) {
                overlapsWithPlayer = true;
                break;
            }
        }

        // Vị trí an toàn khi không bị chồng lấp với tường hoặc player khác
        safePosition = !isOverlapping && !overlapsWithPlayer;

        // Hủy sprite tạm
        tempSprite.destroy();

        // Log debug
        if (attempt % 5 === 0) {
            console.log(`[SAFE SPAWN] Đã thử ${attempt} vị trí, tiếp tục tìm kiếm...`);
        }

    } while (!safePosition && attempt < maxAttempts);

    // Nếu không tìm được vị trí an toàn sau nhiều lần thử, sử dụng một trong các vị trí cố định
    if (!safePosition) {
        console.log(`[SAFE SPAWN] Không tìm thấy vị trí ngẫu nhiên an toàn sau ${maxAttempts} lần thử. Sử dụng vị trí cố định.`);
        return safeCorners[Math.floor(Math.random() * safeCorners.length)];
    }

    console.log(`[SAFE SPAWN] Tìm thấy vị trí an toàn sau ${attempt} lần thử: (${position.x}, ${position.y})`);
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
window.placeBomb = function (x, y, ownerId) {
    return window.gameC.placeBomb(x, y, ownerId);
};
window.handleRemoteBombExplosion = function (data) {
    window.gameC.handleRemoteBombExplosion(data);
};
window.handleRemoteBombPlaced = function (data) {
    window.gameC.handleRemoteBombPlaced(data);
};
window.handleNewPowerup = function (powerup) {
    window.gameC.handleNewPowerup(powerup);
};
window.collectPowerup = function (powerupId) {
    window.gameC.collectPowerup(powerupId);
};