const express = require('express');
const { generateCampaign, generateCampaignStream } = require('../services/gemini');
const { uploadCampaignPack } = require('../services/storage');
const { storeSession } = require('../services/firestore');
const { AuraAgent } = require('../agent/aura-agent');
const { executeTool } = require('../agent/tools');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// POST /generate — Generate campaign using AURA agent (streaming via SSE)
router.post('/', async (req, res) => {
  const { prompt, image, sessionId, includeImages } = req.body;
  const userId = req.user?.uid;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sid = sessionId || uuidv4();

  // Set up Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Session-Id', sid);

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  // Send an initial event to prevent buffering/proxy timeouts
  res.write(`data: ${JSON.stringify({ type: 'generation_start', sessionId: sid })}\n\n`);

  let fullResponse = '';
  let generatedImages = [];
  const agent = new AuraAgent({ enableTools: Boolean(includeImages) });

  try {
    for await (const chunk of agent.sendMessageStream(prompt, image)) {
      if (chunk.type === 'text') {
        fullResponse += chunk.content;
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk.content })}\n\n`);
      } else if (chunk.type === 'tool_call') {
        res.write(`data: ${JSON.stringify({ type: 'tool_call', name: chunk.name, args: chunk.args })}\n\n`);
      } else if (chunk.type === 'tool_result') {
        if (chunk.name === 'generate_image' && chunk.result?.status === 'success' && chunk.result?.url) {
          generatedImages.push({ url: chunk.result.url, prompt: chunk.result.prompt || '' });
        }
        res.write(`data: ${JSON.stringify({ type: 'tool_result', name: chunk.name, result: chunk.result })}\n\n`);
      }
    }

    // Strip any markdown images that are not real URLs.
    // Models sometimes output placeholders like ![alt](image_prompt_here) which renders as broken media.
    fullResponse = String(fullResponse || '').replace(/!\[[^\]]*\]\((?!https?:\/\/)[^)]+\)/gi, '');

    // If requested, ensure we still produce a relevant hero visual.
    if (includeImages && generatedImages.length === 0) {
      try {
        const heroPrompt = `Hero image for campaign: ${prompt}. Photoreal, brand-safe, clean composition, studio lighting, marketing-ready.`;
        const result = await executeTool({
          name: 'generate_image',
          args: { prompt: heroPrompt, aspect_ratio: '16:9' },
        });

        if (result?.status === 'success' && result?.url) {
          generatedImages.push({ url: result.url, prompt: result.prompt || heroPrompt });
          res.write(`data: ${JSON.stringify({ type: 'tool_result', name: 'generate_image', result })}\n\n`);
          const md = `\n\n## Hero Creative\n\n![Hero creative](${result.url})\n`;
          fullResponse += md;
          res.write(`data: ${JSON.stringify({ type: 'chunk', text: md })}\n\n`);
        }
      } catch (e) {
        // Ignore image fallback failures; main text is still usable.
      }
    }

    // If images are enabled, also generate additional assets so the UI can display more than just the hero.
    // This prevents the model from leaving placeholders instead of real images.
    if (includeImages) {
      const autoImages = [];
      autoImages.push({
        title: 'Social Ad (Square)',
        aspect_ratio: '1:1',
        prompt: `Square social ad creative for campaign: ${prompt}. High contrast, minimal text, modern SaaS aesthetic, brand-safe, marketing-ready.`,
      });
      autoImages.push({
        title: 'Social Ad (Story)',
        aspect_ratio: '9:16',
        prompt: `Vertical story ad creative for campaign: ${prompt}. Modern layout, strong focal subject, minimal text, brand-safe, marketing-ready.`,
      });
      autoImages.push({
        title: 'Storyboard Keyframe 1',
        aspect_ratio: '16:9',
        prompt: `Storyboard keyframe 1 for campaign video: ${prompt}. Cinematic, marketing-friendly, brand-safe, clear subject.`,
      });
      autoImages.push({
        title: 'Storyboard Keyframe 2',
        aspect_ratio: '16:9',
        prompt: `Storyboard keyframe 2 for campaign video: ${prompt}. Cinematic, marketing-friendly, brand-safe, clear subject.`,
      });

      let appended = '';
      for (const img of autoImages) {
        try {
          const result = await executeTool({
            name: 'generate_image',
            args: { prompt: img.prompt, aspect_ratio: img.aspect_ratio },
          });
          if (result?.status === 'success' && result?.url) {
            generatedImages.push({ url: result.url, prompt: result.prompt || img.prompt });
            res.write(`data: ${JSON.stringify({ type: 'tool_result', name: 'generate_image', result })}\n\n`);
            appended += `\n\n### ${img.title}\n\n![${img.title}](${result.url})\n`;
          }
        } catch (e) {
          // Best-effort only.
        }
      }

      if (appended) {
        // Prefer to attach these under Visual Concepts / Storyboard if present; otherwise append at end.
        fullResponse += appended;
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: appended })}\n\n`);
      }
    }

    // Save to Firestore
    await storeSession(sid, {
      userId,
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
