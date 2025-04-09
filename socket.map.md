# Socket Map

## Socket A (Client to Server)

### Game Socket
- **newGame**
  - Emit: `{ name: playerName }`
  - Mô tả: Tạo phòng chơi mới
  - Trigger: `waitingRoom` từ Server để client

- **joinGame**
  - Emit: `{ name: playerName, id: roomId }`
  - Mô tả: Tham gia phòng chơi đã tồn tại
  - Kết quả: Emit `invalidRoomId` nếu phòng không tồn tại hoặc `waitingRoom` nếu thành công
  - Đồng thời Server broadcast `playerJoined` tới các player khác trong phòng

### Room Socket
- **spectateGame**
  - Emit: `roomId`
  - Mô tả: Vào xem phòng chơi
  - Kết quả: `invalidRoomId` nếu phòng không tồn tại, `spectateGameInProgress` nếu trò chơi đang diễn ra, hoặc `spectateWaitingRoom` nếu trò chơi chưa bắt đầu

- **getRoom**
  - Emit: Không có dữ liệu
  - Mô tả: Lấy thông tin phòng chơi hiện tại
  - Kết quả: `sendRoom` với dữ liệu về phòng chơi hiện tại

- **startGame**
  - Emit: Không có dữ liệu
  - Mô tả: Bắt đầu trò chơi (chỉ host mới có quyền)
  - Kết quả: `notAuthorized` nếu không phải host, `notEnoughPlayers` nếu không đủ người chơi, hoặc `gameStart` để bắt đầu trò chơi cho tất cả người chơi trong phòng

### Player Socket
- **leaveRoom**
  - Emit: Không có dữ liệu
  - Mô tả: Rời phòng chơi
  - Kết quả: Server broadcast `playerLeft` tới các player khác, `newHost` nếu là host

- **disconnect**
  - Emit: Tự động khi ngắt kết nối
  - Mô tả: Xử lý khi người chơi thoát khỏi game hoặc mất kết nối
  - Xử lý: Tương tự như `leaveRoom`

- **sendLocations**
  - Emit: `{ x: number, y: number, rotation: number }`
  - Mô tả: Cập nhật vị trí và hướng của người chơi
  - Kết quả: Server broadcast `renderMovement` tới các player khác

- **sendBullet**
  - Emit: `{ x: number, y: number, angle: number, powerup: object|null }`
  - Mô tả: Bắn một viên đạn
  - Kết quả: Server broadcast `renderBullet` tới tất cả người chơi (bao gồm cả người bắn)

- **bulletDestroyed**
  - Emit: `bulletOwnerId`
  - Mô tả: Thông báo viên đạn đã biến mất
  - Kết quả: Server emit `bulletCountUpdated` tới chủ nhân của đạn

- **playerDied**
  - Emit: `killerId` (id của người giết hoặc null nếu tự sát)
  - Mô tả: Thông báo người chơi đã chết
  - Kết quả: 
    - Server emit `spectateMode` tới người chơi đã chết
    - Server broadcast `removePlayer` tới các player khác
    - Nếu có người giết: Server broadcast `scoreUpdated` và kiểm tra `gameOver`

- **getPowerup**
  - Emit: `powerup: { name: string, ... }`
  - Mô tả: Thu thập vật phẩm buff
  - Kết quả: Server broadcast `hasPowerup` tới tất cả người chơi

## Socket B (Server)

Trung gian xử lý giữa Socket A và Socket C. Server lắng nghe các events từ Socket A, xử lý logic game và emit các events tới Socket C.

## Socket C (Phaser Game)

### Waiting Room Events
- **invalidRoomId**
  - Data: `roomId`
  - Mô tả: Thông báo ID phòng không tồn tại
  - Kích hoạt bởi: `joinGame` hoặc `spectateGame` với ID không hợp lệ

- **waitingRoom**
  - Data: `{ roomId, players, isHost, maxPlayers }`
  - Mô tả: Hiển thị phòng chờ
  - Kích hoạt bởi: `newGame` hoặc `joinGame` thành công

- **playerJoined**
  - Data: `{ player, playerCount }`
  - Mô tả: Thông báo người chơi mới tham gia
  - Kích hoạt bởi: Khi một người chơi khác gọi `joinGame` thành công

- **spectateGameInProgress**
  - Data: `{ roomId, board, players }`
  - Mô tả: Xem trận đấu đang diễn ra
  - Kích hoạt bởi: `spectateGame` khi trò chơi đang diễn ra

- **spectateWaitingRoom**
  - Data: `{ roomId, players, maxPlayers }`
  - Mô tả: Xem phòng chờ
  - Kích hoạt bởi: `spectateGame` khi trò chơi chưa bắt đầu

- **sendRoom**
  - Data: `{ roomId, players, gameInProgress, maxPlayers, playerCount }`
  - Mô tả: Thông tin về phòng chơi
  - Kích hoạt bởi: `getRoom`

- **notAuthorized**
  - Data: `message`
  - Mô tả: Thông báo không có quyền thực hiện hành động
  - Kích hoạt bởi: `startGame` khi không phải host

- **notEnoughPlayers**
  - Data: `message` 
  - Mô tả: Thông báo không đủ người chơi để bắt đầu
  - Kích hoạt bởi: `startGame` khi không đủ số lượng người chơi

- **gameStart**
  - Data: `{ board, players }`
  - Mô tả: Bắt đầu trò chơi
  - Kích hoạt bởi: `startGame` thành công
  - Khởi tạo Phaser game và vẽ map

- **newHost**
  - Data: `{ id, name }`
  - Mô tả: Thông báo host mới
  - Kích hoạt bởi: Khi host hiện tại rời phòng

### Ingame Events
- **playerLeft**
  - Data: `{ id, name, playerCount }`
  - Mô tả: Thông báo người chơi rời đi
  - Kích hoạt bởi: `leaveRoom` hoặc `disconnect`

- **renderMovement**
  - Data: `Player { id, x, y, rotation, ... }`
  - Mô tả: Cập nhật vị trí của người chơi khác
  - Kích hoạt bởi: `sendLocations`

- **bulletLimitReached**
  - Data: `maxBullets`
  - Mô tả: Thông báo đã đạt giới hạn đạn
  - Kích hoạt bởi: `sendBullet` khi người chơi đã đạt giới hạn đạn

- **renderBullet**
  - Data: `Bullet { id, x, y, angle, ownerId, ... }`
  - Mô tả: Hiển thị viên đạn mới
  - Kích hoạt bởi: `sendBullet`

- **bulletCountUpdated**
  - Data: `{ count }`
  - Mô tả: Cập nhật số lượng đạn còn lại
  - Kích hoạt bởi: `bulletDestroyed`

- **scoreUpdated**
  - Data: `{ id, score }`
  - Mô tả: Cập nhật điểm số của người chơi
  - Kích hoạt bởi: `playerDied` khi có người giết

- **gameOver**
  - Data: `{ winner, players }`
  - Mô tả: Kết thúc trò chơi và thông báo người chiến thắng
  - Kích hoạt bởi: `playerDied` khi người chơi đạt đủ điểm để thắng

- **spectateMode**
  - Data: `{ message, players }`
  - Mô tả: Chuyển sang chế độ theo dõi khi chết
  - Kích hoạt bởi: `playerDied` từ chính người chơi đó

- **removePlayer**
  - Data: `playerId`
  - Mô tả: Xóa người chơi đã chết khỏi màn hình
  - Kích hoạt bởi: `playerDied`

- **hasPowerup**
  - Data: `{ id, playerName, powerup }`
  - Mô tả: Thông báo người chơi có vật phẩm buff
  - Kích hoạt bởi: `getPowerup`

## Mối quan hệ giữa các Socket Events

1. **Phòng chờ và tạo phòng:**
   - `newGame` → Server tạo phòng → `waitingRoom` → Hiển thị phòng chờ
   - `joinGame` → Server kiểm tra → `invalidRoomId` hoặc (`waitingRoom` + broadcast `playerJoined`)

2. **Bắt đầu trò chơi:**
   - `startGame` → Server kiểm tra → `notAuthorized` hoặc `notEnoughPlayers` hoặc broadcast `gameStart`
   - `gameStart` → Khởi tạo Phaser game → Vẽ bản đồ và người chơi

3. **Xử lý di chuyển:**
   - `sendLocations` → Server cập nhật → broadcast `renderMovement` → Cập nhật vị trí người chơi khác

4. **Xử lý đạn:**
   - `sendBullet` → Server kiểm tra → `bulletLimitReached` hoặc broadcast `renderBullet`
   - Đạn biến mất → `bulletDestroyed` → Server cập nhật → `bulletCountUpdated`

5. **Xử lý người chơi chết:**
   - `playerDied` → Server xử lý:
     - Emit `spectateMode` cho người chết
     - Broadcast `removePlayer` cho người khác
     - Nếu có người giết: Broadcast `scoreUpdated`
     - Nếu đủ điểm thắng: Broadcast `gameOver`

6. **Xử lý người chơi rời đi:**
   - `leaveRoom`/`disconnect` → Server xử lý → broadcast `playerLeft`
   - Nếu là host → Chọn host mới → broadcast `newHost`
