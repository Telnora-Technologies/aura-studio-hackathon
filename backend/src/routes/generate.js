const express = require('express');
const { generateCampaign, generateCampaignStream } = require('../services/gemini');
const { uploadCampaignPack } = require('../services/storage');
const { storeSession } = require('../services/firestore');
const { AuraAgent } = require('../agent/aura-agent');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// POST /generate — Generate campaign using AURA agent (streaming via SSE)
router.post('/', async (req, res) => {
  const { prompt, image, sessionId } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const sid = sessionId || uuidv4();

  // Set up Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Session-Id', sid);

  let fullResponse = '';
  const agent = new AuraAgent();

  try {
    for await (const chunk of agent.sendMessageStream(prompt, image)) {
      if (chunk.type === 'text') {
        fullResponse += chunk.content;
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk.content })}\n\n`);
      } else if (chunk.type === 'tool_call') {
        res.write(`data: ${JSON.stringify({ type: 'tool_call', name: chunk.name, args: chunk.args })}\n\n`);
      } else if (chunk.type === 'tool_result') {
        res.write(`data: ${JSON.stringify({ type: 'tool_result', name: chunk.name, result: chunk.result })}\n\n`);
      }
    }

    // Save to Firestore
    await storeSession(sid, {
      prompt,
      response: fullResponse,
      createdAt: new Date().toISOString(),
      status: 'completed',
    });

    res.write(`data: ${JSON.stringify({ type: 'complete', sessionId: sid })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Generation error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  }
});

// POST /generate/sync — Non-streaming generation
router.post('/sync', async (req, res) => {
  const { prompt, image } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const response = await generateCampaign(prompt, image);
    res.json({ response });
  } catch (err) {
    console.error('Generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
