# Một dự án thật (PRO230) - Đồ án Tốt nghiệp - Ngọt_SD1803

- Tank Horizon là một tựa game tương tự "Tank Trouble" hay "A Z" nhưng tất nhiên là hay hơn chúng

# Tank Horizon (Website - Competitive Game)

- Tank Horizon là tựa game IO site được lấy cảm hứng từ tựa game Tank Trouble nhưng là phiên bản chơi multiplayer và không thể chơi offline hoặc local trong máy chủ người chơi

# Công nghệ
- Tank Horizon sử dụng công nghệ TypeScript, SocketIO, SQL Server (SSMS) để cấu hình chính, trong đó socketIO đảm bảo vấn đề Network và TypeScript giúp tránh bớt các vấn đề lỗi
- Ngoài ra SQL Server được sử dụng để lưu LeaderBoard, xếp hạng người chơi trên toàn thế giới
- PhaserJS, Engine được sử dụng để làm game

# Chức năng
- Map được random ngẫu nhiên
- Xe tăng được chọn theo 4 màu ngẫu nhiên từ CLient, Player không được phép chọn màu xe tăng
- Game chỉ chơi được nhiều người chơi với tối đa 1 phòng 4 người chơi, có thể có 2 người chơi hoặc 3 người chơi tùy chọn
- Giới hạn tối đa bắn 5 viên đạn chờ lượt đạn hết thì coi như xe tăng lên đạn
- Hệ thống sẽ ghi tên người chơi vào Database để ghi lên Top Score 
- Khi người chơi nào đạt được 1000 điểm người chơi đó sẽ chiến thắng và sau đó tính top cho các điểm còn lại
- Game rất cơ bản, gồm 4 loại hình giao diện:
1. Main Menu:
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

- Âm thanh: Điều chỉnh âm lượng (Optional, tôi nên add không?)

3. Credit
- 1 Tab display những người đã đóng góp trong dự án này
