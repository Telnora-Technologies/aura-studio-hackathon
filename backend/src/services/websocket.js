const { generateCampaignStream } = require('./gemini');
const { storeSession } = require('./firestore');
const { v4: uuidv4 } = require('uuid');

function handleWebSocket(ws, req) {
  const sessionId = uuidv4();
  let isGenerating = false;
  let abortController = null;

  ws.send(JSON.stringify({
    type: 'session_start',
    sessionId,
    message: 'AURA Studio session started. Send your creative brief.',
  }));

  ws.on('message', async (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage.toString());

      switch (message.type) {
        case 'prompt': {
          // Handle interruption — cancel current generation
          if (isGenerating) {
            isGenerating = false;
            ws.send(JSON.stringify({ type: 'interrupted', message: 'Previous generation interrupted.' }));
          }

          isGenerating = true;
          const prompt = message.text || '';
          const image = message.image || null;

          ws.send(JSON.stringify({ type: 'generation_start', prompt }));

          let fullResponse = '';

          try {
            for await (const chunk of generateCampaignStream(prompt, image)) {
              if (!isGenerating) break; // Interrupted

              fullResponse += chunk;
              ws.send(JSON.stringify({ type: 'chunk', text: chunk }));
            }

            if (isGenerating) {
              // Save session to Firestore
              await storeSession(sessionId, {
                prompt,
                response: fullResponse,
                createdAt: new Date().toISOString(),
              });

              ws.send(JSON.stringify({
                type: 'generation_complete',
                sessionId,
                fullResponse,
              }));
            }
          } catch (err) {
            ws.send(JSON.stringify({ type: 'error', message: err.message }));
          }

          isGenerating = false;
          break;
        }

        case 'audio': {
          // Audio data from microphone — forward to Gemini Live API
          // This will be implemented with the Live API integration
          ws.send(JSON.stringify({
            type: 'audio_ack',
            message: 'Audio received. Live API processing coming soon.',
          }));
          break;
        }

        case 'interrupt': {
          isGenerating = false;
          ws.send(JSON.stringify({ type: 'interrupted', message: 'Generation interrupted by user.' }));
          break;
        }

        default:
          ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${message.type}` }));
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Client disconnected (session: ${sessionId})`);
    isGenerating = false;
  });

  ws.on('error', (err) => {
    console.error(`[WS] Error: ${err.message}`);
  });
}

module.exports = { handleWebSocket };
