'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  reload,
} from 'firebase/auth';
import { getFirebaseAuth } from '../lib/firebaseClient';

export default function AuthGate({ onAuth, children }) {
  const auth = useMemo(() => {
    try {
      return getFirebaseAuth();
    } catch (e) {
      return null;
    }
  }, []);

  const [mode, setMode] = useState('login'); // login | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setError('Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables.');
      return;
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setActionMsg('');
      setError('');

      if (!u) {
        setToken(null);
        onAuth?.({ user: null, token: null, verified: false });
        setLoading(false);
        return;
      }

      try {
        const t = await u.getIdToken();
        setToken(t);
        onAuth?.({ user: u, token: t, verified: Boolean(u.emailVerified) });
      } catch (e) {
        setToken(null);
        onAuth?.({ user: u, token: null, verified: false });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [auth, onAuth]);

  const doLogin = async () => {
    setError('');
    setActionMsg('');
    if (!auth) return;
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      setError(e?.message || 'Login failed');
    }
  };

  const doSignup = async () => {
    setError('');
    setActionMsg('');
    if (!auth) return;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await sendEmailVerification(cred.user);
      setActionMsg('Verification email sent. Please check your inbox.');
    } catch (e) {
      setError(e?.message || 'Signup failed');
    }
  };

  const resendVerification = async () => {
    setError('');
    setActionMsg('');
    if (!auth?.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
      setActionMsg('Verification email resent.');
    } catch (e) {
      setError(e?.message || 'Could not resend verification email');
    }
  };

  const refreshVerification = async () => {
    setError('');
    setActionMsg('');
    if (!auth?.currentUser) return;
    try {
      await reload(auth.currentUser);
      const u = auth.currentUser;
      setUser(u);
      const t = await u.getIdToken(true);
      setToken(t);
      onAuth?.({ user: u, token: t, verified: Boolean(u.emailVerified) });
      if (u.emailVerified) {
        setActionMsg('Email verified. Welcome to AURA Studio.');
      } else {
        setActionMsg('Not verified yet. If you just verified, click refresh again.');
      }
    } catch (e) {
      setError(e?.message || 'Refresh failed');
    }
  };

  const doLogout = async () => {
    setError('');
    setActionMsg('');
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (e) {
      setError(e?.message || 'Logout failed');
    }
  };

  const isVerified = Boolean(user?.emailVerified);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass p-8 text-gray-300">Loading…</div>
      </div>
    );
  }

  if (user && token && isVerified) {
    return children;
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b1020] via-[#070a12] to-[#120a1c]" />
      <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full blur-3xl opacity-30 bg-aura-600/30" />
      <div className="absolute -bottom-52 -right-52 w-[620px] h-[620px] rounded-full blur-3xl opacity-20 bg-purple-500/25" />

      <div className="relative w-full max-w-md glass p-7 border border-white/10">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-aura-500/30 to-purple-500/20 border border-white/10" />
            <div>
              <div className="text-xs text-gray-400 tracking-[0.35em]">AURA STUDIO</div>
              <div className="text-xl font-semibold text-white mt-1">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-3">Authentication is required before you can generate campaigns.</div>
        </div>

        {!user ? (
          <div className="mb-5 flex rounded-xl border border-white/10 bg-black/10 p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                mode === 'login' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                mode === 'signup' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign up
            </button>
          </div>
        ) : null}

        {error ? <div className="mb-3 text-sm text-red-300">{error}</div> : null}
        {actionMsg ? <div className="mb-3 text-sm text-aura-200">{actionMsg}</div> : null}

        {!user ? (
          <>
            <div className="space-y-3">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-aura-500/40 focus:ring-1 focus:ring-aura-500/20"
              />
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-11 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-aura-500/40 focus:ring-1 focus:ring-aura-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-200">
                      <path
                        d="M3 3L21 21"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10.4 10.4A2.5 2.5 0 0 0 13.6 13.6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9.9 5.3A10.6 10.6 0 0 1 12 5c7 0 10 7 10 7a18.2 18.2 0 0 1-3.3 4.3"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6.2 6.2C3.9 8 2 12 2 12s3 7 10 7c1.2 0 2.3-.2 3.3-.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-200">
                      <path
                        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={mode === 'login' ? doLogin : doSignup}
                className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-b from-aura-500/25 to-aura-700/10 border border-aura-500/30 text-white hover:from-aura-500/35 hover:to-aura-700/15 transition-all"
              >
                {mode === 'login' ? 'Login' : 'Create account'}
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              By continuing, you agree to use AURA Studio responsibly.
            </div>
          </>
        ) : (
          <>
            <div className="text-sm text-gray-300">
              Signed in as <span className="text-white">{user.email}</span>
            </div>
            <div className="text-sm text-gray-500 mt-2">Please verify your email to continue.</div>

            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={resendVerification}
                className="w-full px-4 py-2 rounded-xl bg-aura-600/20 border border-aura-500/30 text-aura-200 hover:bg-aura-600/30 transition-all"
              >
                Resend verification email
              </button>
              <button
                onClick={refreshVerification}
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                I verified — Refresh
              </button>
              <button
                onClick={doLogout}
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
