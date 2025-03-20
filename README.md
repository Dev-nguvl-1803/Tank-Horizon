# Real Project for PRO230 (Graduation Project)

- Tank Horizon is a "tank trouble" but still better than that

## Tank Horizon (Website - Competitive Game)

- Tank Horizon là tựa game IO site được dựa trên Tank Trouble nhưng là bản chỉ có thể chơi multiplayer, và không thể chơi offline

# Công nghệ
- Tank Horizon sử dụng công nghệ TypeScript, SocketIO, SQL Server (SSMS) để cấu hình chính, trong đó socketIO đảm bảo vấn đề network và TypeScript giúp tránh bớt các vấn đề lỗi
- Ngoài ra SQL Server được sử dụng để lưu các learderboard top bảng điểm
- PhaserJS, engine được sử dụng để làm game

# Chức năng
- Map được random ngẫu nhiên
- Xe tăng được chọn theo 4 màu ngẫu nhiên từ CLient, player không được phép chọn màu xe tăng
- Game chỉ chơi được nhiều người chơi với tối đa 1 phòng 4 người chơi, có thể có 2 người chơi hoặc 3 người chơi tùy
- Giới hạn tối đa bắn 5 viên đạn chờ lượt đạn hết thì coi như xe tăng lên đạn
- Tên ingame không thể trùng nhau với dữ liệu trên Database
- Hệ thống sẽ ghi tên người chơi vào database để ghi lên top score 
- Khi người chơi nào đạt được 1000 điểm người chơi đó sẽ chiến thắng và sau đó tính top cho các điểm còn lại
- Game rất cơ bản Gồm 4 loại hình giao diện:
1. Main menu:
- Play:
    + Mode Selection: 
        + Create room
            + Map selection:
                + Rỗng
                + Map ngẫu nhiên
                
                -> Join Waiting room
                
                    If Ready <-

                    -> Join Map

                    else <-

                    waitng room...
        + Join room
            + Tự join ngẫu nhiên
            + Join bằng ID tất cả trong 1 form

                -> Join Waiting room

                    If Ready <-

                    -> Join Map

                    else <-

                    waitng room...
        + Spectator
            + Nhập ID phòng và xem với chế độ khán giả
                
                If wating_room <--

                -> Display it

                If Game in progress <---

                -> Display it

2. Setting
- Keybind: default là các key gồm phím điều hướng và phím space để bắn đạn
> Keybind sẽ được lưu vào browser storage

- Âm thanh: Điều chỉnh âm lượng (Optinal, tôi nên add không?)

3. Credit
- 1 Tab display những người đã đóng góp trong dự án này
