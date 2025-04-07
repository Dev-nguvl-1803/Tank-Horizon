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
    private _createdAt: number;
    private _size: number = 8;
    private _speed: number = 5; 
    private _maxBounces: number = 2;
    private _lifetime: number = 5000; 
  
    constructor(x: number, y: number, angle: number, roomId: string, ownerId: string, powerup: string | null = null) {
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
      } else if (powerup === 'gatling') {
        this._lifetime = 3000; 
      }
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
    
    set x(value: number) {
      this._x = value;
    }
  
    get y(): number {
      return this._y;
    }
    
    set y(value: number) {
      this._y = value;
    }
  
    get velocityX(): number {
      return this._velocityX;
    }
    
    set velocityX(value: number) {
      this._velocityX = value;
    }
  
    get velocityY(): number {
      return this._velocityY;
    }
    
    set velocityY(value: number) {
      this._velocityY = value;
    }
  
    get angle(): number {
      return this._angle;
    }
    
    set angle(value: number) {
      this._angle = value;
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
    
    get size(): number {
      return this._size;
    }
    
    get speed(): number {
      return this._speed;
    }
    
    get maxBounces(): number {
      return this._maxBounces;
    }
    
    get createdAt(): number {
      return this._createdAt;
    }
    
    get lifetime(): number {
      return this._lifetime;
    }
    
    get timeRemaining(): number {
      return Math.max(0, this._lifetime - (Date.now() - this._createdAt));
    }
    
    isExpired(): boolean {
      return (Date.now() - this._createdAt) >= this._lifetime;
    }
    
    update(): void {
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