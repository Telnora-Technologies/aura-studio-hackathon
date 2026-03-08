const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'aura-studio-hack',
});

const SESSIONS_COLLECTION = 'sessions';

// Save a session
async function storeSession(sessionId, data) {
  const docRef = db.collection(SESSIONS_COLLECTION).doc(sessionId);
  await docRef.set(
    {
      ...data,
      updatedAt: Firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return { sessionId, status: 'saved' };
}

// Load a session
async function loadSession(sessionId) {
  const docRef = db.collection(SESSIONS_COLLECTION).doc(sessionId);
  const doc = await docRef.get();

  if (!doc.exists) {
    return null;
  }

  return { sessionId, ...doc.data() };
}

async function loadSessionForUser(sessionId, userId) {
  const session = await loadSession(sessionId);
  if (!session) return null;
  if (session.userId && session.userId !== userId) return null;
  return session;
}

// List all sessions (most recent first)
async function listSessions(limit = 20) {
  const snapshot = await db
    .collection(SESSIONS_COLLECTION)
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    sessionId: doc.id,
    ...doc.data(),
  }));
}

async function listSessionsByUser(userId, limit = 20) {
  const snapshot = await db
    .collection(SESSIONS_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    sessionId: doc.id,
    ...doc.data(),
  }));
}

// Delete a session
async function deleteSession(sessionId) {
  await db.collection(SESSIONS_COLLECTION).doc(sessionId).delete();
  return { sessionId, status: 'deleted' };
}

module.exports = {
  storeSession,
  loadSession,
  loadSessionForUser,
  listSessions,
  listSessionsByUser,
  deleteSession,
};
