# Network nối mạng, tựa game cho khả năng chơi multiplayer
- Sử dụng SocketIO nối mạng gồm các đối tượng sau:
 + Player, gồm player và enemy
 + Room

# Chi tiết về các đối tượng
- Player bao gồm các thông tin về player:
    + Name: Player name
    + Tank_color: Tank color
    + Room: Mã phòng
    + Score: Điểm trong phòng
    + location: Tọa điểm đứng điểm x, y
    + rotattion: Tọa điểm điểm xoay 360 độ
    + bullets: Số đạn
    + Alive: Còn sống hay đã chết
    + Buff: Buff hiện đang có

- Map bao gồm thông tin ID map và Player
    + ID: Mã phòng
    + Round: Vòng thứ bao nhiêu
    + Player: ["name", "name", "name", "name"]
    + High_score_player: "name"
    + Map: Bản đồ ngẫu nhiên đang sử dụng cho phòng này

# Web server
- Khởi động với ExpressJS để CD vào Phaser Game