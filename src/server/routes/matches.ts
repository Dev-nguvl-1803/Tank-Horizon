import express from 'express';
import * as sql from 'mssql';
import { pool } from '../server';

const router = express.Router();

// Create a new match with custom roomID as MatchID
router.post('/', async (req, res) => {
  try {
    const { roomId, playerId } = req.body;
    
    if (!roomId || !playerId) {
      res.status(400).json({ error: 'RoomID and PlayerID are required' });
    } else {
        const startTime = new Date();
        
        // Insert match with roomId as MatchID and null endtime
        const result = await pool.request()
          .input('matchId', sql.NVarChar(6), roomId)
          .input('playerId', sql.Int, playerId)
          .input('startTime', sql.DateTime, startTime)
          .query(`
            INSERT INTO Matches (MatchID, PlayerID, Starttime, Endtime) 
            VALUES (@matchId, @playerId, @startTime, NULL);
            SELECT @matchId AS matchId;
          `);
        
        res.status(201).json({ 
          message: 'Match created successfully',
          matchId: result.recordset[0].matchId,
          startTime
        });
    }
    
  } catch (err) {
    console.error('Error creating match:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get match by roomId
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const result = await pool.request()
      .input('roomId', sql.NVarChar(6), roomId)
      .query('SELECT * FROM Matches WHERE MatchID = @roomId');
    
    if (result.recordset.length === 0) {
      res.status(404).json({ error: 'Match not found' });
    } else {
        res.json(result.recordset[0]);
    }
    
  } catch (err) {
    console.error('Error getting match:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update match endtime by roomId
router.put('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const endTime = new Date();
    
    const result = await pool.request()
      .input('roomId', sql.NVarChar(6), roomId)
      .input('endTime', sql.DateTime, endTime)
      .query('UPDATE Matches SET Endtime = @endTime WHERE MatchID = @roomId');
    
    if (result.rowsAffected[0] === 0) {
      res.status(404).json({ error: 'Match not found' });
    } else {
        res.json({ 
          message: 'Match updated successfully',
          endTime
        });
    }
  } catch (err) {
    console.error('Error updating match:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete match by roomId
router.delete('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const result = await pool.request()
      .input('roomId', sql.NVarChar(6), roomId)
      .query('DELETE FROM Matches WHERE MatchID = @roomId');
    
    if (result.rowsAffected[0] === 0) {
      res.status(404).json({ error: 'Match not found' });
    } else {
        res.json({ message: 'Match deleted successfully' });
    }
  } catch (err) {
    console.error('Error deleting match:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;