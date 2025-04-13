import express from 'express';
import * as sql from 'mssql';
import { pool } from '../server';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { roomId, playerId, startTime, endTime } = req.body;
    
    if (!roomId || !playerId) {
      res.status(400).json({ error: 'RoomID and PlayerID are required' });
    } else {
          const result = await pool.request()
          .input('matchId', sql.VarChar(255), roomId)
          .input('playerId', sql.Int, parseInt(playerId))
          .input('startTime', sql.DateTime, startTime)
          .input('endTime', sql.DateTime, endTime)
          .query(`
            INSERT INTO Matchs (MatchID, PlayerID, StartTime, EndTime) 
            VALUES (@matchId, @playerId, @startTime, @endTime);
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

router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
  const result = await pool.request()
      .input('roomId', sql.VarChar(255), roomId)
      .query('SELECT * FROM Matchs WHERE MatchID = @roomId');
    
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


router.put('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const endTime = new Date();
      const result = await pool.request()
      .input('roomId', sql.VarChar(255), roomId)
      .input('endTime', sql.DateTime, endTime)
      .query('UPDATE Matchs SET EndTime = @endTime WHERE MatchID = @roomId');
    
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

router.delete('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
      const result = await pool.request()
      .input('roomId', sql.VarChar(255), roomId)
      .query('DELETE FROM Matchs WHERE MatchID = @roomId');
    
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