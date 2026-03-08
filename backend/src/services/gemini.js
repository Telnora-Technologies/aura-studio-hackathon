const { VertexAI } = require('@google-cloud/vertexai');

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'aura-studio-hack';
const LOCATION = process.env.GCP_REGION || 'us-central1';

const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });

function normalizeModelId(modelId) {
  if (!modelId) return modelId;
  // Accept either "gemini-..." or full "publishers/google/models/gemini-..."
  if (modelId.includes('/')) {
    return modelId.split('/').pop();
  }
  return modelId;
}

const DEFAULT_MODEL = normalizeModelId(process.env.GEMINI_MODEL) || 'gemini-2.0-flash-001';

const AURA_SYSTEM_PROMPT = `You are AURA — a multimodal creative director AI agent.

Your output is rendered in a studio UI as stacked “cards”. To make this work, you MUST:

1) Use clear markdown headings that match these exact section titles:
   - ## Campaign Strategy
   - ## Visual Concepts
   - ## Ad Headlines
   - ## Storyboard
   - ## Voiceover Script

2) If imagery is requested/allowed (tools enabled), DO NOT describe images in text. Instead:
   - Call the generate_image tool.
   - Embed the resulting URL directly in markdown like: ![Hero Image](https://...)
   - Provide a short caption under each image.
   - You are allowed to create MULTIPLE images in a single response (hero + 2-3 social ad variations + 2-4 storyboard keyframes), as long as they are relevant.

3) Keep each section compact and scannable.

4) When done, call save_campaign_pack to produce a downloadable bundle.

Required structure:

## Campaign Strategy
- Audience
- Positioning
- Offer
- Channels

## Visual Concepts
- 3 concepts (name + one-liner)
- Hero image (generate_image) and up to 2 social variations (generate_image)

## Ad Headlines
- 6-10 headline options

## Storyboard
- 4-8 scenes (short bullets)
- 2-4 keyframes (generate_image)

## Voiceover Script
- 20–30 seconds

## Campaign Pack
- Call save_campaign_pack
- Output the download URL

Always call tools to produce real assets when tools are available.`;

// Get the generative model
function getModel(modelName = DEFAULT_MODEL) {
  return vertexAI.getGenerativeModel({
    model: normalizeModelId(modelName),
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.9,
      topP: 0.95,
    },
    systemInstruction: {
      parts: [{ text: AURA_SYSTEM_PROMPT }],
    },
  });
}

// Generate campaign content (non-streaming)
async function generateCampaign(prompt, imageBase64 = null) {
  const model = getModel();

  const parts = [{ text: prompt }];

  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    });
  }

  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
  });

  return result.response.candidates[0].content.parts[0].text;
}

// Generate campaign content (streaming)
async function* generateCampaignStream(prompt, imageBase64 = null) {
  const model = getModel();

  const parts = [{ text: prompt }];

  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    });
  }

  const streamingResult = await model.generateContentStream({
    contents: [{ role: 'user', parts }],
  });

  for await (const chunk of streamingResult.stream) {
    const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      yield text;
    }
  }
}

module.exports = {
  generateCampaign,
  generateCampaignStream,
  getModel,
  AURA_SYSTEM_PROMPT,
};
