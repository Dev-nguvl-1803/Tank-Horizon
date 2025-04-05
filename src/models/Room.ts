import { Server, Socket } from 'socket.io';
import { Player } from './Player';
import { Powerup } from './Powerup';
import { generateBoard } from '../server/map';
import { Bullet } from './Bullet';

/**
 * Responder:
 * - _id roomId
 * - _players players storage
 * - _round current round number
 * - _highScorePlayer player with the highest score
 * - _map current game map
 * - _gameInProgress indicates if the game is ongoing
 * - _powerups active powerups in the game
 * - _powerupInterval interval for spawning powerups 
 * - _isResetting indicates if the game is resetting
 * - _socket socket connection for the room
 * - _io server instance for the room
 * - _settings game settings configuration
 * 
 * -> Room đóng 2 vai trò (Tính lưu trữ + Tính xử lý):
 *    + Lưu trữ thông tin phòng
 *    + Lưu trữ thông tin người chơi
 * 
 *    + Xử lý bản đồ (generate map, draw walls)
 *    + Xử lý KHỞI TẠO player (score, color, alive status, score)
 *    + Xử lý trận đấu (round counter, reset game, prepare new game)
*/

export class Room {
  private _id: string;
  private _players: Player[] = [];
  private _round: number = 1;
  private _highScorePlayer: string = '';
  private _map: any;
  private _gameInProgress: boolean = false;
  private _powerups: Powerup[] = [];
  private _powerupInterval: NodeJS.Timeout | null = null;
  private _isResetting: boolean = false;
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

  newPlayer(id: string, name: string): void {

    if (this._players.length >= this._settings.maxPlayers) {
      return;
    }


    const player = new Player(id, name, this._id);


    this.setColor(player);


    this._players.push(player);


    this._socket.broadcast.to(this._id).emit('newPlayer', {
      player: player,
      index: this.players.length
    });


    this._socket.emit('playerLocation', this._players);


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


  setColor(player: Player): void {
    const possible = ["red", "yellow", "green", "blue"];


    const usedColors: string[] = this._players.map(p => p.color);
    const availableColors = possible.filter(color => !usedColors.includes(color));


    if (availableColors.length > 0) {
      player.color = availableColors[0];
    } else {

      player.color = "purple";
    }
  }


  powerupSpawner(): void {
    if (this._powerupInterval) {
      clearInterval(this._powerupInterval);
    }

    this._powerupInterval = setInterval(() => {

      if (this._powerups.length < 3) {
        const powerup = this.createRandomPowerup();
        this._powerups.push(powerup);
        this._io.to(this._id).emit('newPowerup', powerup);
      }
    }, 10000);
  }

  createRandomPowerup(): any {

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


  prepareNewGame(): void {

    if (this._isResetting) {
      console.log('Reset already in progress, skipping...');
      return;
    }

    this._isResetting = true;
    this._round += 1;
    this._gameInProgress = false;


    const newMap = this.generateRandomMap("ok");
    this._map = newMap;
    
    for (const p of this._players) {
      p.alive = true;
      p.ready = false;
    }

    // Emit drawBoard event to ensure map synchronization
    this._io.to(this._id).emit('prepareNewGame', {
      roomId: this._id,
      players: this._players.map(p => p.toJSON()),
      map: this._map,
      round: this._round
    });

    for(let i = 0; i < 1; i++) {
      this._io.to(this._id).emit('drawBoard', this._map);
    }

    setTimeout(() => {
      this._isResetting = false;
      console.log("Reset flag cleared");
    }, 1000);
  }

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


  private generateRandomMap(type: string): any {

    const board = generateBoard(type);


    const walls: { x: number, y: number, width: number, height: number }[] = [];
    const spawns: { x: number, y: number }[] = [];


    const tileSize = 68;


    for (let i = 0; i < board.length; i++) {
      const cell = board[i];
      const x = (cell.col - 1) * tileSize;
      const y = (cell.row - 1) * tileSize;



      if (cell.top) {
        walls.push({
          x: x,
          y: y,
          width: tileSize,
          height: 4
        });
      }

      if (cell.left) {
        walls.push({
          x: x,
          y: y,
          width: 4,
          height: tileSize
        });
      }


      if (cell.row === 10 && cell.bottom) {
        walls.push({
          x: x,
          y: y + tileSize - 4,
          width: tileSize,
          height: 4
        });
      }


      if (cell.col === 10 && cell.right) {
        walls.push({
          x: x + tileSize - 4,
          y: y,
          width: 4,
          height: tileSize
        });
      }
    }

    const spawnPositions = [
      { row: 1, col: 1 },
      { row: 1, col: 10 },
      { row: 10, col: 1 },
      { row: 10, col: 10 }
    ];

    for (const pos of spawnPositions) {
      spawns.push({
        x: (pos.col - 1) * tileSize + tileSize / 2,
        y: (pos.row - 1) * tileSize + tileSize / 2
      });
    }

    return {
      walls,

      board,
      size: {
        width: 10 * tileSize,
        height: 10 * tileSize
      }
    };
  }


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


  isResetting(): boolean {
    return this._isResetting;
  }
}