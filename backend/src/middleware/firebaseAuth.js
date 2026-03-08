const admin = require('firebase-admin');

let initialized = false;

function initFirebaseAdmin() {
  if (initialized) return;

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;

  // Use Application Default Credentials (works on Cloud Run when service account has permissions).
  admin.initializeApp({
    projectId,
    credential: admin.credential.applicationDefault(),
  });

  initialized = true;
}

function requireAuth(req, res, next) {
  try {
    initFirebaseAdmin();

    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return res.status(401).json({ error: 'Missing Authorization Bearer token' });
    }

    const token = match[1];
    admin
      .auth()
      .verifyIdToken(token)
      .then((decoded) => {
        req.user = decoded;
        next();
      })
      .catch(() => {
        res.status(401).json({ error: 'Invalid or expired auth token' });
      });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Auth initialization failed' });
  }
}

module.exports = {
  requireAuth,
};
