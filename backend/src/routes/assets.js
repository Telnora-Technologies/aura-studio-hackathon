const express = require('express');
const { listFiles } = require('../services/storage');

const router = express.Router();

// GET /assets — List all assets
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const files = await listFiles();
    res.json({ assets: files });
  } catch (err) {
    console.error('Error listing assets:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /assets/:id — Redirect to Cloud Storage URL
router.get('/:id', (req, res) => {
  const bucket = process.env.GCS_BUCKET || 'aura-studio-hack-assets';
  const url = `https://storage.googleapis.com/${bucket}/${req.params.id}`;
  res.redirect(url);
});

module.exports = router;
