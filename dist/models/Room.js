"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const Player_1 = require("./Player");
const map_1 = require("../server/map");
/**
 * Responder:
 * - _id roomId
 * - _players players storage
 * - _round current round number
 * - _highScorePlayer player with the highest score
 * - _map current game map
 * - _gameInProgress indicates if the game is ongoing
 * - _powerups active powerups in the game
 * - _powerupInterval interval for spawning powerups
 * - _isResetting indicates if the game is resetting
 * - _socket socket connection for the room
 * - _io server instance for the room
 * - _settings game settings configuration
 *
 * -> Room đóng 2 vai trò (Tính lưu trữ + Tính xử lý):
 *    + Lưu trữ thông tin phòng
 *    + Lưu trữ thông tin người chơi
 *
 *    + Xử lý bản đồ (generate map, draw walls)
 *    + Xử lý KHỞI TẠO player (score, color, alive status, score)
 *    + Xử lý trận đấu (round counter, reset game, prepare new game)
*/
class Room {
    _id;
    _players = [];
    _round = 1;
    _highScorePlayer = '';
    _map;
    _gameInProgress = false;
    _powerups = [];
    _powerupInterval = null;
    _isResetting = false;
    _socket;
    _io;
    _settings;
    constructor(id, io, socket, settings, type) {
        this._id = id;
        this._io = io;
        this._socket = socket;
        this._settings = settings;
        this._map = this.generateRandomMap(type);
    }
    get id() {
        return this._id;
    }
    get players() {
        return this._players;
    }
    get round() {
        return this._round;
    }
    get map() {
        return this._map;
    }
    get highScorePlayer() {
        return this._highScorePlayer;
    }
    get gameInProgress() {
        return this._gameInProgress;
    }
    set gameInProgress(value) {
        this._gameInProgress = value;
    }
    newPlayer(id, name) {
        if (this._players.length >= this._settings.maxPlayers) {
            return;
        }
        const player = new Player_1.Player(id, name, this._id);
        this.setColor(player);
        this._players.push(player);
        this._socket.broadcast.to(this._id).emit('newPlayer', {
            player: player,
            index: this.players.length
        });
        this._socket.emit('playerLocation', this._players);
        this.updateHighScorePlayer();
    }
    getPlayerIndex(id) {
        for (let i = 0; i < this.players.length; i++) {
            if (id === this.players[i].id) {
                return i;
            }
        }
        return -1;
    }
    removePlayer(id) {
        const index = this.getPlayerIndex(id);
        if (index !== -1) {
            this._players.splice(index, 1);
            this.updateHighScorePlayer();
        }
    }
    setColor(player) {
        const possible = ["red", "yellow", "green", "blue"];
        const usedColors = this._players.map(p => p.color);
        const availableColors = possible.filter(color => !usedColors.includes(color));
        if (availableColors.length > 0) {
            player.color = availableColors[0];
        }
        else {
            player.color = "purple";
        }
    }
    powerupSpawner() {
        if (this._powerupInterval) {
            clearInterval(this._powerupInterval);
        }
        this._powerupInterval = setInterval(() => {
            if (this._powerups.length < 3) {
                const powerup = this.createRandomPowerup();
                this._powerups.push(powerup);
                this._io.to(this._id).emit('newPowerup', powerup);
            }
        }, 10000);
    }
    createRandomPowerup() {
        const types = ['gatling', 'lazer', 'shield', 'speed'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        return {
            x: Math.floor(Math.random() * 800),
            y: Math.floor(Math.random() * 600),
            type: randomType,
            id: `powerup_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        };
    }
    removePowerup(id) {
        const index = this._powerups.findIndex(p => p.id === id);
        if (index !== -1) {
            this._powerups.splice(index, 1);
        }
    }
    prepareNewGame() {
        if (this._isResetting) {
            console.log('Reset already in progress, skipping...');
            return;
        }
        this._isResetting = true;
        this._round += 1;
        this._gameInProgress = false;
        const newMap = this.generateRandomMap("ok");
        this._map = newMap;
        for (const p of this._players) {
            p.alive = true;
            p.ready = false;
        }
        // Emit drawBoard event to ensure map synchronization
        this._io.to(this._id).emit('prepareNewGame', {
            roomId: this._id,
            players: this._players.map(p => p.toJSON()),
            map: this._map,
            round: this._round
        });
        for (let i = 0; i < 1; i++) {
            this._io.to(this._id).emit('drawBoard', this._map);
        }
        setTimeout(() => {
            this._isResetting = false;
            console.log("Reset flag cleared");
        }, 1000);
    }
    updateHighScorePlayer() {
        if (this._players.length === 0) {
            this._highScorePlayer = '';
            return;
        }
        let maxScore = -1;
        let maxScorePlayer = '';
        for (const player of this._players) {
            if (player.score > maxScore) {
                maxScore = player.score;
                maxScorePlayer = player.name;
            }
        }
        this._highScorePlayer = maxScorePlayer;
    }
    generateRandomMap(type) {
        const board = (0, map_1.generateBoard)(type);
        const walls = [];
        const spawns = [];
        const tileSize = 68;
        for (let i = 0; i < board.length; i++) {
            const cell = board[i];
            const x = (cell.col - 1) * tileSize;
            const y = (cell.row - 1) * tileSize;
            if (cell.top) {
                walls.push({
                    x: x,
                    y: y,
                    width: tileSize,
                    height: 4
                });
            }
            if (cell.left) {
                walls.push({
                    x: x,
                    y: y,
                    width: 4,
                    height: tileSize
                });
            }
            if (cell.row === 10 && cell.bottom) {
                walls.push({
                    x: x,
                    y: y + tileSize - 4,
                    width: tileSize,
                    height: 4
                });
            }
            if (cell.col === 10 && cell.right) {
                walls.push({
                    x: x + tileSize - 4,
                    y: y,
                    width: 4,
                    height: tileSize
                });
            }
        }
        const spawnPositions = [
            { row: 1, col: 1 },
            { row: 1, col: 10 },
            { row: 10, col: 1 },
            { row: 10, col: 10 }
        ];
        for (const pos of spawnPositions) {
            spawns.push({
                x: (pos.col - 1) * tileSize + tileSize / 2,
                y: (pos.row - 1) * tileSize + tileSize / 2
            });
        }
        return {
            walls,
            board,
            size: {
                width: 10 * tileSize,
                height: 10 * tileSize
            }
        };
    }
    toJSON() {
        return {
            id: this._id,
            players: this._players,
            round: this._round,
            highScorePlayer: this._highScorePlayer,
            map: this._map,
            gameInProgress: this._gameInProgress,
            powerups: this._powerups
        };
    }
    isResetting() {
        return this._isResetting;
    }
}
exports.Room = Room;
