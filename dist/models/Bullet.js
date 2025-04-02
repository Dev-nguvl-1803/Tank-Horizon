"use strict";
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
    constructor(x, y, angle, roomId, ownerId, powerup = null) {
        this._x = x + 8 * Math.cos(angle * Math.PI / 180);
        this._y = y + 8 * Math.sin(angle * Math.PI / 180);
        this._velocityX = Math.cos(angle * Math.PI / 180);
        this._velocityY = Math.sin(angle * Math.PI / 180);
        this._angle = angle;
        this._roomId = roomId;
        this._ownerId = ownerId;
        this._powerup = powerup;
        this._id = this.generateBulletId();
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
    get y() {
        return this._y;
    }
    get velocityX() {
        return this._velocityX;
    }
    get velocityY() {
        return this._velocityY;
    }
    get angle() {
        return this._angle;
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
    // Phương thức để chuyển đối tượng thành JSON an toàn cho gửi qua socket
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
            powerup: this._powerup
        };
    }
}
exports.Bullet = Bullet;
