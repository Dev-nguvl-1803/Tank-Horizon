# Test Core Socket.IO cho Tank-Horizon

File này hướng dẫn cách sử dụng các công cụ test Socket.IO cơ bản để phát triển và kiểm thử core của hệ thống Tank-Horizon.

## Cách thiết lập môi trường test

### Bước 1: Cài đặt dependencies

Đảm bảo bạn đã cài đặt tất cả các dependencies cần thiết bằng cách chạy:

```bash
npm install
```

### Bước 2: Biên dịch TypeScript

Biên dịch TypeScript sang JavaScript:

```bash
npx tsc
```

### Bước 3: Khởi động server test

Sau khi biên dịch thành công, chạy server test:

```bash
node dist/server/server-test.js
```

Server sẽ khởi động tại địa chỉ http://localhost:3000

## Cách sử dụng test client

1. Mở trình duyệt và truy cập http://localhost:3000
2. Giao diện test cung cấp các chức năng sau:

### Tạo phòng mới
- Nhập tên của bạn
- Nhấn "Create Game"
- Một ID phòng sẽ được tạo ra

### Tham gia phòng có sẵn
- Nhập tên của bạn
- Nhập ID phòng
- Nhấn "Join Game"

### Test các event Socket.IO
- Nhấn "Emit Test Event" để gửi một event test đến server
- Nhấn "Test Broadcast" để gửi một broadcast đến tất cả người chơi khác trong phòng
- Bảng "Event Log" sẽ hiển thị tất cả các event Socket.IO nhận được

## Cấu trúc core Socket.IO

Hệ thống test bao gồm:

### Client-side
- `index.html`: Giao diện người dùng đơn giản để test
- `test-client.js`: Xử lý các kết nối và event Socket.IO từ phía client

### Server-side
- `server-test.ts`: Server đơn giản để xử lý các kết nối và event Socket.IO

### Các event Socket.IO cơ bản

1. **Connection events**
   - `connect`: Khi client kết nối đến server
   - `disconnect`: Khi client ngắt kết nối

2. **Room events**
   - `createRoom`: Tạo phòng mới
   - `joinRoom`: Tham gia phòng hiện có
   - `leaveRoom`: Rời khỏi phòng
   - `roomCreated`: Server phản hồi khi phòng được tạo
   - `roomJoined`: Server phản hồi khi tham gia phòng thành công
   - `playerJoined`: Thông báo khi người chơi khác tham gia
   - `playerLeft`: Thông báo khi người chơi khác rời đi

3. **Test events**
   - `testEvent`: Gửi/nhận event test
   - `broadcastTest`: Gửi/nhận broadcast test

## Tích hợp với Phaser

Để tích hợp với game engine Phaser:

1. Bỏ ghi chú dòng `initPhaserGame()` trong hàm `showGameScreen()` của `test-client.js`
2. Tùy chỉnh các hàm `gamePreload`, `gameCreate`, và `gameUpdate` để hiển thị và cập nhật trạng thái game

## Chuyển từ test sang sản phẩm

Sau khi đã test thành công core Socket.IO:

1. Đưa logic xử lý Socket.IO từ `server-test.ts` vào `server.ts` chính
2. Đưa các event handler từ `test-client.js` vào trong mã game của bạn
3. Mở rộng các lớp `Room` và `Player` với các thuộc tính game của bạn