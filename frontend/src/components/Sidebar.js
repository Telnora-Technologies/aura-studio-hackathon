'use client';

import { Play, History, Package, Settings } from 'lucide-react';

export default function Sidebar({ currentScreen, onNavigate }) {
  const items = [
    { id: 'launch', label: 'Start Session', icon: Play },
    { id: 'history', label: 'Campaign History', icon: History },
    { id: 'packs', label: 'Campaign Packs', icon: Package },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-white/10 bg-black/30 backdrop-blur-xl">
      <nav className="p-3 space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = currentScreen === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onNavigate(it.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all border ${
                active
                  ? 'bg-aura-600/20 text-white border-aura-500/30'
                  : 'bg-transparent text-gray-400 border-transparent hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate">{it.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
