import express from 'express';
import * as sql from 'mssql';
import { pool } from '../server';

const router = express.Router();

// Create a new match result
router.post('/', async (req, res) => {
    try {
        const {
            matchId,
            playerId,
            deviceId,
            username,
            deviceName,
            numRound,
            status,
            score
        } = req.body;

        // Validate required fields
        if (!matchId || !playerId || !username || !deviceId || !deviceName || !numRound || !status || score === undefined) {
            res.status(400).json({ error: 'All fields are required' });
        } else {
            const createTime = new Date();

            const result = await pool.request()
                .input('matchId', sql.NVarChar(6), matchId)
                .input('playerId', sql.Int, playerId)
                .input('deviceId', sql.NVarChar, deviceId)
                .input('username', sql.NVarChar, username)
                .input('deviceName', sql.NVarChar, deviceName)
                .input('numRound', sql.Int, numRound)
                .input('status', sql.NVarChar, status)
                .input('createTime', sql.DateTime, createTime)
                .input('score', sql.Int, score)
                .query(`
            INSERT INTO MatchResult 
              (MatchID, PlayerID, DeviceID, Username, DeviceName, NumRound, Statu, CreateTime, Score) 
            VALUES 
              (@matchId, @playerId, @deviceId, @username, @deviceName, @numRound, @status, @createTime, @score);
            SELECT SCOPE_IDENTITY() AS resultId;
          `);

            res.status(201).json({
                message: 'Match result created successfully',
                resultId: result.recordset[0].resultId
            });
        }
    } catch (err) {
        console.error('Error creating match result:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get match results by username
router.get('/user/:username', async (req, res) => {
    try {
        const { username } = req.params;

        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
        SELECT mr.*, m.Starttime, m.Endtime 
        FROM MatchResult mr
        JOIN Matches m ON mr.MatchID = m.MatchID
        WHERE mr.Username = @username
        ORDER BY mr.CreateTime DESC
      `);

        if (result.recordset.length === 0) {
            res.status(404).json({ error: 'No match results found for this username' });
        } else {
            res.json(result.recordset);
        }
    } catch (err) {
        console.error('Error getting match results:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get match results by match ID
router.get('/match/:matchId', async (req, res) => {
    try {
        const { matchId } = req.params;

        const result = await pool.request()
            .input('matchId', sql.NVarChar(6), matchId)
            .query(`
        SELECT * FROM MatchResult 
        WHERE MatchID = @matchId
        ORDER BY NumRound, Score DESC
      `);

        if (result.recordset.length === 0) {
            res.status(404).json({ error: 'No match results found for this match ID' });
        } else {
            res.json(result.recordset);
        }
    } catch (err) {
        console.error('Error getting match results:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;