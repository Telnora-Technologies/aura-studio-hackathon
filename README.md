# AURA Studio — Multimodal Creative Director

> A real-time multimodal AI agent that turns spoken ideas into complete mixed-media campaign packages — streaming text, visuals, and structured assets live.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI | Gemini 3.1 Pro (Vertex AI), Gemini Live API, Google ADK |
| Backend | Node.js, Express, WebSockets |
| Frontend | Next.js, TailwindCSS |
| Cloud | Vertex AI, Cloud Run, Firestore, Cloud Storage, Secret Manager |

## Architecture

```
User (voice + image)
       ↓
  Next.js Frontend
       ↓
  Cloud Run Backend (Node.js)
       ↓
  Gemini Live API (real-time streaming)
       ↓
  Gemini 3.1 Pro via Vertex AI
       ↓
  ADK Agent Orchestration
       ↓
  Tool Calls → Cloud Storage + Firestore
```

## Prerequisites

- Node.js 18+
- Google Cloud account with billing enabled
- `gcloud` CLI installed and authenticated

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd aura

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# Copy env template
cp .env.example .env

# Edit .env with your values
# Place your service-account-key.json in the project root
```

### 3. Google Cloud Setup

```bash
# Authenticate
gcloud auth login
gcloud config set project aura-studio-hack

# Enable APIs
gcloud services enable aiplatform.googleapis.com run.googleapis.com firestore.googleapis.com storage.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# Create resources
gcloud storage buckets create gs://aura-studio-hack-assets --location=us-central1 --uniform-bucket-level-access
gcloud firestore databases create --location=us-central1
```

### 4. Run Locally

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Backend runs on `http://localhost:8080`
Frontend runs on `http://localhost:3000`

### 5. Deploy to Cloud Run

```bash
# Backend
cd backend
gcloud run deploy aura-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=aura-studio-hack,GCS_BUCKET=aura-studio-hack-assets,GCP_REGION=us-central1"

# Frontend
cd ../frontend
npm run build
gcloud run deploy aura-frontend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

## Project Structure

```
aura/
├── backend/           # Node.js + Express API
│   ├── src/
│   │   ├── server.js        # Entry point
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Gemini, Storage, Firestore
│   │   ├── agent/           # ADK agent + tools
│   │   └── utils/           # Helpers
│   ├── Dockerfile
│   └── package.json
├── frontend/          # Next.js app
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # UI components
│   │   └── lib/             # Client utilities
│   └── package.json
├── infra/             # Terraform + deploy scripts
├── diagrams/          # Architecture diagrams
├── .env.example
├── .gitignore
└── README.md
```

## Features

- **Real-time Voice Interaction** — Interruptible, streaming responses
- **Interleaved Output** — Mixed text, images, strategy, storyboards in one flow
- **Tool-Driven Agent** — Image generation, file packaging, memory storage via ADK
- **Campaign Pack Export** — Downloadable structured asset pack

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLOUD_PROJECT` | GCP project ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account key JSON |
| `GCS_BUCKET` | Cloud Storage bucket name |
| `GCP_REGION` | GCP region (e.g., `us-central1`) |
| `PORT` | Backend server port (default: 8080) |
| `NEXT_PUBLIC_API_URL` | Backend API URL for frontend |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL for frontend |

## License

MIT
