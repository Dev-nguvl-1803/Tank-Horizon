# Tank Horizon API Documentation

This document provides details on how to interact with the Tank Horizon API endpoints for managing Players, Matches, and Match Results.

## Base URL

All API endpoints are relative to the base URL: `http://localhost:8080/api`

## Players API

### Create a new player
- **Endpoint**: `POST /player`
- **Description**: Creates a new player in the database.
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
    - 409 Conflict: Username already exists
    - 500 Internal Server Error

### Get player by username
- **Endpoint**: `GET /player/:username`
- **Description**: Retrieves player information by username.
- **Parameters**:
  - `username`: Player's username (URL parameter)
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
    - 404 Not Found: Player not found
    - 500 Internal Server Error

### Delete player by username
- **Endpoint**: `DELETE /player/:username`
- **Description**: Deletes a player by username.
- **Parameters**:
  - `username`: Player's username (URL parameter)
- **Response**:
  - **Status Code**: 200 (OK)
  - **Body**:
    ```json
    {
      "message": "Player deleted successfully"
    }
    ```
  - **Error Responses**:
    - 404 Not Found: Player not found
    - 500 Internal Server Error

## Matches API

### Create a new match
- **Endpoint**: `POST /matches`
- **Description**: Creates a new match with a specified room ID.
- **Request Body**:
  ```json
  {
    "roomId": "ABC123",
    "playerId": 1
  }
  ```
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
    - 400 Bad Request: Missing required fields
    - 500 Internal Server Error

### Get match by room ID
- **Endpoint**: `GET /matches/:roomId`
- **Description**: Retrieves match information by room ID.
- **Parameters**:
  - `roomId`: Room/Match ID (URL parameter, string)
- **Response**:
  - **Status Code**: 200 (OK)
  - **Body**:
    ```json
    {
      "MatchID": "ABC123",
      "PlayerID": 1,
      "Starttime": "2025-04-12T12:34:56.789Z",
      "Endtime": null
    }
    ```
  - **Error Responses**:
    - 404 Not Found: Match not found
    - 500 Internal Server Error

### Update match end time
- **Endpoint**: `PUT /matches/:roomId`
- **Description**: Updates the end time of a match when it completes.
- **Parameters**:
  - `roomId`: Room/Match ID (URL parameter, string)
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
    - 404 Not Found: Match not found
    - 500 Internal Server Error

### Delete match by room ID
- **Endpoint**: `DELETE /matches/:roomId`
- **Description**: Deletes a match by room ID.
- **Parameters**:
  - `roomId`: Room/Match ID (URL parameter, string)
- **Response**:
  - **Status Code**: 200 (OK)
  - **Body**:
    ```json
    {
      "message": "Match deleted successfully"
    }
    ```
  - **Error Responses**:
    - 404 Not Found: Match not found
    - 500 Internal Server Error

## Match Results API

### Create a new match result
- **Endpoint**: `POST /matchResult`
- **Description**: Creates a new match result record.
- **Request Body**:
  ```json
  {
    "matchId": "ABC123",
    "playerId": 1,
    "deviceId": "device123",
    "username": "PlayerName",
    "deviceName": "Player's Device",
    "numRound": 3,
    "status": "winner",
    "score": 1000
  }
  ```
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
    - 400 Bad Request: Missing required fields
    - 500 Internal Server Error

### Get match results by username
- **Endpoint**: `GET /matchResult/user/:username`
- **Description**: Retrieves all match results for a specific user.
- **Parameters**:
  - `username`: Player's username (URL parameter)
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
        "NumRound": 3,
        "Statu": "winner",
        "CreateTime": "2025-04-12T12:34:56.789Z",
        "Score": 1000,
        "Starttime": "2025-04-12T12:00:00.000Z",
        "Endtime": "2025-04-12T12:45:00.000Z"
      }
    ]
    ```
  - **Error Responses**:
    - 404 Not Found: No match results found
    - 500 Internal Server Error

### Get match results by match ID
- **Endpoint**: `GET /matchResult/match/:matchId`
- **Description**: Retrieves all match results for a specific match.
- **Parameters**:
  - `matchId`: Match ID (URL parameter, string)
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
        "NumRound": 3,
        "Statu": "winner",
        "CreateTime": "2025-04-12T12:34:56.789Z",
        "Score": 1000
      }
    ]
    ```
  - **Error Responses**:
    - 404 Not Found: No match results found
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