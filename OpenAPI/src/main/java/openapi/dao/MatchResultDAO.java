package openapi.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

import openapi.database.DatabaseConnection;
import openapi.model.MatchResult;

/**
 * Data Access Object for MatchResult entity
 */
public class MatchResultDAO {
    
    /**
     * Create a new match result
     * @param matchResult The match result object to create
     * @return Created match result with generated ID
     * @throws SQLException if database operation fails
     */
    public MatchResult createMatchResult(MatchResult matchResult) throws SQLException {
        String sql = "INSERT INTO MatchResult "
                + "(MatchID, PlayerID, DeviceID, Username, DeviceName, KD, NumRound, Statu, CreateTime, Score) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            stmt.setString(1, matchResult.getMatchId());
            stmt.setInt(2, matchResult.getPlayerId());
            stmt.setString(3, matchResult.getDeviceId());
            stmt.setString(4, matchResult.getUsername());
            stmt.setString(5, matchResult.getDeviceName());
            stmt.setString(6, matchResult.getKd());
            stmt.setInt(7, matchResult.getNumRound());
            stmt.setString(8, matchResult.getStatus());  // Note: Database column is "Statu"
            stmt.setTimestamp(9, new Timestamp(System.currentTimeMillis()));
            stmt.setInt(10, matchResult.getScore());
            
            stmt.executeUpdate();
            
            try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    matchResult.setResultId(generatedKeys.getInt(1));
                    return matchResult;
                } else {
                    throw new SQLException("Creating match result failed, no ID obtained.");
                }
            }
        }
    }
    
    /**
     * Get match results by username
     * @param username Player's username
     * @return List of match results for the player
     * @throws SQLException if database operation fails
     */
    public List<MatchResult> getMatchResultsByUsername(String username) throws SQLException {
        String sql = "SELECT mr.*, m.StartTime, m.EndTime "
                + "FROM MatchResult mr "
                + "JOIN Matchs m ON mr.MatchID = m.MatchID "
                + "WHERE mr.Username = ? "
                + "ORDER BY mr.CreateTime DESC";
        
        List<MatchResult> results = new ArrayList<>();
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, username);
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    MatchResult result = new MatchResult();
                    result.setResultId(rs.getInt("ResultID"));
                    result.setMatchId(rs.getString("MatchID"));
                    result.setPlayerId(rs.getInt("PlayerID"));
                    result.setDeviceId(rs.getString("DeviceID"));
                    result.setUsername(rs.getString("Username"));
                    result.setDeviceName(rs.getString("DeviceName"));
                    result.setKd(rs.getString("KD"));
                    result.setNumRound(rs.getInt("NumRound"));
                    result.setStatus(rs.getString("Statu"));  // Note: Database column is "Statu"
                    result.setCreateTime(rs.getTimestamp("CreateTime"));
                    result.setScore(rs.getInt("Score"));
                    
                    results.add(result);
                }
            }
        }
        
        return results;
    }
    
    /**
     * Get match results by match ID
     * @param matchId Match ID
     * @return List of match results for the match
     * @throws SQLException if database operation fails
     */
    public List<MatchResult> getMatchResultsByMatchId(String matchId) throws SQLException {
        String sql = "SELECT * FROM MatchResult "
                + "WHERE MatchID = ? "
                + "ORDER BY NumRound, Score DESC";
        
        List<MatchResult> results = new ArrayList<>();
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, matchId);
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    MatchResult result = new MatchResult();
                    result.setResultId(rs.getInt("ResultID"));
                    result.setMatchId(rs.getString("MatchID"));
                    result.setPlayerId(rs.getInt("PlayerID"));
                    result.setDeviceId(rs.getString("DeviceID"));
                    result.setUsername(rs.getString("Username"));
                    result.setDeviceName(rs.getString("DeviceName"));
                    result.setKd(rs.getString("KD"));
                    result.setNumRound(rs.getInt("NumRound"));
                    result.setStatus(rs.getString("Statu"));  // Note: Database column is "Statu"
                    result.setCreateTime(rs.getTimestamp("CreateTime"));
                    result.setScore(rs.getInt("Score"));
                    
                    results.add(result);
                }
            }
        }
        
        return results;
    }
}
