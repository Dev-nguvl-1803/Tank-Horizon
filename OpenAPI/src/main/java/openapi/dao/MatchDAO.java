package openapi.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Date;
import openapi.database.DatabaseConnection;
import openapi.model.Match;

/**
 * Data Access Object for Match entity
 */
public class MatchDAO {
    
    /**
     * Create a new match
     * @param matchId Match ID
     * @param playerId Player ID
     * @param startTime Start time
     * @param endTime End time
     * @return Created match object
     * @throws SQLException if database operation fails
     */
    public Match createMatch(String matchId, int playerId, Date startTime, Date endTime) throws SQLException {
        String sql = "INSERT INTO Matchs (MatchID, PlayerID, StartTime, EndTime) VALUES (?, ?, ?, ?)";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, matchId);
            stmt.setInt(2, playerId);
            stmt.setTimestamp(3, startTime != null ? new java.sql.Timestamp(startTime.getTime()) : null);
            stmt.setTimestamp(4, endTime != null ? new java.sql.Timestamp(endTime.getTime()) : null);
            
            int rowsAffected = stmt.executeUpdate();
            
            if (rowsAffected > 0) {
                Match match = new Match();
                match.setMatchId(matchId);
                match.setPlayerId(playerId);
                match.setStartTime(startTime);
                match.setEndTime(endTime);
                return match;
            } else {
                throw new SQLException("Creating match failed, no rows affected.");
            }
        }
    }
    
    /**
     * Get a match by its ID
     * @param matchId Match ID
     * @return Match object if found, null otherwise
     * @throws SQLException if database operation fails
     */
    public Match getMatchById(String matchId) throws SQLException {
        String sql = "SELECT * FROM Matchs WHERE MatchID = ?";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, matchId);
            
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Match match = new Match();
                    match.setMatchId(rs.getString("MatchID"));
                    match.setPlayerId(rs.getInt("PlayerID"));
                    match.setStartTime(rs.getTimestamp("StartTime"));
                    match.setEndTime(rs.getTimestamp("EndTime"));
                    return match;
                }
                return null;
            }
        }
    }
    
    /**
     * Update a match's end time
     * @param matchId Match ID
     * @param endTime End time
     * @return true if match was updated, false otherwise
     * @throws SQLException if database operation fails
     */
    public boolean updateMatchEndTime(String matchId, Date endTime) throws SQLException {
        String sql = "UPDATE Matchs SET EndTime = ? WHERE MatchID = ?";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setTimestamp(1, new java.sql.Timestamp(endTime.getTime()));
            stmt.setString(2, matchId);
            
            int rowsAffected = stmt.executeUpdate();
            return rowsAffected > 0;
        }
    }
    
    /**
     * Delete a match by its ID
     * @param matchId Match ID
     * @return true if match was deleted, false otherwise
     * @throws SQLException if database operation fails
     */
    public boolean deleteMatch(String matchId) throws SQLException {
        String sql = "DELETE FROM Matchs WHERE MatchID = ?";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, matchId);
            int rowsAffected = stmt.executeUpdate();
            
            return rowsAffected > 0;
        }
    }
}
