'use client';

import { Power, HelpCircle, Bell, User, LayoutGrid } from 'lucide-react';

export default function AppHeader({
  onPower,
  onNotifications,
  onHelp,
  onProfile,
  onToggleAssets,
  assetsOpen,
}) {
  return (
    <header className="h-14 px-5 flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-black/40 via-black/20 to-black/40 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-aura-500 to-aura-700 flex items-center justify-center">
          <div className="w-4 h-4 rounded-sm bg-white/90 rotate-12" />
        </div>
        <div className="leading-tight">
          <div className="tracking-[0.2em] text-xs text-gray-300">AURA</div>
          <div className="text-[11px] text-gray-500 -mt-0.5 tracking-[0.35em]">STUDIO</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPower}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center"
          aria-label="Power"
        >
          <Power className="w-4 h-4 text-gray-200" />
        </button>
        <button
          onClick={onNotifications}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 text-gray-300" />
        </button>
        <button
          onClick={onHelp}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center"
          aria-label="Help"
        >
          <HelpCircle className="w-4 h-4 text-gray-300" />
        </button>
        <button
          onClick={onProfile}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center"
          aria-label="Profile"
        >
          <User className="w-4 h-4 text-gray-300" />
        </button>
        <button
          onClick={onToggleAssets}
          className={`w-9 h-9 rounded-xl border transition-all flex items-center justify-center ${
            assetsOpen
              ? 'bg-aura-600/20 border-aura-500/30'
              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
          }`}
          aria-label="Toggle Assets"
        >
          <LayoutGrid className={`w-4 h-4 ${assetsOpen ? 'text-aura-200' : 'text-gray-300'}`} />
        </button>
      </div>
    </header>
  );
}
