package openapi.model;

import java.util.Date;

/**
 * Match model class
 */
public class Match {
    private String matchId;
    private int playerId;
    private Date startTime;
    private Date endTime;
    
    public Match() {
    }
    
    public Match(String matchId, int playerId, Date startTime, Date endTime) {
        this.matchId = matchId;
        this.playerId = playerId;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public String getMatchId() {
        return matchId;
    }

    public void setMatchId(String matchId) {
        this.matchId = matchId;
    }

    public int getPlayerId() {
        return playerId;
    }

    public void setPlayerId(int playerId) {
        this.playerId = playerId;
    }

    public Date getStartTime() {
        return startTime;
    }

    public void setStartTime(Date startTime) {
        this.startTime = startTime;
    }

    public Date getEndTime() {
        return endTime;
    }

    public void setEndTime(Date endTime) {
        this.endTime = endTime;
    }
}
