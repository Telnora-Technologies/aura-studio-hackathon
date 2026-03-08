const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { storeSession, loadSessionForUser, listSessionsByUser } = require('../services/firestore');

const router = express.Router();

// POST /session/start — Create a new session
router.post('/start', async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const sessionId = uuidv4();
    await storeSession(sessionId, {
      userId,
      status: 'active',
      createdAt: new Date().toISOString(),
      prompt: '',
      response: '',
    });
    res.json({ sessionId, status: 'active' });
  } catch (err) {
    console.error('Error starting session:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /session/:id — Load a session
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const session = await loadSessionForUser(req.params.id, userId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (err) {
    console.error('Error loading session:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /session — List all sessions
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const sessions = await listSessionsByUser(userId);
    res.json({ sessions });
  } catch (err) {
    console.error('Error listing sessions:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
