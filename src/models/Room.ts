import { Server, Socket } from 'socket.io';
import { Player } from './Player';
import { Powerup } from './Powerup';
import { generateBoard } from '../server/map';

export class Room {
  private _id: string;
  private _players: Player[] = [];
  private _round: number = 1;
  private _highScorePlayer: string = '';
  private _map: any; // Bản đồ ngẫu nhiên
  private _gameInProgress: boolean = false;
  private _powerups: Powerup[] = [];
  private _powerupInterval: NodeJS.Timeout | null = null;
  private _inCheckFunc: number = 0;
  private _socket: Socket;
  private _io: Server;
  private _settings: {
    maxPlayers: number; 
    maxBullets: number;
    pointsToWin: number;
  };

  constructor(id: string, io: Server, socket: Socket, settings: any, type: string) {
    this._id = id;
    this._io = io;
    this._socket = socket;
    this._settings = settings;
    this._map = this.generateRandomMap(type);
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get players(): Player[] {
    return this._players;
  }

  get round(): number {
    return this._round;
  }

  get map(): any {
    return this._map;
  }

  get highScorePlayer(): string {
    return this._highScorePlayer;
  }

  get gameInProgress(): boolean {
    return this._gameInProgress;
  }

  set gameInProgress(value: boolean) {
    this._gameInProgress = value;
  }

  // Quản lý người chơi
  newPlayer(id: string, name: string): void {
    // Kiểm tra số lượng người chơi tối đa
    if (this._players.length >= this._settings.maxPlayers) {
      return;
    }
    
    // Tạo người chơi mới
    const player = new Player(id, name, this._id);
    
    // Thiết lập màu sắc
    this.setColor(player);
    
    // Thêm vào danh sách người chơi
    this._players.push(player);
    
    // Thông báo cho người chơi khác
    this._socket.broadcast.to(this._id).emit('newPlayer', { 
      player: player, 
      index: this.players.length 
    });
    
    // Thông báo vị trí người chơi
    this._socket.emit('playerLocation', this._players);
    
    // Cập nhật người chơi điểm cao nhất
    this.updateHighScorePlayer();
  }

  getPlayerIndex(id: string): number {
    for (let i = 0; i < this.players.length; i++) {
      if (id === this.players[i].id) {
        return i;
      }
    }
    return -1;
  }

  removePlayer(id: string): void {
    const index = this.getPlayerIndex(id);
    if (index !== -1) {
      this._players.splice(index, 1);
      this.updateHighScorePlayer();
    }
  }

  // Thiết lập màu sắc cho người chơi
  setColor(player: Player): void {
    const possible = ["red", "yellow", "green", "blue"];
    
    // Lọc các màu đã được sử dụng
    const usedColors: string[] = this._players.map(p => p.color);
    const availableColors = possible.filter(color => !usedColors.includes(color));
    
    // Nếu còn màu trống, gán màu cho người chơi
    if (availableColors.length > 0) {
      player.color = availableColors[0];
    } else {
      // Mặc định nếu hết màu
      player.color = "purple";
    }
  }

  // Quản lý vòng chơi
  checkNewRound(type: string): void {
    let alivePlayers = 0;
    for (const p of this.players) {
      if (p.alive) {
        ++alivePlayers;
      }
    }

    if (alivePlayers <= 1) {
      ++this._inCheckFunc;
      setTimeout(() => {
        if (this._inCheckFunc > 1) {
          --this._inCheckFunc;
          return;
        }

        // Cộng điểm cho người thắng
        for (const p of this.players) {
          if (p.alive) {
            const playerIndex = this._players.indexOf(p);
            this._players[playerIndex].score += 100;
            
            // Kiểm tra điều kiện thắng
            if (this._players[playerIndex].score >= this._settings.pointsToWin) {
              this._io.to(this._id).emit('gameOver', {
                winner: this._players[playerIndex],
                players: this._players
              });
              
              // Dọn dẹp phòng hoặc chuẩn bị vòng mới
              this.prepareNewGame();
              return;
            }
          }
        }

        this.newRound(type);
        --this._inCheckFunc;
      }, 5000);
    }
  }

  newRound(type: string): void {
    ++this._round;
    
    // Tạo bản đồ mới
    this._map = this.generateRandomMap(type);
    
    // Đặt lại trạng thái người chơi
    for (const p of this._players) {
      p.spawn();
    }
    
    // Xóa tất cả powerups hiện tại
    this._powerups = [];
    
    // Thông báo vòng mới
    this._io.to(this._id).emit('newRound', {
      round: this._round,
      map: this._map,
      players: this._players
    });
  }

  // Quản lý powerup
  powerupSpawner(): void {
    if (this._powerupInterval) {
      clearInterval(this._powerupInterval);
    }
    
    this._powerupInterval = setInterval(() => {
      // Giới hạn số lượng powerup trên bản đồ
      if (this._powerups.length < 3) {
        const powerup = this.createRandomPowerup();
        this._powerups.push(powerup);
        this._io.to(this._id).emit('newPowerup', powerup);
      }
    }, 10000); // Tạo powerup mới mỗi 10 giây
  }

  createRandomPowerup(): any {
    // Logic tạo powerup ngẫu nhiên
    const types = ['gatling', 'lazer', 'shield', 'speed'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    return {
      x: Math.floor(Math.random() * 800),
      y: Math.floor(Math.random() * 600),
      type: randomType,
      id: `powerup_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };
  }

  removePowerup(id: string): void {
    const index = this._powerups.findIndex(p => p.id === id);
    if (index !== -1) {
      this._powerups.splice(index, 1);
    }
  }

  // Chuẩn bị trò chơi mới
  prepareNewGame(): void {
    this._round = 1;
    this._gameInProgress = false;
    
    // Reset điểm số người chơi
    for (const p of this._players) {
      p.score = 0;
      p.alive = true;
      p.ready = false;
    }
    
    // Thông báo chuẩn bị trò chơi mới
    this._io.to(this._id).emit('prepareNewGame', {
      roomId: this._id,
      players: this._players
    });
  }

  // Cập nhật người chơi điểm cao nhất
  updateHighScorePlayer(): void {
    if (this._players.length === 0) {
      this._highScorePlayer = '';
      return;
    }
    
    let maxScore = -1;
    let maxScorePlayer = '';
    
    for (const player of this._players) {
      if (player.score > maxScore) {
        maxScore = player.score;
        maxScorePlayer = player.name;
      }
    }
    
    this._highScorePlayer = maxScorePlayer;
  }

  // Tạo bản đồ ngẫu nhiên
  private generateRandomMap(type: string): any {
    // Gọi hàm generateBoard từ module map.ts
    const board = generateBoard(type);
    
    // Chuyển đổi board thành định dạng map mà game cần
    const walls: { x: number, y: number, width: number, height: number }[] = [];
    const spawns: { x: number, y: number }[] = [];
    
    // Kích thước một ô trên bản đồ game
    const tileSize = 68;
    
    // Duyệt qua tất cả các ô của bản đồ
    for (let i = 0; i < board.length; i++) {
      const cell = board[i];
      const x = (cell.col - 1) * tileSize;
      const y = (cell.row - 1) * tileSize;
      
      // Thêm tường nếu có
      // Tường phía trên
      if (cell.top) {
        walls.push({
          x: x,
          y: y,
          width: tileSize,
          height: 4 // Độ dày của tường
        });
      }
      
      // Tường bên trái
      if (cell.left) {
        walls.push({
          x: x,
          y: y,
          width: 4, // Độ dày của tường
          height: tileSize
        });
      }
      
      // Tường phía dưới - chỉ cần thêm cho hàng cuối
      if (cell.row === 10 && cell.bottom) {
        walls.push({
          x: x,
          y: y + tileSize - 4,
          width: tileSize,
          height: 4
        });
      }
      
      // Tường bên phải - chỉ cần thêm cho cột cuối
      if (cell.col === 10 && cell.right) {
        walls.push({
          x: x + tileSize - 4,
          y: y,
          width: 4,
          height: tileSize
        });
      }
    }
    
    // Tạo các điểm xuất hiện ngẫu nhiên cho người chơi
    // Đảm bảo điểm xuất hiện không nằm trên tường
    const spawnPositions = [
      { row: 1, col: 1 }, // Góc trên bên trái
      { row: 1, col: 10 }, // Góc trên bên phải
      { row: 10, col: 1 }, // Góc dưới bên trái
      { row: 10, col: 10 } // Góc dưới bên phải
    ];
    
    for (const pos of spawnPositions) {
      spawns.push({
        x: (pos.col - 1) * tileSize + tileSize / 2,
        y: (pos.row - 1) * tileSize + tileSize / 2
      });
    }
    
    return {
      walls,
      spawns,
      board, // Lưu lại board gốc để có thể sử dụng sau này
      size: {
        width: 10 * tileSize,
        height: 10 * tileSize
      }
    };
  }

  // Chuyển đổi thành JSON để gửi qua socket
  toJSON() {
    return {
      id: this._id,
      players: this._players,
      round: this._round,
      highScorePlayer: this._highScorePlayer,
      map: this._map,
      gameInProgress: this._gameInProgress,
      powerups: this._powerups
    };
  }
}