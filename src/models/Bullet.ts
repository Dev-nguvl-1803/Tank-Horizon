export class Bullet {
    private _x: number;
    private _y: number;
    private _velocityX: number;
    private _velocityY: number;
    private _angle: number;
    private _roomId: string;
    private _ownerId: string;
    private _powerup: string | null;
    private _id: string;
  
    constructor(x: number, y: number, angle: number, roomId: string, ownerId: string, powerup: string | null = null) {
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
  
    private generateBulletId(): string {
      return `bullet_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
  
    get id(): string {
      return this._id;
    }
  
    get x(): number {
      return this._x;
    }
  
    get y(): number {
      return this._y;
    }
  
    get velocityX(): number {
      return this._velocityX;
    }
  
    get velocityY(): number {
      return this._velocityY;
    }
  
    get angle(): number {
      return this._angle;
    }
  
    get roomId(): string {
      return this._roomId;
    }
  
    get ownerId(): string {
      return this._ownerId;
    }
  
    get powerup(): string | null {
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