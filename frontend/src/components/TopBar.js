'use client';

function IconMic(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 10v2a7 7 0 0 1-14 0v-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 19v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSend(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M22 2 11 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 2 15 22l-4-9-9-4 20-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSparkle(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12 2l1.2 4.3L17.5 8l-4.3 1.2L12 13.5l-1.2-4.3L6.5 8l4.3-1.7L12 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 13l.7 2.4L8 16l-2.3.6L5 19l-.7-2.4L2 16l2.3-.6L5 13Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 12l.8 2.8L22 16l-2.2.6L19 19l-.8-2.4L16 16l2.2-.2L19 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconWave(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M4 10c2.2 0 2.2 4 4.4 4s2.2-4 4.4-4 2.2 4 4.4 4 2.2-4 4.4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSpinner(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M21 12a9 9 0 1 1-2.64-6.36"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TopBar({
  prompt,
  setPrompt,
  onGenerate,
  isGenerating,
  onStartVoice,
  voiceChatEnabled,
  setVoiceChatEnabled,
}) {
  return (
    <div className="h-14 px-4 border-b border-white/10 bg-black/20 backdrop-blur-xl flex items-center gap-3">
      <div className="flex-1">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Create a launch campaign for..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-aura-500/40 focus:ring-1 focus:ring-aura-500/20"
        />
      </div>

      <button
        type="button"
        title={voiceChatEnabled ? 'Voice chat enabled' : 'Voice chat off'}
        onClick={() => setVoiceChatEnabled?.(!voiceChatEnabled)}
        className={`w-10 h-10 rounded-xl border transition-all flex items-center justify-center ${
          voiceChatEnabled
            ? 'bg-aura-600/20 border-aura-500/30 text-aura-200'
            : 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10 hover:border-white/20'
        }`}
        aria-label="Toggle voice chat"
      >
        <IconWave className="w-4 h-4" />
      </button>

      <button
        onClick={onStartVoice}
        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center"
        aria-label="Voice input"
      >
        <IconMic className="w-4 h-4 text-gray-200" />
      </button>

      <button
        onClick={onGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="px-3 py-2 rounded-xl bg-aura-600/20 border border-aura-500/30 text-aura-200 hover:bg-aura-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
      >
        {isGenerating ? <IconSpinner className="w-4 h-4 animate-spin" /> : <IconSend className="w-4 h-4" />}
        <span className="text-sm font-medium">Generate</span>
      </button>
    </div>
  );
}
