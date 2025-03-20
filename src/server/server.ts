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

// Đường dẫn đến thư mục public
const publicPath = path.resolve(__dirname, '../../src/public');
const htmlPath = path.join(publicPath, 'html');

// Phục vụ các file tĩnh từ thư mục public
app.use('/js', express.static(path.join(publicPath, 'js'), {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.js') {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

app.use('/assets', express.static(path.join(publicPath, 'assets')));

// Tuyến đường chính
app.get('/', (req, res) => {
  console.log('Attempting to serve index.html from:', htmlPath);
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
const getRoom = (playerId: string): string | undefined => {
  let roomId: string | undefined;

  Object.keys(rooms).forEach(key => {
    for (const player of rooms[key].players) {
      if (playerId === player.id) {
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


// KHI TAO ĐÃ KẾT NỐI ĐẾN GAME
io.on('connection', (socket) => {
  // Thông báo Socket B đã kết nối
  socket.emit('socketBConnected');

  // ROOM SOCKET EVENTS ===========================================================
  socket.on('newGame', async (data) => {
    /**
     * Goal:
     * - Tạo mới phòng chơi
     * - Thêm người chơi vào phòng chơi
     * - Đánh dấu người chơi đầu tiên là host
     * - Đưa người chơi vào phòng chờ
     * - Dữ liệu gameType sẽ được lấy từ PhaserGame nhưng mặc định sẽ để là "null" để test
     */
    // const nameExists = await checkPlayerNameExists(data.name);
    // if (nameExists) {
    //   socket.emit('nameExists');
    //   return;
    // }

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
  });


  socket.on('joinGame', async (data) => {

    /**
     * Goal:
     * - Kiểm tra sự tồn tại của phòng chơi
     * - Kiểm tra số lượng người chơi trong phòng (nếu đầy thì thông báo)
     * - Thêm người chơi vào phòng chơi
     * - Thông báo cho những người chơi khác về người chơi mới
     * - Gửi thông tin phòng chơi cho người chơi mới
     */
    // const nameExists = await checkPlayerNameExists(data.name);
    // if (nameExists) {
    //   socket.emit('nameExists');
    //   return;
    // }

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
  });


  socket.on('spectateGame', (roomId) => {
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
      console.log(`Spectating game in progress: ${roomId}`);
      socket.emit('spectateGameInProgress', {
        roomId: roomId,
        board: rooms[roomId].map,
        players: rooms[roomId].players
      });
    } else {
      // Gửi thông tin phòng chờ nếu game chưa bắt đầu
      console.log(`Spectating game in waiting: ${roomId}`);
      socket.emit('spectateWaitingRoom', {
        roomId,
        players: rooms[roomId].players,
        maxPlayers: globalSettings.maxPlayers
      });
    }
  });

  socket.on('getRoom', () => {
    /**
     * Goal:
     * - Lấy thông tin phòng chơi
     */
    const roomId = getRoom(socket.id);
    if (roomId) {
      socket.emit('sendRoom', {
        roomId: roomId,
        players: rooms[roomId].players,
        gameInProgress: rooms[roomId].gameInProgress,
        maxPlayers: globalSettings.maxPlayers,
        playerCount: rooms[roomId].players.length
      });
    }
  });

  socket.on('startGame', () => {
    /**
     * Goal:
     * - Xử lý khi người chơi bắt đầu trận đấu
     *  + Thực hiện kiểm tra người chơi có phải là host không
     *  +> Nếu không phải thì thông báo không có quyền
     *  + Thực hiện kiểm tra số lượng người chơi để bắt đầu
     */
    const roomId = getRoom(socket.id);
    if (!roomId) return;

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

    io.to(roomId).emit('gameStart', {
      board: rooms[roomId].map,
      players: rooms[roomId].players
    });
  });


  // PLAYER SOCKET EVENTS ===========================================================
  socket.on('leaveRoom', () => {
    /**
     * Goal:
     * - Xử lý khi người chơi chủ động rời phòng
     * - Tương tự như xử lý disconnect nhưng là chủ động
     */
    const roomId = getRoom(socket.id);
    if (!roomId || !rooms[roomId]) return;

    const playerIndex = rooms[roomId].getPlayerIndex(socket.id);
    if (playerIndex === -1) return;

    const player = rooms[roomId].players[playerIndex];

    if (rooms[roomId].gameInProgress && player.score > 0) {
      // savePlayerScore(player.name, player.score);
    }

    socket.to(roomId).emit('playerLeft', {
      id: socket.id,
      name: player.name,
      playerCount: rooms[roomId].players.length - 1
    });

    socket.leave(roomId);
    rooms[roomId].players.splice(playerIndex, 1);

    if (player.isHost && rooms[roomId].players.length > 0) {
      const newHostIndex = 0;
      rooms[roomId].players[newHostIndex].isHost = true;

      io.to(roomId).emit('newHost', {
        id: rooms[roomId].players[newHostIndex].id,
        name: rooms[roomId].players[newHostIndex].name
      });
    }

    if (rooms[roomId].players.length === 0) {
      delete rooms[roomId];
      const idIndex = roomIds.indexOf(roomId);
      if (idIndex !== -1) {
        roomIds.splice(idIndex, 1);
      }
    }
  });

  socket.on('disconnect', () => {

    /**
     * Goal:
     * - Xử lý khi người chơi thoát khỏi game
     *  + Thực hiện lấy phòng và lấy playerIndex
     *  +> Thực hiện xóa người chơi khỏi phòng
     * - Nếu người chơi là host thì chuyển host mới
     * - Xóa phòng khi out hết người chơi
     */
    const roomId = getRoom(socket.id);
    if (!roomId || !rooms[roomId]) return;

    const playerIndex = rooms[roomId].getPlayerIndex(socket.id);
    if (playerIndex === -1) return;

    const player = rooms[roomId].players[playerIndex];


    if (rooms[roomId].gameInProgress && player.score > 0) {
      // savePlayerScore(player.name, player.score);
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
        name: rooms[roomId].players[newHostIndex].name
      });
    }


    if (rooms[roomId].players.length === 0) {
      delete rooms[roomId];
      const idIndex = roomIds.indexOf(roomId);
      if (idIndex !== -1) {
        roomIds.splice(idIndex, 1);
      }
    }
  });


  socket.on('sendLocations', (data) => {
    /**
      * Goal:
      * - Lấy phòng và tìm kiếm người chơi
      * - Cập nhật vị trí và hướng của người chơi
      * - Thông báo cho những người chơi khác về vị trí mới của người chơi
     */
    const roomId = getRoom(socket.id);
    if (!roomId) return;

    const playerIndex = rooms[roomId].getPlayerIndex(socket.id);
    if (playerIndex === -1) return;


    rooms[roomId].players[playerIndex].x = data.x;
    rooms[roomId].players[playerIndex].y = data.y;
    rooms[roomId].players[playerIndex].rotation = data.rotation;


    socket.to(roomId).emit('renderMovement', rooms[roomId].players[playerIndex]);
  });


  socket.on('sendBullet', (data) => {
    /**
     * Goal:
     * - Lấy thông tin phòng + vị trí xy người chơi và góc bắn
     * - Kiểm tra số lượng đạn hiện tại của người chơi (không vượt quá giới hạn)
     * - Đạn sẽ xuất hiện tại ví trí của người chơi và di chuyển theo hướng của hitbox người chơi
     * - Thông báo cho tất cả người chơi về viên đạn mới
     */
    const roomId = getRoom(socket.id);
    if (!roomId) return;

    const playerIndex = rooms[roomId].getPlayerIndex(socket.id);
    if (playerIndex === -1) return;


    const player = rooms[roomId].players[playerIndex];
    if (player.bulletCount >= globalSettings.maxBullets) {
      socket.emit('bulletLimitReached', globalSettings.maxBullets);
      return;
    }

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
  });


  socket.on('bulletDestroyed', (bulletOwnerId) => {
    /**
     * Goal:
     * - Khi đạn di chuyển đã hết thời gian di chuyển và biến mất, thêm lại đạn cho người chơi
     */
    const roomId = getRoom(bulletOwnerId);
    if (!roomId) return;

    const playerIndex = rooms[roomId].getPlayerIndex(bulletOwnerId);
    if (playerIndex === -1) return;


    if (rooms[roomId].players[playerIndex].bulletCount > 0) {
      rooms[roomId].players[playerIndex].bulletCount--;

      io.to(rooms[roomId].players[playerIndex].id).emit('bulletCountUpdated', {
        count: globalSettings.maxBullets - rooms[roomId].players[playerIndex].bulletCount
      });
    }
  });


  socket.on('playerDied', (killerId) => {
    /**
     * Goal:
     * - Khi người chơi bị giết, kiểm tra xem người giết có phải người chơi khác không
     * - Nếu có thì tăng điểm cho người giết và kiểm tra điểm số để kết thúc game
     * - Nếu không thì thông báo người chơi đã chết và đưa vào chế độ spectate
     */
    const roomId = getRoom(socket.id);
    if (!roomId) return;

    const playerIndex = rooms[roomId].getPlayerIndex(socket.id);
    if (playerIndex === -1) return;

    rooms[roomId].players[playerIndex].alive = false;


    if (killerId && killerId !== socket.id) {
      const killerIndex = rooms[roomId].getPlayerIndex(killerId);
      if (killerIndex !== -1) {
        rooms[roomId].players[killerIndex].score += 100;

        io.to(roomId).emit('scoreUpdated', {
          id: killerId,
          score: rooms[roomId].players[killerIndex].score
        });

        if (rooms[roomId].players[killerIndex].score >= globalSettings.pointsToWin) {
          rooms[roomId].players.forEach(player => {
            // savePlayerScore(player.name, player.score);
          });

          io.to(roomId).emit('gameOver', {
            winner: rooms[roomId].players[killerIndex],
            players: rooms[roomId].players
          });

          rooms[roomId].prepareNewGame();
          return;
        }
      }
    }

    socket.emit('spectateMode', {
      message: 'Bạn đã chết. Đang vào chế độ theo dõi.',
      players: rooms[roomId].players.filter(p => p.alive)
    });

    rooms[roomId].checkNewRound("null");
    socket.to(roomId).emit('removePlayer', socket.id);
  });


  socket.on('getPowerup', (powerup) => {
    /**
     * Goal:
     * Working soon, idk lol, so hard to understand 😭😭😭😭😭
     */
    const roomId = getRoom(socket.id);
    if (!roomId) return;

    const playerIndex = rooms[roomId].getPlayerIndex(socket.id);
    if (playerIndex === -1) return;

    rooms[roomId].players[playerIndex].powerup = powerup.name;

    io.to(roomId).emit('hasPowerup', {
      id: socket.id,
      playerName: rooms[roomId].players[playerIndex].name,
      powerup: powerup
    });
  });
});

/**
 * - ✅ [MAP] Tạo bản đồ ngẫu nhiên, maze
 * - ✅ [MODEL] Tạo model cho Player, Room, Bullet, Powerup
 * - ❌ [SOCKET 1] Emit các sự kiện socket như: newGame, joinGame, startGame, sendLocations, sendBullet, bulletDestroyed, playerDied, getPowerup
 * - ✅ [SOCKET 2] Đây là bộ hệ thống nối mạng của game, bao gồm các sự kiện socket, các sự kiện trên sẽ cần được emit logic bằng 1 file server khác
 * - ❌ [SOCKET 3] Ngoài ra emit trong các sự kiện trên cũng sẽ cần được xử lý ở phía PhaserJS như hiển thị thông báo, cập nhật lại dữ liệu, bộ đếm
 * - ❌ [Frontend] Xử lý dữ liệu từ server, hiển thị thông báo và cập nhật UI
 */