const { VertexAI } = require('@google-cloud/vertexai');
const { toolDefinitions, executeTool } = require('./tools');
const { AURA_SYSTEM_PROMPT } = require('../services/gemini');

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'aura-studio-hack';
const LOCATION = process.env.GCP_REGION || 'us-central1';
const MODEL_RAW = process.env.GEMINI_MODEL || 'gemini-2.0-flash-001';
const MODEL = MODEL_RAW.includes('/') ? MODEL_RAW.split('/').pop() : MODEL_RAW;

const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });

class AuraAgent {
  constructor(options = {}) {
    this.toolsEnabled = options.enableTools !== false;
    this.model = vertexAI.getGenerativeModel({
      model: MODEL,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.9,
        topP: 0.95,
      },
      systemInstruction: {
        parts: [{ text: AURA_SYSTEM_PROMPT }],
      },
      ...(this.toolsEnabled ? { tools: toolDefinitions } : {}),
    });
    this.chatHistory = [];
  }

  // Start a new chat session
  startChat() {
    this.chat = this.model.startChat({
      history: this.chatHistory,
    });
    return this;
  }

  // Send a message and handle tool calls automatically
  async sendMessage(prompt, imageBase64 = null) {
    if (!this.chat) {
      this.startChat();
    }

    const parts = [{ text: prompt }];

    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64,
        },
      });
    }

    let response = await this.chat.sendMessage(parts);
    let candidate = response.response.candidates[0];

    // Handle function calls in a loop (agent may call multiple tools)
    while (this.toolsEnabled && candidate.content.parts.some((p) => p.functionCall)) {
      const functionCallParts = candidate.content.parts.filter((p) => p.functionCall);
      const functionResponses = [];

      for (const part of functionCallParts) {
        console.log(`[Agent] Calling tool: ${part.functionCall.name}`);
        const result = await executeTool(part.functionCall);
        functionResponses.push({
          functionResponse: {
            name: part.functionCall.name,
            response: result,
          },
        });
      }

      // Send tool results back to the model
      response = await this.chat.sendMessage(functionResponses);
      candidate = response.response.candidates[0];
    }

    // Extract final text response
    const textParts = candidate.content.parts.filter((p) => p.text);
    return textParts.map((p) => p.text).join('');
  }

  // Streaming version with tool call handling
  async *sendMessageStream(prompt, imageBase64 = null) {
    if (!this.chat) {
      this.startChat();
    }

    const parts = [{ text: prompt }];

    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64,
        },
      });
    }

    const streamResult = await this.chat.sendMessageStream(parts);

    let functionCalls = [];

    for await (const chunk of streamResult.stream) {
      const candidate = chunk.candidates?.[0];
      if (!candidate) continue;

      for (const part of candidate.content.parts) {
        if (part.text) {
          yield { type: 'text', content: part.text };
        }
        if (part.functionCall) {
          if (this.toolsEnabled) {
            functionCalls.push(part.functionCall);
            yield { type: 'tool_call', name: part.functionCall.name, args: part.functionCall.args };
          }
        }
      }
    }

    // Execute any accumulated function calls
    if (this.toolsEnabled && functionCalls.length > 0) {
      const functionResponses = [];

      for (const fc of functionCalls) {
        const result = await executeTool(fc);
        yield { type: 'tool_result', name: fc.name, result };
        functionResponses.push({
          functionResponse: {
            name: fc.name,
            response: result,
          },
        });
      }

      // Send tool results back and stream the follow-up
      const followUp = await this.chat.sendMessageStream(functionResponses);

      for await (const chunk of followUp.stream) {
        const candidate = chunk.candidates?.[0];
        if (!candidate) continue;

        for (const part of candidate.content.parts) {
          if (part.text) {
            yield { type: 'text', content: part.text };
          }
        }
      }
    }
  }
}

module.exports = { AuraAgent };
