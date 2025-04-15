package openapi.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import openapi.database.DatabaseConnection;
import openapi.model.Player;

/**
 * Data Access Object for Player entity
 */
public class PlayerDAO {
    
    /**
     * Create a new player
     * @param username Player's username
     * @return Created player object
     * @throws SQLException if database operation fails
     */
    public Player createPlayer(String username) throws SQLException {
        String checkSql = "SELECT COUNT(*) AS count FROM Player WHERE Username = ?";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
            
            checkStmt.setString(1, username);
            ResultSet rs = checkStmt.executeQuery();
            
            if (rs.next() && rs.getInt("count") > 0) {
                throw new SQLException("Username already exists");
            }
            
            String insertSql = "INSERT INTO Player (Username) VALUES (?); SELECT SCOPE_IDENTITY() AS playerId";
            try (PreparedStatement insertStmt = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
                insertStmt.setString(1, username);
                insertStmt.executeUpdate();
                
                try (ResultSet generatedKeys = insertStmt.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        Player player = new Player();
                        player.setPlayerId(generatedKeys.getInt(1));
                        player.setUsername(username);
                        return player;
                    } else {
                        throw new SQLException("Creating player failed, no ID obtained.");
                    }
                }
            }
        }
    }
    
    /**
     * Get a player by username
     * @param username Player's username
     * @return Player object if found, null otherwise
     * @throws SQLException if database operation fails
     */
    public Player getPlayerByUsername(String username) throws SQLException {
        String sql = "SELECT * FROM Player WHERE Username = ?";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, username);
            
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Player player = new Player();
                    player.setPlayerId(rs.getInt("PlayerID"));
                    player.setUsername(rs.getString("Username"));
                    return player;
                }
                return null;
            }
        }
    }
    
    /**
     * Delete a player by username
     * @param username Player's username
     * @return true if player was deleted, false otherwise
     * @throws SQLException if database operation fails
     */
    public boolean deletePlayer(String username) throws SQLException {
        String sql = "DELETE FROM Player WHERE Username = ?";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, username);
            int rowsAffected = stmt.executeUpdate();
            
            return rowsAffected > 0;
        }
    }
}
