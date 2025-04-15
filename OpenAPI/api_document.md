# Tài liệu API - OpenAPI Java

## Giới thiệu

OpenAPI là một RESTful API cho phép thực hiện các thao tác CRUD (Create, Read, Update, Delete) trên ba đối tượng chính: Player, Match và MatchResult. API được xây dựng bằng ngôn ngữ Java với Spark Framework và kết nối tới cơ sở dữ liệu MS SQL Server thông qua JDBC.

## Cài đặt và triển khai

### Yêu cầu hệ thống
- Java JDK 11 trở lên
- Maven 3.6 trở lên
- MS SQL Server
- Cơ sở dữ liệu được cấu hình sẵn với các bảng: Player, Matchs, MatchResult

### Cài đặt
1. Clone hoặc tải dự án về máy
2. Cấu hình kết nối database trong file `src/main/java/openapi/database/DatabaseConnection.java`:
   ```java
   private static final String JDBC_URL = "jdbc:sqlserver://localhost:1433;databaseName=YourDatabase;trustServerCertificate=true";
   private static final String USERNAME = "sa";
   private static final String PASSWORD = "your_password";
   ```
3. Biên dịch dự án sử dụng Maven:
   ```cmd
   mvn clean package
   ```
4. Chạy ứng dụng:
   ```cmd
   mvn exec:java
   ```
5. Mặc định server chạy ở cổng 8080, thông báo sẽ hiện trên console:
   ```
   OpenAPI server started on port 8080
   Press Ctrl+C to stop the server
   ```

## Cấu trúc cơ sở dữ liệu

### Bảng Player
```sql
CREATE TABLE Player (
    PlayerID INT IDENTITY(1,1) NOT NULL,
    Username NVARCHAR(100) NOT NULL,
    PRIMARY KEY (PlayerID)
);
```

### Bảng Matchs
```sql
CREATE TABLE Matchs (
    MatchID VARCHAR(255) NOT NULL,
    PlayerID INT NOT NULL,
    StartTime DATETIME NOT NULL,
    EndTime DATETIME NOT NULL,
    PRIMARY KEY (MatchID),
    CONSTRAINT fk_Matchs_Player FOREIGN KEY (PlayerID)
        REFERENCES Player(PlayerID)
        ON DELETE NO ACTION
);
```

### Bảng MatchResult
```sql
CREATE TABLE MatchResult (
    ResultID INT IDENTITY(1,1) NOT NULL,
    MatchID VARCHAR(255) NOT NULL,
    PlayerID INT NOT NULL,
    DeviceID VARCHAR(255) NOT NULL,
    Username NVARCHAR(100) NOT NULL,
    DeviceName NVARCHAR(100) NOT NULL,
    KD VARCHAR(255) NOT NULL,
    NumRound INT NOT NULL,
    Statu VARCHAR(10) NOT NULL,
    CreateTime DATETIME NOT NULL,
    Score INT NOT NULL,
    PRIMARY KEY (ResultID),
    CONSTRAINT fk_MatchResult_Matchs FOREIGN KEY (MatchID)
        REFERENCES Matchs(MatchID)
        ON DELETE NO ACTION,
    CONSTRAINT fk_MatchResult_Player FOREIGN KEY (PlayerID)
        REFERENCES Player(PlayerID)
        ON DELETE NO ACTION
);
```

## API Endpoints

### Player API

#### Tạo Player mới
**Endpoint:** `POST /api/player`

**Request Body:**
```json
{
  "username": "playerName"
}
```

**Response (201 Created):**
```json
{
  "message": "Player created successfully",
  "playerId": 1,
  "username": "playerName"
}
```

**Response (409 Conflict):**
```json
{
  "error": "Username already exists"
}
```

#### Lấy thông tin Player
**Endpoint:** `GET /api/player/:username`

**Response (200 OK):**
```json
{
  "PlayerID": 1,
  "Username": "playerName"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Player not found"
}
```

#### Xóa Player
**Endpoint:** `DELETE /api/player/:username`

**Response (200 OK):**
```json
{
  "message": "Player deleted successfully"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Player not found"
}
```

### Match API

#### Tạo Match mới
**Endpoint:** `POST /api/matches`

**Request Body:**
```json
{
  "roomId": "match123",
  "playerId": 1,
  "startTime": "2023-04-15T10:30:00.000Z",
  "endTime": "2023-04-15T11:30:00.000Z"
}
```

**Response (201 Created):**
```json
{
  "message": "Match created successfully",
  "matchId": "match123",
  "startTime": "2023-04-15T10:30:00.000Z"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Thiếu trường bắt buộc: startTime"
}
```
hoặc
```json
{
  "error": "Định dạng thời gian không hợp lệ. Sử dụng định dạng: yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
}
```

#### Lấy thông tin Match
**Endpoint:** `GET /api/matches/:roomId`

**Response (200 OK):**
```json
{
  "MatchID": "match123",
  "PlayerID": 1,
  "StartTime": "2023-04-15T10:30:00.000Z",
  "EndTime": "2023-04-15T11:30:00.000Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Match not found"
}
```

#### Cập nhật Match (kết thúc trận đấu)
**Endpoint:** `PUT /api/matches/:roomId`

**Response (200 OK):**
```json
{
  "message": "Match updated successfully",
  "endTime": "2023-04-15T11:30:00.000Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Match not found"
}
```

#### Xóa Match
**Endpoint:** `DELETE /api/matches/:roomId`

**Response (200 OK):**
```json
{
  "message": "Match deleted successfully"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Match not found"
}
```

### MatchResult API

#### Tạo MatchResult mới
**Endpoint:** `POST /api/matchresult`

**Request Body:**
```json
{
  "matchId": "match123",
  "playerId": 1,
  "deviceId": "device123",
  "username": "playerName",
  "deviceName": "Test Device",
  "kd": "5/2",
  "numRound": 1,
  "status": "completed",
  "score": 100
}
```

**Response (201 Created):**
```json
{
  "message": "Match result created successfully",
  "resultId": 1
}
```

#### Lấy kết quả theo người chơi
**Endpoint:** `GET /api/matchresult/user/:username`

**Response (200 OK):**
```json
[
  {
    "ResultID": 1,
    "MatchID": "match123",
    "PlayerID": 1,
    "DeviceID": "device123",
    "Username": "playerName",
    "DeviceName": "Test Device",
    "KD": "5/2",
    "NumRound": 1,
    "Status": "completed",
    "CreateTime": "2023-04-15T10:45:00.000Z",
    "Score": 100
  }
]
```

**Response (404 Not Found):**
```json
{
  "error": "No match results found for this username"
}
```

#### Lấy kết quả theo trận đấu
**Endpoint:** `GET /api/matchresult/match/:matchId`

**Response (200 OK):**
```json
[
  {
    "ResultID": 1,
    "MatchID": "match123",
    "PlayerID": 1,
    "DeviceID": "device123",
    "Username": "playerName",
    "DeviceName": "Test Device",
    "KD": "5/2",
    "NumRound": 1,
    "Status": "completed",
    "CreateTime": "2023-04-15T10:45:00.000Z",
    "Score": 100
  }
]
```

**Response (404 Not Found):**
```json
{
  "error": "No match results found for this match ID"
}
```

## Ví dụ sử dụng API từ JavaScript

### Tạo Player mới
```javascript
fetch('http://localhost:8080/api/player', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'playerName'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Tạo Match mới
```javascript
fetch('http://localhost:8080/api/matches', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    roomId: 'match123',
    playerId: 1
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Tạo MatchResult mới
```javascript
fetch('http://localhost:8080/api/matchresult', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    matchId: 'match123',
    playerId: 1,
    deviceId: 'device123',
    username: 'playerName',
    deviceName: 'Test Device',
    kd: '5/2',
    numRound: 1,
    status: 'completed',
    score: 100
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## Xử lý lỗi thường gặp

1. **Lỗi kết nối database**:
   - Kiểm tra cấu hình kết nối trong `DatabaseConnection.java`
   - Đảm bảo SQL Server đang chạy và cổng 1433 được mở
   - Kiểm tra tên database, username và password

2. **Lỗi không tìm thấy JDBC driver**:
   - Đảm bảo dependency MSSQL JDBC được khai báo đúng trong pom.xml
   - Chạy lệnh `mvn clean package` để tải lại các dependency

3. **Lỗi cổng bị chiếm**:
   - Nếu cổng 8080 đã bị sử dụng, thay đổi cổng trong file `OpenAPI.java`:
     ```java
     port(8080); // Thay đổi thành cổng khác, ví dụ: 8008
     ```

## Khắc phục sự cố

- Nếu có lỗi `ClassNotFoundException`, kiểm tra cấu trúc thư mục nguồn đảm bảo tất cả mã nguồn nằm trong thư mục `src/main/java/openapi` theo cấu trúc Maven.

- Nếu xuất hiện lỗi khi tương tác với database, kiểm tra logs để xác định nguyên nhân và cấu trúc bảng dữ liệu đã đúng với yêu cầu hay chưa.

- Để debug, bạn có thể thêm các dòng log bằng `System.out.println()` vào những vị trí phù hợp trong code.
