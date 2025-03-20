export class Powerup {
  private _id: string;
  private _type: string;
  private _x: number;
  private _y: number;
  private _rotation: number;
  private _active: boolean = true;
  private _createdAt: number;
  private _duration: number; // Thời gian hiệu lực khi người chơi nhặt được (ms)

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

  /**
   * Kiểm tra xem powerup đã hết hạn chưa (khi đặt trên bản đồ)
   * @param lifetime Thời gian tối đa powerup tồn tại trên bản đồ (ms)
   * @returns Boolean cho biết powerup đã hết hạn
   */
  isExpired(lifetime: number = 30000): boolean {
    return Date.now() - this._createdAt > lifetime;
  }

  /**
   * Lấy thời gian hiệu lực dựa theo loại powerup
   * @param type Loại powerup
   * @returns Thời gian hiệu lực (ms)
   */
  private getDurationByType(type: string): number {
    switch (type) {
      case 'gatling':
        return 8000; // 8 giây bắn nhanh
      case 'lazer':
        return 5000; // 5 giây laser bắn xuyên tường
      case 'shield':
        return 10000; // 10 giây khiên bảo vệ
      case 'speed':
        return 7000; // 7 giây tăng tốc
      case 'ray':
        return 3000; // 3 giây bắn tia
      case 'mine':
        return 20000; // 20 giây đặt mìn
      default:
        return 5000; // Mặc định 5 giây
    }
  }

  /**
   * Tạo hiệu ứng khi powerup được kích hoạt
   * @returns Object chứa thông tin hiệu ứng
   */
  activate(): any {
    this._active = false;
    
    // Tùy thuộc vào loại powerup, trả về thông tin hiệu ứng khác nhau
    switch (this._type) {
      case 'gatling':
        return { 
          type: 'gatling', 
          fireRate: 5, // Tốc độ bắn tăng gấp 5
          duration: this._duration 
        };
      case 'lazer':
        return { 
          type: 'lazer', 
          piercing: true, // Đạn xuyên tường
          duration: this._duration 
        };
      case 'shield':
        return { 
          type: 'shield', 
          invulnerable: true, // Không thể bị đạn tiêu diệt
          duration: this._duration 
        };
      case 'speed':
        return { 
          type: 'speed', 
          multiplier: 1.5, // Tốc độ di chuyển tăng 50%
          duration: this._duration 
        };
      case 'ray':
        return { 
          type: 'ray', 
          instantHit: true, // Bắn tia ngay lập tức
          duration: this._duration 
        };
      case 'mine':
        return { 
          type: 'mine', 
          mineCount: 3, // Số lượng mìn có thể đặt
          duration: this._duration 
        };
      default:
        return { 
          type: this._type, 
          duration: this._duration 
        };
    }
  }

  /**
   * Tạo powerup ngẫu nhiên tại vị trí xác định
   * @param x Tọa độ X
   * @param y Tọa độ Y
   * @returns Đối tượng Powerup mới
   */
  static createRandom(x: number, y: number): Powerup {
    const types = ['gatling', 'lazer', 'shield', 'speed', 'ray', 'mine'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    return new Powerup(x, y, randomType);
  }

  /**
   * Tạo powerup ngẫu nhiên tại vị trí ngẫu nhiên trong map
   * @param mapWidth Chiều rộng map
   * @param mapHeight Chiều cao map
   * @param safeDistance Khoảng cách an toàn từ biên (mặc định: 50)
   * @returns Đối tượng Powerup mới
   */
  static createRandomPosition(mapWidth: number, mapHeight: number, safeDistance: number = 50): Powerup {
    const x = Math.random() * (mapWidth - 2 * safeDistance) + safeDistance;
    const y = Math.random() * (mapHeight - 2 * safeDistance) + safeDistance;
    return Powerup.createRandom(x, y);
  }

  /**
   * Chuyển đổi thành JSON để gửi qua socket
   */
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