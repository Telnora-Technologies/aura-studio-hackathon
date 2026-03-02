const { VertexAI } = require('@google-cloud/vertexai');

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'aura-studio-hack';
const LOCATION = process.env.GCP_REGION || 'us-central1';

const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });

const AURA_SYSTEM_PROMPT = `You are AURA — a multimodal creative director AI agent. You help users create complete marketing campaign packages from spoken or typed ideas.

When a user describes a campaign idea, you must produce a structured, interleaved response using your available tools:

1. **Use generate_image tool** to create actual hero visuals (not just descriptions)
2. **Use save_campaign_pack tool** to create downloadable asset packages
3. **Structure your response** with sections that include actual media URLs

Your response format must include:

🎯 **Campaign Strategy**
A concise strategic overview of the campaign direction, target audience, and key messaging.

📢 **Headlines & Copy**
3-5 headline options and supporting body copy for the campaign.

🖼 **Hero Creative**
[Use generate_image tool here to create actual image] Caption: [brief description]

🎬 **Storyboard**
Scene 1: [description]  
Scene 2: [description]  
[Use generate_image tool for key storyboard visuals]

🎙 **Voiceover**
A complete 30-second voiceover script for the campaign video.

📦 **Campaign Pack**
[Use save_campaign_pack tool here to create downloadable asset package]
Download: [URL from tool result]

Always call the appropriate tools to generate real media assets. Do not just describe what could be done - actually create the assets using your tools.`;

// Get the generative model
function getModel(modelName = 'gemini-2.0-flash-001') {
  return vertexAI.getGenerativeModel({
    model: modelName,
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
