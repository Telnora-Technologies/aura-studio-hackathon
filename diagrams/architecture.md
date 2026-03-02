# AURA Studio — Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER                                     │
│                  (Voice + Image Input)                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NEXT.JS FRONTEND                              │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Mic Input│  │ Image Upload │  │ Streaming Content Render │  │
│  └──────────┘  └──────────────┘  └──────────────────────────┘  │
│                    WebSocket / SSE                               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              CLOUD RUN BACKEND (Node.js)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Express + WebSocket                      │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │               AURA AGENT (ADK)                           │  │
│  │  ┌────────────┐ ┌──────────┐ ┌────────────┐             │  │
│  │  │ Creative   │ │Copywriter│ │Art Director│             │  │
│  │  │ Director   │ │          │ │            │             │  │
│  │  └────────────┘ └──────────┘ └────────────┘             │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                    TOOL CALLS                            │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │  │
│  │  │generate_image│ │save_campaign │ │store/load_session│ │  │
│  │  └──────┬───────┘ └──────┬───────┘ └────────┬─────────┘ │  │
│  └─────────┼────────────────┼──────────────────┼───────────┘  │
└────────────┼────────────────┼──────────────────┼──────────────┘
             │                │                  │
             ▼                ▼                  ▼
┌────────────────┐ ┌──────────────────┐ ┌────────────────────┐
│  VERTEX AI     │ │  CLOUD STORAGE   │ │    FIRESTORE       │
│ Gemini 1.5 Pro │ │ Campaign Assets  │ │  Session Memory    │
│ + Live API     │ │ Images / Packs   │ │                    │
└────────────────┘ └──────────────────┘ └────────────────────┘
```

## Data Flow

1. **User** speaks or types a campaign idea + optionally uploads brand assets
2. **Frontend** captures audio via Web Audio API, sends via WebSocket/SSE
3. **Backend** receives prompt, creates AURA Agent session
4. **AURA Agent** processes with Gemini 1.5 Pro, orchestrates tool calls
5. **Tools** generate images (Vertex AI), store assets (Cloud Storage), save sessions (Firestore)
6. **Streaming output** flows back through WebSocket/SSE to frontend
7. **Frontend** renders interleaved campaign sections in real-time

## Google Cloud Services Used

| Service | Purpose |
|---------|---------|
| Vertex AI | Gemini 1.5 Pro model + Live API |
| Cloud Run | Backend hosting (auto-scaling) |
| Cloud Storage | Generated images + campaign packs |
| Firestore | Session persistence + history |
| Secret Manager | API keys + credentials |
| Artifact Registry | Docker image storage |
| Cloud Build | CI/CD pipeline |
