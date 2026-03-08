'use client';

import { Mic, X } from 'lucide-react';

export default function VoiceListenerOverlay({ open, transcript, subtitle, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl">
      <div className="absolute inset-0 opacity-60">
        <div className="absolute inset-0" style={{
          background:
            'radial-gradient(circle at 50% 40%, rgba(124,58,237,0.30), transparent 55%), radial-gradient(circle at 20% 20%, rgba(59,130,246,0.18), transparent 55%), radial-gradient(circle at 80% 20%, rgba(236,72,153,0.14), transparent 55%)',
        }} />
        <div className="absolute left-0 right-0 top-24 h-24" style={{
          background:
            'linear-gradient(90deg, transparent, rgba(124,58,237,0.35), transparent)',
          filter: 'blur(8px)',
        }} />
        <div className="absolute left-0 right-0 top-28 h-24" style={{
          background:
            'linear-gradient(90deg, transparent, rgba(59,130,246,0.28), transparent)',
          filter: 'blur(10px)',
        }} />
      </div>

      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center"
        aria-label="Close"
      >
        <X className="w-4 h-4 text-gray-200" />
      </button>

      <div className="h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-aura-500/40 to-aura-700/40 border border-white/10 flex items-center justify-center shadow-[0_0_60px_rgba(124,58,237,0.35)]">
          <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center">
            <Mic className="w-10 h-10 text-white/90" />
          </div>
        </div>

        <div className="mt-8 text-lg md:text-xl text-gray-200 max-w-2xl">
          {transcript || 'Listening…'}
        </div>
        <div className="mt-2 text-sm text-gray-500">{subtitle || 'Speak your campaign idea'}</div>

        <div className="mt-8 text-xs text-gray-600">Listening…</div>
      </div>
    </div>
  );
}
