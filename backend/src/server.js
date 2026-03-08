const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Resolve GOOGLE_APPLICATION_CREDENTIALS relative to project root
if (process.env.GOOGLE_APPLICATION_CREDENTIALS && !path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(__dirname, '../..', process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const sessionRoutes = require('./routes/session');
const generateRoutes = require('./routes/generate');
const assetRoutes = require('./routes/assets');
const { handleWebSocket } = require('./services/websocket');
const { requireAuth } = require('./middleware/firebaseAuth');

const app = express();
const server = http.createServer(app);

// WebSocket server for real-time voice streaming
const wss = new WebSocketServer({ server, path: '/ws' });

// Middleware
const allowedOrigin = process.env.FRONTEND_URL;
app.use(cors({
  origin: (origin, cb) => {
    if (!allowedOrigin || allowedOrigin === '*') return cb(null, true);
    return cb(null, origin === allowedOrigin);
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'aura-studio-backend' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/session', requireAuth, sessionRoutes);
app.use('/generate', requireAuth, generateRoutes);
app.use('/assets', requireAuth, assetRoutes);

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  console.log('[WS] Client connected');
  handleWebSocket(ws, req);
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`AURA Studio backend running on port ${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
});
