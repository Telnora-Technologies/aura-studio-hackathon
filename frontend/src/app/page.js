'use client';

import { useEffect, useRef, useState } from 'react';
import HistoryScreen from '../components/HistoryScreen';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import WorkspaceTabs from '../components/WorkspaceTabs';
import AssetsPanel from '../components/AssetsPanel';
import AppHeader from '../components/AppHeader';
import VoiceListenerOverlay from '../components/VoiceListenerOverlay';
import ImageViewerModal from '../components/ImageViewerModal';
import AuthGate from '../components/AuthGate';

export default function Home() {
  const [screen, setScreen] = useState('launch'); // 'launch' | 'live' | 'history' | 'packs' | 'settings'
  const [sessionId, setSessionId] = useState(null);
  const [streamedContent, setStreamedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [campaignPackUrl, setCampaignPackUrl] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('strategy');
  const [connectionState, setConnectionState] = useState('idle'); // idle | connecting | streaming | done | error
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef(null);
  const voiceOpenRef = useRef(false);
  const hasAutoSubmittedRef = useRef(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [headerPanel, setHeaderPanel] = useState(null); // 'notifications' | 'help' | 'profile' | null
  const [assetsOpen, setAssetsOpen] = useState(true);
  const [voiceChatEnabled, setVoiceChatEnabled] = useState(false);
  const voiceChatEnabledRef = useRef(false);
  const ttsUtteranceRef = useRef(null);
  const [authToken, setAuthToken] = useState(null);
  const authTokenRef = useRef(null);
  const [authUser, setAuthUser] = useState(null);
  const [authVerified, setAuthVerified] = useState(false);

  const promptImpliesImages = (text) => {
    const t = String(text || '').toLowerCase();
    if (!t.trim()) return false;
    return (
      t.includes('image') ||
      t.includes('images') ||
      t.includes('visual') ||
      t.includes('visuals') ||
      t.includes('hero') ||
      t.includes('poster') ||
      t.includes('banner') ||
      t.includes('flyer') ||
      t.includes('ad creative') ||
      t.includes('social') ||
      t.includes('instagram') ||
      t.includes('facebook') ||
      t.includes('thumbnail') ||
      t.includes('mockup')
    );
  };

  const stopTts = () => {
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch (_) {}
    ttsUtteranceRef.current = null;
  };

  const pickSpokenSummary = (markdown) => {
    const text = String(markdown || '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]*`/g, ' ')
      .replace(/#+\s*/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\r/g, '')
      .trim();

    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    // Prefer first 2-3 substantive lines as a "summary".
    const chosen = lines.slice(0, 3).join(' ');
    const maxLen = 320;
    if (!chosen) return 'Done. Your campaign is ready.';
    return chosen.length > maxLen ? `${chosen.slice(0, maxLen).trim()}…` : chosen;
  };

  const speakSummary = (markdown) => {
    if (typeof window === 'undefined') return;
    if (!window.speechSynthesis) return;
    const summary = pickSpokenSummary(markdown);
    stopTts();

    const u = new SpeechSynthesisUtterance(summary);
    u.rate = 1.02;
    u.pitch = 1;
    u.volume = 1;
    ttsUtteranceRef.current = u;
    u.onend = () => {
      ttsUtteranceRef.current = null;
      // Resume listening in voice chat mode.
      if (voiceChatEnabledRef.current) {
        try {
          startVoice();
        } catch (_) {}
      }
    };
    try {
      window.speechSynthesis.speak(u);
    } catch (_) {}
  };

  const maybeSpeakOnComplete = (fullText) => {
    if (!voiceChatEnabledRef.current) return;
    Promise.resolve().then(() => speakSummary(fullText));
  };

  const normalizeVoiceCommand = (text) => {
    return String(text || '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const stripTrailingSendCommand = (text) => {
    const cleaned = normalizeVoiceCommand(text);
    // match "send" at end, optionally preceded by punctuation
    const m = cleaned.match(/^(.*?)(?:[\s,.;:!?]+)?send$/i);
    if (!m) return null;
    return normalizeVoiceCommand(m[1]);
  };

  useEffect(() => {
    voiceOpenRef.current = voiceOpen;
  }, [voiceOpen]);

  useEffect(() => {
    authTokenRef.current = authToken;
  }, [authToken]);

  useEffect(() => {
    voiceChatEnabledRef.current = Boolean(voiceChatEnabled);
  }, [voiceChatEnabled]);

  useEffect(() => {
    // Set up browser speech recognition once.
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setVoiceTranscript(transcript);
      setPrompt(transcript);

      // Auto-submit on the voice command "send".
      // Use only when we have a final result to avoid firing during interim updates.
      const last = event.results?.[event.results.length - 1];
      const isFinal = Boolean(last?.isFinal);
      if (!isFinal) return;
      if (!voiceOpenRef.current) return;
      if (hasAutoSubmittedRef.current) return;

      const stripped = stripTrailingSendCommand(transcript);
      if (stripped === null) return;

      hasAutoSubmittedRef.current = true;
      setPrompt(stripped);
      setVoiceTranscript(stripped);
      setVoiceOpen(false);
      try {
        recognition.stop();
      } catch (_) {}

      // Start generation with the dictated prompt.
      if (stripped.trim()) {
        handleStartSession(stripped);
      }
    };

    recognition.onerror = () => {
      setVoiceOpen(false);
    };

    recognition.onend = () => {
      // If the overlay is still open, restart to keep listening.
      if (voiceOpenRef.current) {
        try { recognition.start(); } catch (_) {}
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognition.stop(); } catch (_) {}
      recognitionRef.current = null;
    };
  }, []);

  const startVoice = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (!recognitionRef.current) {
      alert('Speech recognition failed to initialize. Please reload.');
      return;
    }
    setVoiceTranscript('');
    hasAutoSubmittedRef.current = false;
    setVoiceOpen(true);
    try {
      recognitionRef.current?.start();
    } catch (_) {
      // ignore repeated starts
    }
  };

  const stopVoice = () => {
    setVoiceOpen(false);
    hasAutoSubmittedRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch (_) {}
  };

  const handleStartSession = async (sessionPrompt, imageBase64 = null) => {
    setScreen('live');
    setStreamedContent('');
    setGeneratedImages([]);
    setCampaignPackUrl(null);
    setIsGenerating(true);
    setActiveTab('strategy');
    setConnectionState('connecting');
    stopTts();

    const finalWantImages = Boolean(promptImpliesImages(sessionPrompt));

    try {
      console.log('AURA generate: starting request');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      const response = await fetch(`/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authTokenRef.current ? { Authorization: `Bearer ${authTokenRef.current}` } : {}),
        },
        body: JSON.stringify({ prompt: sessionPrompt, image: imageBase64, includeImages: finalWantImages }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('text/event-stream')) {
        const errText = await response.text();
        setStreamedContent(
          `Error from server (status ${response.status}).\n\n${errText}`
        );
        setIsGenerating(false);
        setConnectionState('error');
        return;
      }

      setConnectionState('streaming');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      let sawComplete = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsGenerating(false);
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'chunk') {
                fullText += parsed.text || '';
                setStreamedContent((prev) => prev + parsed.text);
              } else if (parsed.type === 'tool_call') {
                // Show tool being called
                console.log('Tool call:', parsed.name, parsed.args);
              } else if (parsed.type === 'tool_result') {
                // Handle tool results
                if (parsed.name === 'generate_image' && parsed.result.status === 'success') {
                  if (parsed.result.url) {
                    setGeneratedImages((prev) => [
                      ...prev,
                      { url: parsed.result.url, caption: parsed.result.prompt || '' },
                    ]);
                  }
                } else if (parsed.name === 'save_campaign_pack' && parsed.result.status === 'success') {
                  setCampaignPackUrl(parsed.result.url);
                }
              } else if (parsed.type === 'complete') {
                setSessionId(parsed.sessionId);
                setConnectionState('done');
                sawComplete = true;
                // Speak a short summary once generation is complete.
                maybeSpeakOnComplete(fullText);
              }
            } catch (e) {
              // Skip non-JSON lines
            }
          }
        }
      }

      if (!sawComplete && fullText.trim()) {
        maybeSpeakOnComplete(fullText);
      }
    } catch (err) {
      console.error('Stream error:', err);
      const msg = err?.name === 'AbortError'
        ? 'Request timed out while connecting to AURA backend (120s).'
        : (err?.message || String(err));
      setStreamedContent(`Error connecting to AURA backend.\n\n${msg}`);
      setConnectionState('error');
    }

    setIsGenerating(false);
  };

  return (
    <AuthGate
      onAuth={({ user, token, verified }) => {
        setAuthUser(user);
        setAuthToken(token);
        setAuthVerified(Boolean(verified));
      }}
    >
    <div className="min-h-screen flex flex-col">
      <AppHeader
        onPower={() => setScreen('launch')}
        onNotifications={() => setHeaderPanel((p) => (p === 'notifications' ? null : 'notifications'))}
        onHelp={() => setHeaderPanel((p) => (p === 'help' ? null : 'help'))}
        onProfile={() => setHeaderPanel((p) => (p === 'profile' ? null : 'profile'))}
        onToggleAssets={() => setAssetsOpen((v) => !v)}
        assetsOpen={assetsOpen}
      />

      <div className="flex flex-1 min-h-0">
        <Sidebar currentScreen={screen} onNavigate={setScreen} />

        <div className="flex-1 min-w-0 flex flex-col">
          {(screen === 'launch' || screen === 'live') && (
            <TopBar
              prompt={prompt}
              setPrompt={setPrompt}
              isGenerating={isGenerating}
              onStartVoice={startVoice}
              voiceChatEnabled={voiceChatEnabled}
              setVoiceChatEnabled={setVoiceChatEnabled}
              onGenerate={() => handleStartSession(prompt)}
            />
          )}

          <div className="flex-1 min-h-0 flex">
            <main className="flex-1 min-w-0">
              {screen === 'launch' && (
                <div className="h-full flex items-center justify-center">
                  <div className="glass p-8 w-full max-w-2xl">
                    <div className="text-sm text-gray-400 mb-2">Start a new session</div>
                    <div className="text-2xl font-semibold text-white mb-3">Describe your campaign idea</div>
                    <div className="text-sm text-gray-500">Use the bar above to write your prompt and click Generate.</div>
                  </div>
                </div>
              )}

              {screen === 'live' && (
                <WorkspaceTabs
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  content={streamedContent}
                  isGenerating={isGenerating}
                  connectionState={connectionState}
                />
              )}

              {screen === 'history' && (
                <HistoryScreen
                  authToken={authToken}
                  onSelectSession={(id) => {
                    setSessionId(id);
                    setScreen('live');
                  }}
                />
              )}

              {screen === 'packs' && (
                <div className="h-full p-6">
                  <div className="glass p-6 max-w-3xl">
                    <div className="text-xs text-gray-500 mb-2">CAMPAIGN PACKS</div>
                    <div className="text-2xl font-semibold text-white mb-2">Your exported campaign bundles</div>
                    <div className="text-sm text-gray-500 mb-5">
                      This area will show saved campaign packs per user once authentication is added.
                    </div>

                    {campaignPackUrl ? (
                      <button
                        onClick={() => window.open(campaignPackUrl, '_blank')}
                        className="px-4 py-2 rounded-xl bg-aura-600/20 border border-aura-500/30 text-aura-200 hover:bg-aura-600/30 transition-all"
                      >
                        Open latest Campaign Pack
                      </button>
                    ) : (
                      <div className="text-sm text-gray-600">
                        No campaign pack yet. Generate a campaign, then click “Download Campaign Pack” in Assets.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {screen === 'settings' && (
                <div className="h-full p-6">
                  <div className="glass p-6 max-w-3xl space-y-6">
                    <div>
                      <div className="text-xs text-gray-500 mb-2">SETTINGS</div>
                      <div className="text-2xl font-semibold text-white">Studio preferences</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setStreamedContent('');
                          setGeneratedImages([]);
                          setCampaignPackUrl(null);
                          setSessionId(null);
                          setConnectionState('idle');
                          setActiveTab('strategy');
                        }}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 hover:border-white/20 transition-all"
                      >
                        Reset workspace
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </main>

            {(screen === 'live' || screen === 'launch') && assetsOpen && (
              <AssetsPanel
                generatedImages={generatedImages}
                campaignPackUrl={campaignPackUrl}
                onOpenImage={(img) => setSelectedImage(img)}
              />
            )}
          </div>
        </div>
      </div>

      {headerPanel && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setHeaderPanel(null)} />
          <div className="relative mx-auto mt-16 w-[min(720px,92vw)] glass p-6">
            <div className="text-sm text-white mb-1">
              {headerPanel === 'notifications' && 'Notifications'}
              {headerPanel === 'help' && 'Help'}
              {headerPanel === 'profile' && 'Profile'}
            </div>
            <div className="text-sm text-gray-500">
              {headerPanel === 'notifications' && 'Notifications will be personalized once user accounts (signup/login + email verification) are enabled.'}
              {headerPanel === 'help' && 'Prompt guide: describe your product, audience, offer, brand tone, and channels. Add constraints like budget, timeline, and deliverables.'}
              {headerPanel === 'profile' && 'Profile will show your account info, saved sessions, and team settings after authentication is implemented.'}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setHeaderPanel(null)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <VoiceListenerOverlay
        open={voiceOpen}
        transcript={voiceTranscript}
        subtitle="Let's start with the goals…"
        onClose={stopVoice}
      />
      <ImageViewerModal
        open={Boolean(selectedImage)}
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
    </AuthGate>
  );
}
