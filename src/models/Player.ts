export class Player {
  private _id: string;
  private _roomId: string;
  private _name: string;
  private _color: string;
  private _x!: number;
  private _y!: number;
  private _rotation: number = 0;
  private _score: number = 0;
  private _alive: boolean = true;
  private _powerup: string | null = null;
  private _ready: boolean = false;
  private _bulletCount: number = 0;
  private _lastPosition: { x: number, y: number } = { x: 0, y: 0 };
  private _lastRotation: number = 0;
  private _isHost: boolean = false; // Thêm thuộc tính này

  constructor(id: string, name: string, roomId: string) {
    this._id = id;
    this._roomId = roomId;
    this._name = name;
    this._color = "";
    this.spawn();
  }

  get id(): string {
    return this._id;
  }

  get roomId(): string {
    return this._roomId;
  }

  get name(): string {
    return this._name;
  }

  get color(): string {
    return this._color;
  }

  set color(value: string) {
    this._color = value;
  }

  get x(): number {
    return this._x;
  }

  set x(value: number) {
    this._lastPosition.x = this._x;
    this._x = value;
  }

  get y(): number {
    return this._y;
  }

  set y(value: number) {
    this._lastPosition.y = this._y;
    this._y = value;
  }

  get rotation(): number {
    return this._rotation;
  }

  set rotation(value: number) {
    this._lastRotation = this._rotation;
    this._rotation = value;
  }

  get score(): number {
    return this._score;
  }

  set score(value: number) {
    this._score = value;
  }

  get alive(): boolean {
    return this._alive;
  }

  set alive(value: boolean) {
    this._alive = value;
  }

  get powerup(): string | null {
    return this._powerup;
  }

  set powerup(value: string | null) {
    this._powerup = value;
  }

  get ready(): boolean {
    return this._ready;
  }

  set ready(value: boolean) {
    this._ready = value;
  }

  get bulletCount(): number {
    return this._bulletCount;
  }

  set bulletCount(value: number) {
    this._bulletCount = value;
  }

  get lastPosition(): { x: number, y: number } {
    return this._lastPosition;
  }

  get lastRotation(): number {
    return this._lastRotation;
  }

  get isHost(): boolean {
    return this._isHost;
  }

  set isHost(value: boolean) {
    this._isHost = value;
  }

  /**
   * Spawns the player at a random position on the map
   */
  spawn(): void {
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
  addScore(amount: number = 100): void {
    this._score += amount;
  }

  /**
   * Check if player has won the game
   * @param winScore Score needed to win (default: 1000)
   * @returns Boolean indicating if player has won
   */
  hasWon(winScore: number = 1000): boolean {
    return this._score >= winScore;
  }

  /**
   * Add a bullet to the player's bullet count
   * @returns Whether the bullet was successfully added
   */
  addBullet(): boolean {
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
  removeBullet(): boolean {
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