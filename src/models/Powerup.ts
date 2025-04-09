export class Powerup {
  private _id: string;
  private _type: string;
  private _x: number;
  private _y: number;
  private _rotation: number;
  private _active: boolean = true;
  private _createdAt: number;
  private _duration: number;

  constructor(x: number, y: number, type: string) {
    this._id = `powerup_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this._x = x;
    this._y = y;
    this._type = type;
    this._rotation = Math.random() * 360;
    this._createdAt = Date.now();
    this._duration = this.getDurationByType(type);
  }

  get id(): string {
    return this._id;
  }

  get type(): string {
    return this._type;
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  get rotation(): number {
    return this._rotation;
  }

  set rotation(value: number) {
    this._rotation = value;
  }

  get active(): boolean {
    return this._active;
  }

  set active(value: boolean) {
    this._active = value;
  }

  get createdAt(): number {
    return this._createdAt;
  }

  get duration(): number {
    return this._duration;
  }

  isExpired(lifetime: number = 30000): boolean {
    return Date.now() - this._createdAt > lifetime;
  }

  private getDurationByType(type: string): number {
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

  activate(): any {
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

  static createRandom(x: number, y: number): Powerup {
    const types = ['gatling', 'lazer', 'shield', 'speed', 'ray', 'mine'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    return new Powerup(x, y, randomType);
  }

  static createRandomPosition(mapWidth: number, mapHeight: number, safeDistance: number = 50): Powerup {
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