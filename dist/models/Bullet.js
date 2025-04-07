"use strict";
/**
 * Bullet class representing a bullet in the game:
 * - _x: x-coordinate of the bullet
 * - _y: y-coordinate of the bullet
 * - _velocityX: x-component of the bullet's velocity
 * - _velocityY: y-component of the bullet's velocity
 * - _angle: angle of the bullet in degrees
 * - _roomId: ID of the room the bullet belongs to
 * - _ownerId: ID of the player who fired the bullet
 * - _powerup: type of powerup associated with the bullet (if any)
 * - _id: unique identifier for the bullet
 * * - _createdAt: timestamp when the bullet was created
 * * - _size: size of the bullet (default is 8)
 * * - _speed: speed of the bullet (default is 5)
 * * - _maxBounces: maximum number of bounces allowed (default is 2)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bullet = void 0;
class Bullet {
    _x;
    _y;
    _velocityX;
    _velocityY;
    _angle;
    _roomId;
    _ownerId;
    _powerup;
    _id;
    _createdAt;
    _size = 8;
    _speed = 5;
    _maxBounces = 2;
    _lifetime = 5000;
    constructor(x, y, angle, roomId, ownerId, powerup = null) {
        this._x = x + 8 * Math.cos(angle * Math.PI / 180);
        this._y = y + 8 * Math.sin(angle * Math.PI / 180);
        this._velocityX = this._speed * Math.cos(angle * Math.PI / 180);
        this._velocityY = this._speed * Math.sin(angle * Math.PI / 180);
        this._angle = angle;
        this._roomId = roomId;
        this._ownerId = ownerId;
        this._powerup = powerup;
        this._id = this.generateBulletId();
        this._createdAt = Date.now();
        if (powerup === 'lazer') {
            this._speed = 8;
            this._maxBounces = 0;
        }
        else if (powerup === 'gatling') {
            this._lifetime = 3000;
        }
    }
    generateBulletId() {
        return `bullet_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    get id() {
        return this._id;
    }
    get x() {
        return this._x;
    }
    set x(value) {
        this._x = value;
    }
    get y() {
        return this._y;
    }
    set y(value) {
        this._y = value;
    }
    get velocityX() {
        return this._velocityX;
    }
    set velocityX(value) {
        this._velocityX = value;
    }
    get velocityY() {
        return this._velocityY;
    }
    set velocityY(value) {
        this._velocityY = value;
    }
    get angle() {
        return this._angle;
    }
    set angle(value) {
        this._angle = value;
    }
    get roomId() {
        return this._roomId;
    }
    get ownerId() {
        return this._ownerId;
    }
    get powerup() {
        return this._powerup;
    }
    get size() {
        return this._size;
    }
    get speed() {
        return this._speed;
    }
    get maxBounces() {
        return this._maxBounces;
    }
    get createdAt() {
        return this._createdAt;
    }
    get lifetime() {
        return this._lifetime;
    }
    get timeRemaining() {
        return Math.max(0, this._lifetime - (Date.now() - this._createdAt));
    }
    isExpired() {
        return (Date.now() - this._createdAt) >= this._lifetime;
    }
    update() {
        this._x += this._velocityX;
        this._y += this._velocityY;
    }
    toJSON() {
        return {
            id: this._id,
            x: this._x,
            y: this._y,
            velocityX: this._velocityX,
            velocityY: this._velocityY,
            angle: this._angle,
            roomId: this._roomId,
            ownerId: this._ownerId,
            powerup: this._powerup,
            size: this._size,
            timeRemaining: this.timeRemaining
        };
    }
}
exports.Bullet = Bullet;
