package openapi.routes;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.sql.SQLException;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import openapi.dao.MatchResultDAO;
import openapi.model.MatchResult;
import openapi.util.JsonUtil;
import spark.Request;
import spark.Response;
import spark.Route;

/**
 * Routes for MatchResult API
 */
public class MatchResultRoutes {
    
    private static final MatchResultDAO matchResultDAO = new MatchResultDAO();
    
    /**
     * Create a new match result
     */
    public static Route createMatchResult = (Request request, Response response) -> {
        try {
            // Parse request body
            JsonObject requestJson = JsonParser.parseString(request.body()).getAsJsonObject();
            
            // Extract parameters from JSON
            String matchId = requestJson.get("matchId").getAsString();
            int playerId = requestJson.get("playerId").getAsInt();
            String deviceId = requestJson.get("deviceId").getAsString();
            String username = requestJson.get("username").getAsString();
            String deviceName = requestJson.get("deviceName").getAsString();
            String kd = requestJson.get("kd").getAsString();
            int numRound = requestJson.get("numRound").getAsInt();
            String status = requestJson.get("status").getAsString();
            int score = requestJson.get("score").getAsInt();
            
            // Validate required fields
            if (matchId == null || deviceId == null || username == null || 
                    deviceName == null || kd == null || status == null) {
                response.status(400);
                Map<String, String> error = new HashMap<>();
                error.put("error", "All fields are required");
                return JsonUtil.toJson(error);
            }
            
            // Create MatchResult object
            MatchResult result = new MatchResult();
            result.setMatchId(matchId);
            result.setPlayerId(playerId);
            result.setDeviceId(deviceId);
            result.setUsername(username);
            result.setDeviceName(deviceName);
            result.setKd(kd);
            result.setNumRound(numRound);
            result.setStatus(status);
            result.setCreateTime(new Date());
            result.setScore(score);
            
            // Save to database
            result = matchResultDAO.createMatchResult(result);
            
            // Create response
            JsonUtil.setJsonResponse(response, 201);
            Map<String, Object> responseMap = new HashMap<>();
            responseMap.put("message", "Match result created successfully");
            responseMap.put("resultId", result.getResultId());
            
            return JsonUtil.toJson(responseMap);
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
     * Get match results by username
     */
    public static Route getMatchResultsByUsername = (Request request, Response response) -> {
        try {
            String username = request.params(":username");
            
            List<MatchResult> results = matchResultDAO.getMatchResultsByUsername(username);
            
            if (results.isEmpty()) {
                response.status(404);
                Map<String, String> error = new HashMap<>();
                error.put("error", "No match results found for this username");
                return JsonUtil.toJson(error);
            }
            
            JsonUtil.setJsonResponse(response, 200);
            return JsonUtil.toJson(results);
        } catch (SQLException e) {
            response.status(500);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal server error: " + e.getMessage());
            return JsonUtil.toJson(error);
        }
    };
    
    /**
     * Get match results by match ID
     */
    public static Route getMatchResultsByMatchId = (Request request, Response response) -> {
        try {
            String matchId = request.params(":matchId");
            
            List<MatchResult> results = matchResultDAO.getMatchResultsByMatchId(matchId);
            
            if (results.isEmpty()) {
                response.status(404);
                Map<String, String> error = new HashMap<>();
                error.put("error", "No match results found for this match ID");
                return JsonUtil.toJson(error);
            }
            
            JsonUtil.setJsonResponse(response, 200);
            return JsonUtil.toJson(results);
        } catch (SQLException e) {
            response.status(500);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal server error: " + e.getMessage());
            return JsonUtil.toJson(error);
        }
    };
}
