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
    _createdAt;
    _size = 8;
    _speed = 5;
    _bounceCount = 0;
    _maxBounces = 2; // Maximum number of times a bullet can bounce
    _lifetime = 5000; // Bullet lives for 5 seconds by default
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
        // Adjust based on powerup
        if (powerup === 'lazer') {
            this._speed = 8;
            this._maxBounces = 0; // Laser doesn't bounce
        }
        else if (powerup === 'gatling') {
            this._lifetime = 3000; // Gatling bullets are short-lived
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
    get bounceCount() {
        return this._bounceCount;
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
    /**
     * Check if the bullet's lifetime has expired
     */
    isExpired() {
        return (Date.now() - this._createdAt) >= this._lifetime;
    }
    /**
     * Check if the bullet can still bounce
     */
    canBounce() {
        return this._bounceCount < this._maxBounces;
    }
    /**
     * Bounce the bullet off a wall
     * @param wallType 'horizontal' for top/bottom walls or 'vertical' for left/right walls
     */
    bounce(wallType) {
        if (this.canBounce()) {
            if (wallType === 'horizontal') {
                // Bounce off horizontal wall (top/bottom) - reverse Y velocity
                this._velocityY = -this._velocityY;
            }
            else {
                // Bounce off vertical wall (left/right) - reverse X velocity
                this._velocityX = -this._velocityX;
            }
            // Update angle based on new velocity
            this._angle = Math.atan2(this._velocityY, this._velocityX) * 180 / Math.PI;
            this._bounceCount++;
        }
    }
    /**
     * Update the bullet's position based on its velocity
     */
    update() {
        this._x += this._velocityX;
        this._y += this._velocityY;
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
            powerup: this._powerup,
            size: this._size,
            bounceCount: this._bounceCount,
            timeRemaining: this.timeRemaining
        };
    }
    // Kiểm tra va chạm với tường
    checkWallCollision(walls) {
        // Kích thước hitbox đạn
        const bulletSize = this._size;
        for (const wall of walls) {
            // Kiểm tra va chạm giữa đạn và tường
            if (this.rectIntersect(this._x - bulletSize / 2, this._y - bulletSize / 2, bulletSize, bulletSize, wall.x, wall.y, wall.width, wall.height)) {
                // Xác định loại tường (ngang hoặc dọc) dựa vào kích thước
                const wallType = wall.width > wall.height ? 'horizontal' : 'vertical';
                // Xử lý phản xạ nếu đạn còn có thể nảy
                if (this.canBounce()) {
                    this.bounce(wallType);
                    // Đẩy đạn ra khỏi tường một chút để tránh bị kẹt
                    if (wallType === 'horizontal') {
                        this._y += (this._velocityY > 0 ? -1 : 1) * 2;
                    }
                    else {
                        this._x += (this._velocityX > 0 ? -1 : 1) * 2;
                    }
                    return true;
                }
            }
        }
        return false;
    }
    // Kiểm tra va chạm giữa hai hình chữ nhật
    rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
        return !(x1 + w1 <= x2 ||
            x2 + w2 <= x1 ||
            y1 + h1 <= y2 ||
            y2 + h2 <= y1);
    }
    // Kiểm tra va chạm với player
    checkPlayerCollision(players) {
        const bulletSize = this._size;
        for (const player of players) {
            // Bỏ qua va chạm với chính người bắn đạn
            if (player.id === this._ownerId || !player.alive)
                continue;
            // Kiểm tra va chạm với hitbox của player
            const playerHitboxSize = 24; // Kích thước hitbox của tank
            if (this.rectIntersect(this._x - bulletSize / 2, this._y - bulletSize / 2, bulletSize, bulletSize, player.x - playerHitboxSize / 2, player.y - playerHitboxSize / 2, playerHitboxSize, playerHitboxSize)) {
                return player.id; // Trả về ID của người chơi bị trúng đạn
            }
        }
        return null;
    }
}
exports.Bullet = Bullet;
