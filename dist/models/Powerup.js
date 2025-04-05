"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Powerup = void 0;
class Powerup {
    _id;
    _type;
    _x;
    _y;
    _rotation;
    _active = true;
    _createdAt;
    _duration;
    constructor(x, y, type) {
        this._id = `powerup_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        this._x = x;
        this._y = y;
        this._type = type;
        this._rotation = Math.random() * 360;
        this._createdAt = Date.now();
        this._duration = this.getDurationByType(type);
    }
    get id() {
        return this._id;
    }
    get type() {
        return this._type;
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    get rotation() {
        return this._rotation;
    }
    set rotation(value) {
        this._rotation = value;
    }
    get active() {
        return this._active;
    }
    set active(value) {
        this._active = value;
    }
    get createdAt() {
        return this._createdAt;
    }
    get duration() {
        return this._duration;
    }
    isExpired(lifetime = 30000) {
        return Date.now() - this._createdAt > lifetime;
    }
    getDurationByType(type) {
        switch (type) {
            case 'gatling':
                return 8000;
            case 'lazer':
                return 5000;
            case 'shield':
                return 10000;
            case 'speed':
                return 7000;
            case 'ray':
                return 3000;
            case 'mine':
                return 20000;
            default:
                return 5000;
        }
    }
    activate() {
        this._active = false;
        switch (this._type) {
            case 'gatling':
                return {
                    type: 'gatling',
                    fireRate: 5,
                    duration: this._duration
                };
            case 'lazer':
                return {
                    type: 'lazer',
                    piercing: true,
                    duration: this._duration
                };
            case 'shield':
                return {
                    type: 'shield',
                    invulnerable: true,
                    duration: this._duration
                };
            case 'speed':
                return {
                    type: 'speed',
                    multiplier: 1.5,
                    duration: this._duration
                };
            case 'ray':
                return {
                    type: 'ray',
                    instantHit: true,
                    duration: this._duration
                };
            case 'mine':
                return {
                    type: 'mine',
                    mineCount: 3,
                    duration: this._duration
                };
            default:
                return {
                    type: this._type,
                    duration: this._duration
                };
        }
    }
    static createRandom(x, y) {
        const types = ['gatling', 'lazer', 'shield', 'speed', 'ray', 'mine'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        return new Powerup(x, y, randomType);
    }
    static createRandomPosition(mapWidth, mapHeight, safeDistance = 50) {
        const x = Math.random() * (mapWidth - 2 * safeDistance) + safeDistance;
        const y = Math.random() * (mapHeight - 2 * safeDistance) + safeDistance;
        return Powerup.createRandom(x, y);
    }
    toJSON() {
        return {
            id: this._id,
            type: this._type,
            x: this._x,
            y: this._y,
            rotation: this._rotation,
            active: this._active,
            duration: this._duration
        };
    }
}
exports.Powerup = Powerup;
