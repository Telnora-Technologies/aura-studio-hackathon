'use client';

import { useState, useEffect } from 'react';
import { Clock, ChevronRight, Loader2, Trash2 } from 'lucide-react';

export default function HistoryScreen({ onSelectSession, authToken }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/session`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch sessions');
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="w-6 h-6 text-aura-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-gray-500">
        <p className="mb-2">Could not load sessions</p>
        <p className="text-sm text-gray-600">{error}</p>
        <button
          onClick={fetchSessions}
          className="mt-4 px-4 py-2 rounded-lg bg-aura-600/20 text-aura-300 text-sm hover:bg-aura-600/30 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Clock className="w-6 h-6 text-aura-400" />
        Session History
      </h2>

      {sessions.length === 0 ? (
        <div className="glass p-12 text-center text-gray-500">
          <p>No sessions yet. Start a new campaign to see history here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <button
              key={session.sessionId}
              onClick={() => onSelectSession(session.sessionId)}
              className="glass glass-hover w-full text-left p-4 flex items-center gap-4 group"
            >
              <div className="w-10 h-10 rounded-lg bg-aura-600/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-aura-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {session.prompt || 'Untitled session'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {session.createdAt
                    ? new Date(session.createdAt).toLocaleString()
                    : 'Unknown date'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-aura-400 transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
