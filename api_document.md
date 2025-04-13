# Tank Horizon API Documentation

Tài liệu này cung cấp thông tin chi tiết về cách tương tác với các API endpoint của Tank Horizon để quản lý Players, Matches và Match Results.

## Base URL

Tất cả các API endpoint đều liên quan đến URL cơ sở: `http://localhost:8080/api`

## Players API

### Tạo người chơi mới
- **Endpoint**: `POST /player`
- **Mô tả**: Tạo người chơi mới trong cơ sở dữ liệu với ID tự động tăng.
- **Request Body**:
  ```json
  {
    "username": "PlayerName"
  }
  ```
- **Response**:
  - **Status Code**: 201 (Created)
  - **Body**:
    ```json
    {
      "message": "Player created successfully",
      "playerId": 1,
      "username": "PlayerName"
    }
    ```
  - **Error Responses**:
    - 409 Conflict: Tên người dùng đã tồn tại
    - 500 Internal Server Error

### Lấy thông tin người chơi theo tên
- **Endpoint**: `GET /player/:username`
- **Mô tả**: Lấy thông tin người chơi theo tên người dùng.
- **Parameters**:
  - `username`: Tên người chơi (tham số URL)
- **Response**:
  - **Status Code**: 200 (OK)
  - **Body**:
    ```json
    {
      "PlayerID": 1,
      "Username": "PlayerName"
    }
    ```
  - **Error Responses**:
    - 404 Not Found: Không tìm thấy người chơi
    - 500 Internal Server Error

### Xóa người chơi theo tên
- **Endpoint**: `DELETE /player/:username`
- **Mô tả**: Xóa người chơi theo tên người dùng.
- **Parameters**:
  - `username`: Tên người chơi (tham số URL)
- **Response**:
  - **Status Code**: 200 (OK)
  - **Body**:
    ```json
    {
      "message": "Player deleted successfully"
    }
    ```
  - **Error Responses**:
    - 404 Not Found: Không tìm thấy người chơi
    - 500 Internal Server Error

## Matches API

### Tạo trận đấu mới
- **Endpoint**: `POST /matches`
- **Mô tả**: Tạo trận đấu mới với một ID phòng cụ thể.
- **Request Body**:
  ```json
  {
    "roomId": "ABC123",
    "playerId": 1
  }
  ```
  - Lưu ý: `playerId` phải là một số nguyên hợp lệ (INT) tham chiếu đến PlayerID trong bảng Player
- **Response**:
  - **Status Code**: 201 (Created)
  - **Body**:
    ```json
    {
      "message": "Match created successfully",
      "matchId": "ABC123",
      "startTime": "2025-04-12T12:34:56.789Z"
    }
    ```
  - **Error Responses**:
    - 400 Bad Request: Thiếu trường bắt buộc
    - 500 Internal Server Error

### Lấy trận đấu theo ID phòng
- **Endpoint**: `GET /matches/:roomId`
- **Mô tả**: Lấy thông tin trận đấu theo ID phòng.
- **Parameters**:
  - `roomId`: ID Phòng/Trận đấu (tham số URL, chuỗi)
- **Response**:
  - **Status Code**: 200 (OK)
  - **Body**:
    ```json
    {
      "MatchID": "ABC123",
      "PlayerID": 1,
      "StartTime": "2025-04-12T12:34:56.789Z",
      "EndTime": "2025-04-12T13:34:56.789Z"
    }
    ```
  - **Error Responses**:
    - 404 Not Found: Không tìm thấy trận đấu
    - 500 Internal Server Error

### Cập nhật thời gian kết thúc trận đấu
- **Endpoint**: `PUT /matches/:roomId`
- **Mô tả**: Cập nhật thời gian kết thúc của trận đấu khi nó hoàn thành.
- **Parameters**:
  - `roomId`: ID Phòng/Trận đấu (tham số URL, chuỗi)
- **Response**:
  - **Status Code**: 200 (OK)
  - **Body**:
    ```json
    {
      "message": "Match updated successfully",
      "endTime": "2025-04-12T13:34:56.789Z"
    }
    ```
  - **Error Responses**:
    - 404 Not Found: Không tìm thấy trận đấu
    - 500 Internal Server Error

### Xóa trận đấu theo ID phòng
- **Endpoint**: `DELETE /matches/:roomId`
- **Mô tả**: Xóa trận đấu theo ID phòng.
- **Parameters**:
  - `roomId`: ID Phòng/Trận đấu (tham số URL, chuỗi)
- **Response**:
  - **Status Code**: 200 (OK)
  - **Body**:
    ```json
    {
      "message": "Match deleted successfully"
    }
    ```
  - **Error Responses**:
    - 404 Not Found: Không tìm thấy trận đấu
    - 500 Internal Server Error

## Match Results API

### Tạo kết quả trận đấu mới
- **Endpoint**: `POST /matchResult`
- **Mô tả**: Tạo bản ghi kết quả trận đấu mới với ResultID tự động tăng.
- **Request Body**:
  ```json
  {
    "matchId": "ABC123",
    "playerId": 1,
    "deviceId": "device123",
    "username": "PlayerName",
    "deviceName": "Player's Device",
    "kd": "3/1",
    "numRound": 3,
    "status": "Victory",
    "score": 1000
  }
  ```
  - Lưu ý: `playerId` phải là số nguyên (INT) tham chiếu đến PlayerID trong bảng Player
- **Response**:
  - **Status Code**: 201 (Created)
  - **Body**:
    ```json
    {
      "message": "Match result created successfully",
      "resultId": 1
    }
    ```
  - **Error Responses**:
    - 400 Bad Request: Thiếu trường bắt buộc
    - 500 Internal Server Error

### Lấy kết quả trận đấu theo tên người dùng
- **Endpoint**: `GET /matchResult/user/:username`
- **Mô tả**: Lấy tất cả kết quả trận đấu cho một người dùng cụ thể.
- **Parameters**:
  - `username`: Tên người chơi (tham số URL)
- **Response**:
  - **Status Code**: 200 (OK)
  - **Body**:
    ```json
    [
      {
        "ResultID": 1,
        "MatchID": "ABC123",
        "PlayerID": 1,
        "DeviceID": "device123",
        "Username": "PlayerName",
        "DeviceName": "Player's Device",
        "KD": "3/1",
        "NumRound": 3,
        "Statu": "Victory",
        "CreateTime": "2025-04-12T12:34:56.789Z",
        "Score": 1000,
        "StartTime": "2025-04-12T12:00:00.000Z",
        "EndTime": "2025-04-12T12:45:00.000Z"
      }
    ]
    ```
  - **Error Responses**:
    - 404 Not Found: Không tìm thấy kết quả trận đấu
    - 500 Internal Server Error

### Lấy kết quả trận đấu theo ID trận đấu
- **Endpoint**: `GET /matchResult/match/:matchId`
- **Mô tả**: Lấy tất cả kết quả trận đấu cho một trận đấu cụ thể.
- **Parameters**:
  - `matchId`: ID trận đấu (tham số URL, chuỗi)
- **Response**:
  - **Status Code**: 200 (OK)
  - **Body**:
    ```json
    [
      {
        "ResultID": 1,
        "MatchID": "ABC123",
        "PlayerID": 1,
        "DeviceID": "device123",
        "Username": "PlayerName",
        "DeviceName": "Player's Device",
        "KD": "3/1",
        "NumRound": 3,
        "Statu": "Victory",
        "CreateTime": "2025-04-12T12:34:56.789Z",
        "Score": 1000
      }
    ]
    ```
  - **Error Responses**:
    - 404 Not Found: Không tìm thấy kết quả trận đấu
    - 500 Internal Server Error

## Lưu ý và cân nhắc khi sử dụng API

1. **Kiểu dữ liệu MatchID**: MatchID bây giờ là chuỗi NVARCHAR(6) thay vì số nguyên tự tăng như trước đây. Đảm bảo MatchID được cung cấp đúng định dạng.

2. **Xác thực**: API hiện tại không thực hiện xác thực. Để sử dụng trong môi trường sản xuất, cân nhắc thêm xác thực để bảo mật các endpoint.

3. **Xác thực dữ liệu**: Tất cả các endpoint thực hiện xác thực cơ bản đối với dữ liệu đầu vào, nhưng có thể cần thêm xác thực tùy thuộc vào yêu cầu của bạn.

4. **Xử lý lỗi**: API trả về các mã lỗi và thông báo phù hợp. Xử lý các lỗi này phù hợp trong ứng dụng khách của bạn.

5. **Thao tác cơ sở dữ liệu**:
   - Tất cả các thao tác cơ sở dữ liệu sử dụng truy vấn tham số hóa để ngăn chặn SQL injection.
   - Khóa ngoại đảm bảo tính toàn vẹn dữ liệu giữa các bảng có liên quan.

6. **Vòng đời trận đấu**:
   - Khi tạo trận đấu, `endtime` ban đầu được đặt thành NULL.
   - Sử dụng endpoint PUT để cập nhật thời gian kết thúc khi trận đấu hoàn thành.

7. **Kết quả trận đấu**:
   - Nhiều kết quả trận đấu có thể được liên kết với một trận đấu và người chơi.
   - Kết quả trận đấu được tổ chức theo vòng, cho phép tính điểm theo từng vòng.