"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
class Player {
    _id;
    _roomId;
    _name;
    _color;
    _x;
    _y;
    _rotation = 0;
    _score = 0;
    _alive = true;
    _powerup = null;
    _ready = false;
    _bulletCount = 0;
    _lastPosition = { x: 0, y: 0 };
    _lastRotation = 0;
    _isHost = false; // Thêm thuộc tính này
    constructor(id, name, roomId) {
        this._id = id;
        this._roomId = roomId;
        this._name = name;
        this._color = "";
        this.spawn();
    }
    get id() {
        return this._id;
    }
    get roomId() {
        return this._roomId;
    }
    get name() {
        return this._name;
    }
    get color() {
        return this._color;
    }
    set color(value) {
        this._color = value;
    }
    get x() {
        return this._x;
    }
    set x(value) {
        this._lastPosition.x = this._x;
        this._x = value;
    }
    get y() {
        return this._y;
    }
    set y(value) {
        this._lastPosition.y = this._y;
        this._y = value;
    }
    get rotation() {
        return this._rotation;
    }
    set rotation(value) {
        this._lastRotation = this._rotation;
        this._rotation = value;
    }
    get score() {
        return this._score;
    }
    set score(value) {
        this._score = value;
    }
    get alive() {
        return this._alive;
    }
    set alive(value) {
        this._alive = value;
    }
    get powerup() {
        return this._powerup;
    }
    set powerup(value) {
        this._powerup = value;
    }
    get ready() {
        return this._ready;
    }
    set ready(value) {
        this._ready = value;
    }
    get bulletCount() {
        return this._bulletCount;
    }
    set bulletCount(value) {
        this._bulletCount = value;
    }
    get lastPosition() {
        return this._lastPosition;
    }
    get lastRotation() {
        return this._lastRotation;
    }
    get isHost() {
        return this._isHost;
    }
    set isHost(value) {
        this._isHost = value;
    }
    /**
     * Spawns the player at a random position on the map
     */
    spawn() {
        this._x = Math.floor(Math.random() * 10 + 1) * 68;
        this._y = Math.floor(Math.random() * 10 + 1) * 68;
        this._rotation = Math.floor(Math.random() * 4) * 90;
        this._alive = true;
        this._powerup = null;
        this._bulletCount = 0;
        this._lastPosition = { x: this._x, y: this._y };
        this._lastRotation = this._rotation;
    }
    /**
     * Increases player score
     * @param amount Amount to add to score
     */
    addScore(amount = 100) {
        this._score += amount;
    }
    /**
     * Check if player has won the game
     * @param winScore Score needed to win (default: 1000)
     * @returns Boolean indicating if player has won
     */
    hasWon(winScore = 1000) {
        return this._score >= winScore;
    }
    /**
     * Add a bullet to the player's bullet count
     * @returns Whether the bullet was successfully added
     */
    addBullet() {
        if (this._bulletCount < 5) {
            this._bulletCount++;
            return true;
        }
        return false;
    }
    /**
     * Remove a bullet from the player's bullet count
     * @returns Whether the bullet was successfully removed
     */
    removeBullet() {
        if (this._bulletCount > 0) {
            this._bulletCount--;
            return true;
        }
        return false;
    }
    /**
     * Convert object to JSON for socket communication
     */
    toJSON() {
        return {
            id: this._id,
            roomId: this._roomId,
            name: this._name,
            color: this._color,
            x: this._x,
            y: this._y,
            rotation: this._rotation,
            score: this._score,
            alive: this._alive,
            powerup: this._powerup,
            ready: this._ready,
            bulletCount: this._bulletCount,
            isHost: this._isHost
        };
    }
}
exports.Player = Player;
