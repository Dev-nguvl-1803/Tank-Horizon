package openapi.model;

/**
 * Player model class
 */
public class Player {
    private int playerId;
    private String username;
    
    public Player() {
    }
    
    public Player(int playerId, String username) {
        this.playerId = playerId;
        this.username = username;
    }
    
    public int getPlayerId() {
        return playerId;
    }
    
    public void setPlayerId(int playerId) {
        this.playerId = playerId;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
}
