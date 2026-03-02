const { uploadBase64Image, uploadCampaignPack } = require('../services/storage');
const { storeSession, loadSession } = require('../services/firestore');

// Tool definitions for Gemini function calling
const toolDefinitions = [
  {
    functionDeclarations: [
      {
        name: 'generate_image',
        description: 'Generate an image based on a text prompt and upload it to Cloud Storage. Returns the public URL of the generated image.',
        parameters: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Detailed description of the image to generate',
            },
            aspect_ratio: {
              type: 'string',
              description: 'Aspect ratio: "1:1", "16:9", "9:16", "4:3"',
              enum: ['1:1', '16:9', '9:16', '4:3'],
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'save_campaign_pack',
        description: 'Save all campaign assets as a downloadable JSON pack in Cloud Storage.',
        parameters: {
          type: 'object',
          properties: {
            campaign_data: {
              type: 'object',
              description: 'The full campaign data including strategy, copy, storyboard, and asset URLs',
            },
          },
          required: ['campaign_data'],
        },
      },
      {
        name: 'store_session',
        description: 'Save the current session data to Firestore for later retrieval.',
        parameters: {
          type: 'object',
          properties: {
            session_id: {
              type: 'string',
              description: 'Unique session identifier',
            },
            content: {
              type: 'object',
              description: 'Session content to store',
            },
          },
          required: ['session_id', 'content'],
        },
      },
      {
        name: 'load_session',
        description: 'Load a previously saved session from Firestore.',
        parameters: {
          type: 'object',
          properties: {
            session_id: {
              type: 'string',
              description: 'Session identifier to load',
            },
          },
          required: ['session_id'],
        },
      },
    ],
  },
];

// Tool execution handlers
async function executeTool(functionCall) {
  const { name, args } = functionCall;

  switch (name) {
    case 'generate_image': {
      try {
        // Placeholder: Use stock images for demo (in production, this would use Imagen API)
        // For hackathon demo, return relevant stock image URLs that fit creative briefs
        const prompt = args.prompt.toLowerCase();

        let imageUrl;
        if (prompt.includes('sneaker') || prompt.includes('shoe')) {
          imageUrl = 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop';
        } else if (prompt.includes('eco') || prompt.includes('green') || prompt.includes('nature')) {
          imageUrl = 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop';
        } else if (prompt.includes('urban') || prompt.includes('city') || prompt.includes('street')) {
          imageUrl = 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop';
        } else if (prompt.includes('fashion') || prompt.includes('style')) {
          imageUrl = 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=600&fit=crop';
        } else {
          // Default creative image
          imageUrl = 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=600&fit=crop';
        }

        console.log(`[Tool] generate_image: ${imageUrl} for prompt: ${args.prompt}`);

        // For demo purposes, return the stock image URL directly
        // In production, this would generate and upload to Cloud Storage
        return {
          status: 'success',
          url: imageUrl,
          prompt: args.prompt,
          aspect_ratio: args.aspect_ratio || '1:1',
          note: 'Demo using stock image - production would use Imagen API',
        };
      } catch (err) {
        console.error('Image generation error:', err);
        return {
          status: 'error',
          message: `Image generation failed: ${err.message}`,
        };
      }
    }

    case 'save_campaign_pack': {
      const sessionId = args.campaign_data?.sessionId || 'default';
      const result = await uploadCampaignPack(args.campaign_data, sessionId);
      console.log(`[Tool] save_campaign_pack: ${result.url}`);
      return { status: 'success', url: result.url };
    }

    case 'store_session': {
      const result = await storeSession(args.session_id, args.content);
      console.log(`[Tool] store_session: ${args.session_id}`);
      return result;
    }

    case 'load_session': {
      const session = await loadSession(args.session_id);
      console.log(`[Tool] load_session: ${args.session_id}`);
      return session || { status: 'not_found' };
    }

    default:
      return { status: 'error', message: `Unknown tool: ${name}` };
  }
}

module.exports = { toolDefinitions, executeTool };
