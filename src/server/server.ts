import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as sql from 'mssql';
import { generateBoard, generateId } from './map';
import { Player } from '../models/Player';
import { Room } from '../models/Room';
import { Bullet } from '../models/Bullet';
import { Powerup } from '../models/Powerup';
import dbConfig from './dbconfig';
import path from 'path';
import dbs from "./dbconfig";

declare global {
  var explodedBombs: Set<string>;
}

// Cáu hình server 🙏
/**
 * Goal:
 * - Create a new Express server
 * - Serve static files from the public folder
 * - Connect to SQL
 */

//EXPRESS ===========================================================

const app = express();
const server = createServer(app);
const io = new Server(server);

const publicPath = path.resolve(__dirname, '../../src/public');
const htmlPath = path.join(publicPath, 'html');

app.use('/js', express.static(path.join(publicPath, 'js'), {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.js') {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

app.use('/', express.static(path.join(publicPath, 'html'), {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.css') {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

app.use('/assets', express.static(path.join(publicPath, 'assets')));

app.use('/Source', express.static(path.join(publicPath, 'Source')));

const playerDbs = new Map();

app.get('/', (req, res) => {
  res.sendFile(path.join(htmlPath, 'index.html'));
});

server.listen(8080, () => {
  console.log(`Server is listening on port ${(server.address() as any).port}`);
});


//SQL ===========================================================
let pool: sql.ConnectionPool;

async function initializeDb() {
  try {
    pool = await sql.connect(dbConfig);
    console.log('Connected to database');
  } catch (err) {
    console.error('Database connection failed', err);
  }
}
initializeDb();



// Nối mạng 🙏
/**
 * Goal:
 * - Cấu hình các sự kiện socket
 * - Tạo các phòng chơi và quản lý phòng chơi
 * - Quản lý Player
 * - Quản lý object item
 */

//Điều kiện game ===========================================================
const globalSettings = {
  maxPlayers: 4,
  maxBullets: 5,
  pointsToWin: 1000,
};

const roomIds: string[] = []; // Lưu trữ id của các phòng chơi
const rooms: { [key: string]: Room } = {}; // Lưu trữ các phòng chơi


// Tìm phòng chơi đang hoạt động ===============================
const getRoom = (id: string, isRoomId: boolean): string | undefined => {
  if (isRoomId) {
    return rooms[id] ? id : undefined;
  }

  let roomId: string | undefined;
  Object.keys(rooms).forEach(key => {
    for (const player of rooms[key].players) {
      if (id === player.id) {
        roomId = key;
        return;
      }
    }
  });

  return roomId;
};

// Tên không trùng nhau
// const checkPlayerNameExists = async (name: string): Promise<boolean> => {
//   try {
//     const result = await pool.request()
//       .input('name', sql.NVarChar, name)
//       .query('SELECT COUNT(*) as count FROM Players WHERE PlayerName = @name');

//     return result.recordset[0].count > 0;
//   } catch (err) {
//     console.error('Error checking player name:', err);
//     return false;
//   }
// };

// Lưu score
// const savePlayerScore = async (name: string, score: number) => {
//   try {
//     await pool.request()
//       .input('name', sql.NVarChar, name)
//       .input('score', sql.Int, score)
//       .query(`

//       `);
//   } catch (err) {
//     console.error('Error saving player score:', err);
//   }
// };



io.on('connection', (socket) => {
  // ROOM SOCKET EVENTS ===========================================================

  const autoJoin = (data: { name: string; }) => {
    // Ngẫu nhiên chọn room từ rooms kiểm tra điều kiện sau:
    // gameInProgress = false (chưa bắt đầu)
    // players.length < globalSettings.maxPlayers (chưa đủ người chơi)
    // chỉ có vậy thôi

    const player = Object.values(rooms).flatMap(room => room.players).find(player => player.name === data.name);
    if (player) {
      return;
    }
    const availableRooms = Object.values(rooms).filter(room => !room.gameInProgress && room.players.length < globalSettings.maxPlayers);
    if (availableRooms.length === 0) {
      socket.emit('noAvailableRoom', 'Không có phòng nào khả dụng, vui lòng tạo phòng mới');
      return;
    }
    const randomRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)];
    const roomId = randomRoom.id;

    randomRoom.newPlayer(socket.id, data.name);
    const playerIndex = randomRoom.getPlayerIndex(socket.id);
    
    socket.join(roomId);
    socket.to(roomId).emit('playerJoined', {
      player: rooms[roomId].players[playerIndex],
      playerCount: rooms[roomId].players.length
    });

    socket.emit('waitingRoom', {
      roomId: roomId,
      players: rooms[roomId].players,
      isHost: false,
      maxPlayers: globalSettings.maxPlayers
    });
    socket.off('autoJoin', autoJoin);
  }

  const kickPlayer = async (data: any) => {
    const player = Object.values(rooms).flatMap(room => room.players).find(player => player.name === data.name);
    if (player) {
      const client = io.sockets.sockets.get(player.id);
      if (client) {
        if (!player.isHost) {
          client.emit('playerKick', {
            message: `Bạn đã bị kick khỏi phòng ${player.roomId}`,
            room: rooms[player.roomId].id
          });
          await client.leave(player.roomId);

          const playerIndex = rooms[player.roomId].getPlayerIndex(player.id);
          if (playerIndex !== -1) {
            // Xóa người chơi khỏi player data
            rooms[player.roomId].players.splice(playerIndex, 1);

            // Phòng rỗng = xóa phòng
            if (rooms[player.roomId].players.length === 0) {
              delete rooms[player.roomId];
              const idIndex = roomIds.indexOf(player.roomId);
              if (idIndex !== -1) {
                roomIds.splice(idIndex, 1);
              }
            }
          }

          io.to(rooms[player.roomId].id).emit('playerLeft', {
            id: player.id,
            name: player.name,
            playerCount: rooms[player.roomId].players.length,
            room: rooms[player.roomId].id
          });
        } else {
          client.emit('playerKick', {
            message: `Không thể kick host`,
            room: rooms[player.roomId].id
          });
          return;
        }
      }
    }
    socket.off('kickPlayer', kickPlayer);
  }

  const socketNewGame = (data: any) => {
    /**
     * Goal:
     * - Tạo mới phòng chơi
     * - Thêm người chơi vào phòng chơi
     * - Đánh dấu người chơi đầu tiên là host
     * - Đưa người chơi vào phòng chờ
     * - Dữ liệu gameType sẽ được lấy từ PhaserGame nhưng mặc định sẽ để là "null" để test
     */

    const gameType = "null"
    const id = generateId(roomIds);
    rooms[id] = new Room(id, io, socket, globalSettings, gameType);

    rooms[id].newPlayer(socket.id, data.name);
    const playerIndex = rooms[id].getPlayerIndex(socket.id);
    if (playerIndex !== -1) {
      rooms[id].players[playerIndex].isHost = true;
    }

    rooms[id].powerupSpawner();
    socket.join(id);

    socket.emit('waitingRoom', {
      roomId: id,
      players: rooms[id].players,
      isHost: true,
      maxPlayers: globalSettings.maxPlayers
    });
    socket.off('newGame', socketNewGame);
  }

  const socketJoinGame = (data: any) => {
    /**
      * Goal:
      * - Kiểm tra sự tồn tại của phòng chơi
      * - Kiểm tra số lượng người chơi trong phòng (nếu đầy thì thông báo)
      * - Thêm người chơi vào phòng chơi
      * - Thông báo cho những người chơi khác về người chơi mới
      * - Gửi thông tin phòng chơi cho người chơi mới
    */

    if (!rooms[data.id]) {
      socket.emit('invalidRoomId', data.id);
      return;
    }

    rooms[data.id].newPlayer(socket.id, data.name);
    const playerIndex = rooms[data.id].getPlayerIndex(socket.id);


    socket.join(data.id);

    socket.to(data.id).emit('playerJoined', {
      player: rooms[data.id].players[playerIndex],
      playerCount: rooms[data.id].players.length
    });

    socket.emit('waitingRoom', {
      roomId: data.id,
      players: rooms[data.id].players,
      isHost: false,
      maxPlayers: globalSettings.maxPlayers
    });

    socket.off('joinGame', socketJoinGame);
  }

  const socketSpectateGame = (roomId: string) => {
    /**
 * Goal:
 * - Chia ra làm 2 trường hợp
 *  + Phòng đang chờ thì xem dữ liệu phòng chờ
 *  + Phòng đang chơi thì xem dữ liệu phòng chơi
 */
    console.log(`Spectating room: ${roomId}`);
    if (!rooms[roomId]) {
      socket.emit('invalidRoomId', roomId);
      return;
    }

    socket.join(roomId);

    if (rooms[roomId].gameInProgress) {
      socket.emit('spectateGameInProgress', {
        roomId: roomId,
        board: rooms[roomId].map,
        players: rooms[roomId].players
      });
    } else {
      socket.emit('spectateWaitingRoom', {
        roomId,
        players: rooms[roomId].players,
        maxPlayers: globalSettings.maxPlayers
      });
    }

    socket.off('spectateGame', socketSpectateGame);
  }

  const socketNewRoom = (data: any) => {
    /**
     * Goal:
     * - Lấy thông tin phòng chơi
     */

    const roomId = getRoom(data.id, data.isRoom);
    if (roomId) {
      socket.emit('sendRoom', {
        roomId: roomId,
        players: rooms[roomId].players,
        gameInProgress: rooms[roomId].gameInProgress,
        maxPlayers: globalSettings.maxPlayers,
        playerCount: rooms[roomId].players.length
      });
    }

    socket.off('getRoom', socketNewRoom);
  }

  const socketStartGame = () => {
    /**
 * Goal:
 * - Xử lý khi người chơi bắt đầu trận đấu
 *  + Thực hiện kiểm tra người chơi có phải là host không
 *  +> Nếu không phải thì thông báo không có quyền
 *  + Thực hiện kiểm tra số lượng người chơi để bắt đầu
 */
    const roomId = getRoom(socket.id, false);
    if (!roomId) return;

    if (rooms[roomId].gameInProgress == true) {
      socket.emit('gameAlreadyStarted', 'Trận đấu đã bắt đầu rồi, không thể bắt đầu lại nữa');
      return;
    }
    const playerIndex = rooms[roomId].getPlayerIndex(socket.id);
    if (playerIndex === -1) return;

    if (!rooms[roomId].players[playerIndex].isHost) {
      socket.emit('notAuthorized', 'Chỉ chủ phòng mới có thể bắt đầu trận đấu');
      return;
    }

    if (rooms[roomId].players.length < 2) {
      socket.emit('notEnoughPlayers', 'Cần ít nhất 2 người chơi để bắt đầu');
      return;
    }

    rooms[roomId].gameInProgress = true;

    io.to(roomId).emit('drawBoard', rooms[roomId].map);

    io.to(roomId).emit('gameStart', {
      board: rooms[roomId].map,
      players: rooms[roomId].players
    });

    console.log(`[Room ${roomId}] Bắt đầu spawner powerup sau khi trò chơi đã bắt đầu`);
    rooms[roomId].powerupSpawner();

    socket.off('startGame', socketStartGame);
  }

  const socketLeaveRoom = () => {
    /**
     * Goal:
     * - Xử lý khi người chơi chủ động rời phòng
     * - Tương tự như xử lý disconnect nhưng là chủ động
     */
    const roomId = getRoom(socket.id, false);
    if (!roomId || !rooms[roomId]) return;

    const playerIndex = rooms[roomId].getPlayerIndex(socket.id);
    if (playerIndex === -1) return;

    const player = rooms[roomId].players[playerIndex];

    if (rooms[roomId].gameInProgress && player.score > 0) {

    }

    console.log("Đã leave room", player.name, player.id, rooms[roomId].id)
    socket.to(roomId).emit('playerLeft', {
      id: socket.id,
      name: player.name,
      playerCount: rooms[roomId].players.length - 1,
      room: rooms[roomId].id
    });

    socket.leave(roomId);
    rooms[roomId].players.splice(playerIndex, 1);

    if (player.isHost && rooms[roomId].players.length > 0) {
      const newHostIndex = 0;
      rooms[roomId].players[newHostIndex].isHost = true;

      io.to(roomId).emit('newHost', {
        id: rooms[roomId].players[newHostIndex].id,
        name: rooms[roomId].players[newHostIndex].name,
        players: rooms[roomId].players
      });
    }

    if (rooms[roomId].players.length === 0) {
      delete rooms[roomId];
      const idIndex = roomIds.indexOf(roomId);
      if (idIndex !== -1) {
        roomIds.splice(idIndex, 1);
      }
    }

    socket.off('leaveRoom', socketLeaveRoom);
  }

  const socketDisconnect = () => {
    /**
 * Goal:
 * - Xử lý khi người chơi thoát khỏi game
 *  + Thực hiện lấy phòng và lấy playerIndex
 *  +> Thực hiện xóa người chơi khỏi phòng
 * - Nếu người chơi là host thì chuyển host mới
 * - Xóa phòng khi out hết người chơi
 */
    const roomId = getRoom(socket.id, false);
    if (!roomId || !rooms[roomId]) return;

    const playerIndex = rooms[roomId].getPlayerIndex(socket.id);
    if (playerIndex === -1) return;

    const player = rooms[roomId].players[playerIndex];

    if (rooms[roomId].gameInProgress && player.score > 0) {

    }


    socket.to(roomId).emit('playerLeft', {
      id: socket.id,
      name: player.name,
      playerCount: rooms[roomId].players.length - 1
    });


    rooms[roomId].players.splice(playerIndex, 1);


    if (player.isHost && rooms[roomId].players.length > 0) {
      const newHostIndex = 0;
      rooms[roomId].players[newHostIndex].isHost = true;

      io.to(roomId).emit('newHost', {
        id: rooms[roomId].players[newHostIndex].id,
        name: rooms[roomId].players[newHostIndex].name,
        players: rooms[roomId].players
      });
    }


    if (rooms[roomId].players.length === 0) {
      delete rooms[roomId];
      const idIndex = roomIds.indexOf(roomId);
      if (idIndex !== -1) {
        roomIds.splice(idIndex, 1);
      }
    }

    socket.off('disconnect', socketDisconnect);
  }

  const socketSendLocations = (data: any) => {
    /**
  * Goal:
  * - Lấy phòng và tìm kiếm người chơi
  * - Cập nhật vị trí và hướng của người chơi
  * - Thông báo cho những người chơi khác về vị trí mới của người chơi
 */
    const roomId = getRoom(socket.id, false);
    if (!roomId) return;

    const playerIndex = rooms[roomId].getPlayerIndex(socket.id);
    if (playerIndex === -1) return;


    rooms[roomId].players[playerIndex].x = data.x;
    rooms[roomId].players[playerIndex].y = data.y;
    rooms[roomId].players[playerIndex].rotation = data.rotation;


    socket.to(roomId).emit('renderMovement', rooms[roomId].players[playerIndex]);

    socket.off('sendLocations', socketSendLocations);
  }


  const socketSendBullet = (data: any) => {
    /**
      * Goal:
      * - Lấy thông tin phòng + vị trí xy người chơi và góc bắn
      * - Kiểm tra số lượng đạn hiện tại của người chơi (không vượt quá giới hạn)
      * - Đạn sẽ xuất hiện tại ví trí của người chơi và di chuyển theo hướng của hitbox người chơi
      * - Thông báo cho tất cả người chơi về viên đạn mới
    */
    const roomId = getRoom(socket.id, false);
    if (!roomId) return;

    const playerIndex = rooms[roomId].getPlayerIndex(socket.id);
    if (playerIndex === -1) return;


    const player = rooms[roomId].players[playerIndex];
    const bullet = new Bullet(
      data.x,
      data.y,
      data.angle,
      roomId,
      player.id,
      data.powerup
    );

    rooms[roomId].players[playerIndex].bulletCount++;


    io.to(roomId).emit('renderBullet', bullet);

    socket.off('sendBullet', socketSendBullet);
  }

  const socketBulletDestroyed = (bulletOwnerId: string) => {
    /**
      * Goal:
      * - Khi đạn di chuyển đã hết thời gian di chuyển và biến mất, thêm lại đạn cho người chơi
    */
    const roomId = getRoom(bulletOwnerId, false);
    if (!roomId) return;

    const playerIndex = rooms[roomId].getPlayerIndex(bulletOwnerId);
    if (playerIndex === -1) return;


    if (rooms[roomId].players[playerIndex].bulletCount > 0) {
      rooms[roomId].players[playerIndex].bulletCount--;

      io.to(rooms[roomId].players[playerIndex].id).emit('bulletCountUpdated', {
        count: globalSettings.maxBullets - rooms[roomId].players[playerIndex].bulletCount
      });
    }

    socket.off('bulletDestroyed', socketBulletDestroyed);
  }

  const socketPlayerDied = (data: any) => {
    const roomId = getRoom(socket.id, false);
    if (!roomId) return;

    const victimIndex = rooms[roomId].getPlayerIndex(data.victimId);
    const killerIndex = rooms[roomId].getPlayerIndex(data.killerId);

    if (victimIndex === -1) return;

    const datas = playerDbs.get(roomId + rooms[roomId].round);
    const clearDatas = playerDbs.get(roomId + (rooms[roomId].round - 1));
    if (clearDatas) playerDbs.delete(roomId + (rooms[roomId].round - 1));

    if (datas) {
      const killed = datas.find((i: any) => i == data.victimId);
      if (killed) return;
      else {
        playerDbs.set(roomId + rooms[roomId].round, [...datas, data.victimId]);
      }
    } else {
      playerDbs.set(roomId + rooms[roomId].round, [data.victimId]);
    }

    console.log("Nhảy điểm không", data.killerId)

    rooms[roomId].players[victimIndex].alive = false;
    if (killerIndex !== -1) {
      if (data.victimId === data.killerId) {

        if (rooms[roomId].players[killerIndex].score == 0) {
          rooms[roomId].players[killerIndex].score = 0;
        } else {
          rooms[roomId].players[killerIndex].score -= 50;
        }
      } else {

        rooms[roomId].players[killerIndex].score += 100;
      }


      io.to(roomId).emit('scoreUpdated', {
        id: data.killerId,
        score: rooms[roomId].players[killerIndex].score
      });


      if (rooms[roomId].players[killerIndex].score >= globalSettings.pointsToWin) {
        io.to(roomId).emit('gameOver', {
          winner: rooms[roomId].players[killerIndex]
        });
      }
    }

    io.to(roomId).emit('playerDied', {
      victimId: data.victimId,
      killerId: data.killerId
    });

    socket.off('playerDied', socketPlayerDied);
  }


  const socketResetMap = () => {
    const roomId = getRoom(socket.id, false);
    if (!roomId) return;


    const playerIndex = rooms[roomId].getPlayerIndex(socket.id);
    if (playerIndex === -1) return;

    console.log(`[Server] Player ${socket.id} requested map reset for room ${roomId}`);


    if (!rooms[roomId].isResetting()) {
      console.log(`[Server] Preparing new game for room ${roomId}`);
      rooms[roomId].prepareNewGame();
    } else {
      console.log(`[Server] Room ${roomId} is already resetting, ignoring duplicate request`);
    }

    socket.off('resetMap', socketResetMap);
  }

  const socketGetPowerup = (powerup: Powerup) => {
    /**
      * Goal:
      * Working soon, idk lol, so hard to understand 😭😭😭😭😭
    */
    const roomId = getRoom(socket.id, false);
    if (!roomId) return;

    const playerIndex = rooms[roomId].getPlayerIndex(socket.id);
    if (playerIndex === -1) return;

    rooms[roomId].players[playerIndex].powerup = powerup.type;

    io.to(roomId).emit('hasPowerup', {
      id: socket.id,
      playerName: rooms[roomId].players[playerIndex].name,
      powerup: powerup
    });

    socket.off('getPowerup', socketGetPowerup);
  }

  socket.on('autoJoin', (data) => {
    autoJoin(data);
  })
  socket.on('newGame', async (data) => {
    socketNewGame(data);
  });
  socket.on('joinGame', async (data) => {
    socketJoinGame(data);
  });
  socket.on('spectateGame', (roomId) => {
    socketSpectateGame(roomId);
  });
  socket.on('getRoom', (data) => {
    socketNewRoom(data);
  });
  socket.on('startGame', () => {
    socketStartGame();
  });
  socket.on('leaveRoom', () => {
    socketLeaveRoom();
  });
  socket.on('disconnect', () => {
    socketDisconnect();
  });
  socket.on('sendLocations', (data) => {
    socketSendLocations(data);
  });
  socket.on('sendBullet', (data) => {
    socketSendBullet(data);
  });
  socket.on('bulletDestroyed', (bulletOwnerId) => {
    socketBulletDestroyed(bulletOwnerId);
  });
  socket.on('playerDied', (data) => {
    socketPlayerDied(data);
  });
  socket.on('resetMap', () => {
    socketResetMap();
  });
  socket.on('getPowerup', (powerup) => {
    socketGetPowerup(powerup);
  });
  socket.on('kickPlayer', async (name) => await kickPlayer(name));
  socket.on('placeBomb', (data) => {
    /**
     * Goal:
     * - Process bomb placement from a client
     * - Broadcast bomb placement to all other clients in the room
     * - Store the bomb data for tracking
     */
    const roomId = getRoom(socket.id, false);
    if (!roomId) return;

    const playerIndex = rooms[roomId].getPlayerIndex(socket.id);
    if (playerIndex === -1) return;

    rooms[roomId].players[playerIndex].powerup = null;

    io.to(roomId).emit('bombPlaced', {
      bombId: data.bombId,
      x: data.x,
      y: data.y,
      ownerId: socket.id
    });
  });

  socket.on('bombExploded', (data) => {
    /**
     * Goal:
     * - Process bomb explosion from a client
     * - Broadcast explosion to all other clients in the room
     * - Xử lý đồng bộ vụ nổ qua server để tất cả client xử lý cùng thời điểm
     */
    const roomId = getRoom(socket.id, false);
    if (!roomId) return;

    if (!global.explodedBombs) {
      global.explodedBombs = new Set();
    }

    if (global.explodedBombs.has(data.bombId)) {
      return;
    }

    global.explodedBombs.add(data.bombId);

    console.log(`[BOMB] Xử lý nổ bomb ${data.bombId} và gửi lệnh nổ đến tất cả client`);

    io.to(roomId).emit('processBombExplosion', {
      bombId: data.bombId,
      x: data.x,
      y: data.y,
      ownerId: data.ownerId,

    });

    setTimeout(() => {
      if (global.explodedBombs && global.explodedBombs.has(data.bombId)) {
        global.explodedBombs.delete(data.bombId);
      }
    }, 5000);
  });
});