package openapi.routes;

import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import openapi.dao.PlayerDAO;
import openapi.model.Player;
import openapi.util.JsonUtil;
import spark.Request;
import spark.Response;
import spark.Route;

/**
 * Routes for Player API
 */
public class PlayerRoutes {
    
    private static final PlayerDAO playerDAO = new PlayerDAO();
    
    /**
     * Create a new player
     */
    public static Route createPlayer = (Request request, Response response) -> {
        try {
            // Parse request body
            JsonObject requestJson = JsonParser.parseString(request.body()).getAsJsonObject();
            String username = requestJson.get("username").getAsString();
            
            if (username == null || username.isEmpty()) {
                response.status(400);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Username is required");
                return JsonUtil.toJson(error);
            }
            
            // Create player in database
            Player player = playerDAO.createPlayer(username);
            
            // Create response
            JsonUtil.setJsonResponse(response, 201);
            Map<String, Object> result = new HashMap<>();
            result.put("message", "Player created successfully");
            result.put("playerId", player.getPlayerId());
            result.put("username", player.getUsername());
            
            return JsonUtil.toJson(result);
        } catch (SQLException e) {
            if (e.getMessage().contains("already exists")) {
                response.status(409);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Username already exists");
                return JsonUtil.toJson(error);
            } else {
                response.status(500);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Internal server error: " + e.getMessage());
                return JsonUtil.toJson(error);
            }
        } catch (Exception e) {
            response.status(400);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid request: " + e.getMessage());
            return JsonUtil.toJson(error);
        }
    };
    
    /**
     * Get a player by username
     */
    public static Route getPlayer = (Request request, Response response) -> {
        try {
            String username = request.params(":username");
            Player player = playerDAO.getPlayerByUsername(username);
            
            if (player == null) {
                response.status(404);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Player not found");
                return JsonUtil.toJson(error);
            }
            
            JsonUtil.setJsonResponse(response, 200);
            Map<String, Object> result = new HashMap<>();
            result.put("PlayerID", player.getPlayerId());
            result.put("Username", player.getUsername());
            
            return JsonUtil.toJson(result);
        } catch (SQLException e) {
            response.status(500);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal server error: " + e.getMessage());
            return JsonUtil.toJson(error);
        }
    };
    
    /**
     * Delete a player by username
     */
    public static Route deletePlayer = (Request request, Response response) -> {
        try {
            String username = request.params(":username");
            boolean deleted = playerDAO.deletePlayer(username);
            
            if (!deleted) {
                response.status(404);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Player not found");
                return JsonUtil.toJson(error);
            }
            
            JsonUtil.setJsonResponse(response, 200);
            Map<String, String> result = new HashMap<>();
            result.put("message", "Player deleted successfully");
            return JsonUtil.toJson(result);
        } catch (SQLException e) {
            response.status(500);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal server error: " + e.getMessage());
            return JsonUtil.toJson(error);
        }
    };
}
