package openapi.routes;

import java.sql.SQLException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import openapi.dao.MatchDAO;
import openapi.model.Match;
import openapi.util.JsonUtil;
import spark.Request;
import spark.Response;
import spark.Route;

/**
 * Routes for Match API
 */
public class MatchRoutes {
    
    private static final MatchDAO matchDAO = new MatchDAO();
    
    /**
     * Create a new match
     */    public static Route createMatch = (Request request, Response response) -> {
        try {
            // Parse request body
            JsonObject requestJson = JsonParser.parseString(request.body()).getAsJsonObject();
            
            // Kiểm tra các trường bắt buộc
            String[] requiredFields = {"roomId", "playerId", "startTime", "endTime"};
            for (String field : requiredFields) {
                if (!requestJson.has(field)) {
                    response.status(400);
                    Map<String, String> error = new HashMap<>();
                    error.put("error", "Thiếu trường bắt buộc: " + field);
                    return JsonUtil.toJson(error);
                }
            }
            
            // Lấy dữ liệu từ request
            String roomId = requestJson.get("roomId").getAsString();
            int playerId = requestJson.get("playerId").getAsInt();
            String startTimeStr = requestJson.get("startTime").getAsString();
            String endTimeStr = requestJson.get("endTime").getAsString();
            
            // Kiểm tra roomId
            if (roomId == null || roomId.isEmpty()) {
                response.status(400);
                Map<String, String> error = new HashMap<>();
                error.put("error", "RoomID không được để trống");
                return JsonUtil.toJson(error);
            }
            
            // Chuyển đổi định dạng thời gian
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
            Date startTime;
            Date endTime;
            
            try {
                startTime = dateFormat.parse(startTimeStr);
                endTime = dateFormat.parse(endTimeStr);
            } catch (ParseException e) {
                response.status(400);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Định dạng thời gian không hợp lệ. Sử dụng định dạng: yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
                return JsonUtil.toJson(error);
            }
            
            // Create match in database
            Match match = matchDAO.createMatch(roomId, playerId, startTime, endTime);
            
            // Create response
            JsonUtil.setJsonResponse(response, 201);
            Map<String, Object> result = new HashMap<>();
            result.put("message", "Match created successfully");
            result.put("matchId", match.getMatchId());
            result.put("startTime", JsonUtil.formatDate(match.getStartTime()));
            
            return JsonUtil.toJson(result);
        } catch (SQLException e) {
            response.status(500);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal server error: " + e.getMessage());
            return JsonUtil.toJson(error);
        } catch (Exception e) {
            response.status(400);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid request: " + e.getMessage());
            return JsonUtil.toJson(error);
        }
    };
    
    /**
     * Get a match by ID
     */
    public static Route getMatch = (Request request, Response response) -> {
        try {
            String roomId = request.params(":roomId");
            Match match = matchDAO.getMatchById(roomId);
            
            if (match == null) {
                response.status(404);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Match not found");
                return JsonUtil.toJson(error);
            }
            
            JsonUtil.setJsonResponse(response, 200);
            Map<String, Object> result = new HashMap<>();
            result.put("MatchID", match.getMatchId());
            result.put("PlayerID", match.getPlayerId());
            result.put("StartTime", JsonUtil.formatDate(match.getStartTime()));
            result.put("EndTime", JsonUtil.formatDate(match.getEndTime()));
            
            return JsonUtil.toJson(result);
        } catch (SQLException e) {
            response.status(500);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal server error: " + e.getMessage());
            return JsonUtil.toJson(error);
        }
    };
    
    /**
     * Update a match (set end time)
     */
    public static Route updateMatch = (Request request, Response response) -> {
        try {
            String roomId = request.params(":roomId");
            Date endTime = new Date();
            
            boolean updated = matchDAO.updateMatchEndTime(roomId, endTime);
            
            if (!updated) {
                response.status(404);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Match not found");
                return JsonUtil.toJson(error);
            }
            
            JsonUtil.setJsonResponse(response, 200);
            Map<String, Object> result = new HashMap<>();
            result.put("message", "Match updated successfully");
            result.put("endTime", JsonUtil.formatDate(endTime));
            
            return JsonUtil.toJson(result);
        } catch (SQLException e) {
            response.status(500);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal server error: " + e.getMessage());
            return JsonUtil.toJson(error);
        }
    };
    
    /**
     * Delete a match by ID
     */
    public static Route deleteMatch = (Request request, Response response) -> {
        try {
            String roomId = request.params(":roomId");
            boolean deleted = matchDAO.deleteMatch(roomId);
            
            if (!deleted) {
                response.status(404);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Match not found");
                return JsonUtil.toJson(error);
            }
            
            JsonUtil.setJsonResponse(response, 200);
            Map<String, String> result = new HashMap<>();
            result.put("message", "Match deleted successfully");
            
            return JsonUtil.toJson(result);
        } catch (SQLException e) {
            response.status(500);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal server error: " + e.getMessage());
            return JsonUtil.toJson(error);
        }
    };
}
