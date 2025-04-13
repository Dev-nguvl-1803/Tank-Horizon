import express from 'express';
import * as sql from 'mssql';
import { pool } from '../server';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { username } = req.body;
    const checkResult = await pool.request()
      .input('username', sql.NVarChar(100), username)
      .query('SELECT COUNT(*) AS count FROM Player WHERE Username = @username');
      if (checkResult.recordset[0].count > 0) {
      res.status(409).json({ error: 'Username already exists' });
    } else {
        const result = await pool.request()
          .input('username', sql.NVarChar(100), username)
          .query('INSERT INTO Player (Username) VALUES (@username); SELECT SCOPE_IDENTITY() AS playerId');
        
        res.status(201).json({ 
          message: 'Player created successfully',
          playerId: result.recordset[0].playerId,
          username
        });
    }
    
  } catch (err) {
    console.error('Error creating player:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
      const result = await pool.request()
      .input('username', sql.NVarChar(100), username)
      .query('SELECT * FROM Player WHERE Username = @username');
    
    if (result.recordset.length === 0) {
      res.status(404).json({ error: 'Player not found' });
    } else {   
      res.json(result.recordset[0]);
    }
  } catch (err) {
    console.error('Error getting player:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:username', async (req, res) => {
  try {
    const { username } = req.params;
      const result = await pool.request()
      .input('username', sql.NVarChar(100), username)
      .query('DELETE FROM Player WHERE Username = @username');
    
    if (result.rowsAffected[0] === 0) {
      res.status(404).json({ error: 'Player not found' });
    } else {
        res.json({ message: 'Player deleted successfully' });
    }
  } catch (err) {
    console.error('Error deleting player:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;