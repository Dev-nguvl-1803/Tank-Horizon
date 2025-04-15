// filepath: c:\Users\FoobPC\Documents\NetBeansProjects\OpenAPI\src\openapi\OpenAPI.java
/*
 * OpenAPI implementation using Spark Java for CRUD operations on MSSQL Database
 */
package openapi;

import openapi.database.DatabaseConnection;
import openapi.routes.MatchResultRoutes;
import openapi.routes.MatchRoutes;
import openapi.routes.PlayerRoutes;
import static spark.Spark.before;
import static spark.Spark.delete;
import static spark.Spark.get;
import static spark.Spark.options;
import static spark.Spark.port;
import static spark.Spark.post;
import static spark.Spark.put;
import static spark.Spark.stop;

public class OpenAPI {

    public static void main(String[] args) {
        port(8008);
        
        enableCORS();
        
        
        post("/api/player", PlayerRoutes.createPlayer);
        get("/api/player/:username", PlayerRoutes.getPlayer);
        delete("/api/player/:username", PlayerRoutes.deletePlayer);
        
        post("/api/matches", MatchRoutes.createMatch);
        get("/api/matches/:roomId", MatchRoutes.getMatch);
        put("/api/matches/:roomId", MatchRoutes.updateMatch);
        delete("/api/matches/:roomId", MatchRoutes.deleteMatch);
        
        post("/api/matchresult", MatchResultRoutes.createMatchResult);
        get("/api/matchresult/user/:username", MatchResultRoutes.getMatchResultsByUsername);
        get("/api/matchresult/match/:matchId", MatchResultRoutes.getMatchResultsByMatchId);
        
        
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("Shutting down server...");
            stop();
            DatabaseConnection.closeConnection();
            System.out.println("Server stopped");
        }));
        
        System.out.println("OpenAPI server started on port 8008");
        System.out.println("Press Ctrl+C to stop the server");
    }
    
    private static void enableCORS() {
        options("/*", (request, response) -> {
            String accessControlRequestHeaders = request.headers("Access-Control-Request-Headers");
            if (accessControlRequestHeaders != null) {
                response.header("Access-Control-Allow-Headers", accessControlRequestHeaders);
            }
            
            String accessControlRequestMethod = request.headers("Access-Control-Request-Method");
            if (accessControlRequestMethod != null) {
                response.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            }
            
            return "OK";
        });
        
        before((request, response) -> {
            response.header("Access-Control-Allow-Origin", "*");
            response.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Content-Length, Accept, Origin");
            response.type("application/json");
        });
    }
}
