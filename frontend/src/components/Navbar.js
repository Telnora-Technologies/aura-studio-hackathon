'use client';

import { Sparkles, History, Mic } from 'lucide-react';

export default function Navbar({ currentScreen, onNavigate }) {
  const navItems = [
    { id: 'launch', label: 'New Session', icon: Mic },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <nav className="glass border-b border-white/10 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <button
        onClick={() => onNavigate('launch')}
        className="flex items-center gap-2 group"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aura-500 to-aura-700 flex items-center justify-center group-hover:animate-glow transition-all">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-aura-300 to-aura-500 bg-clip-text text-transparent">
          AURA Studio
        </span>
      </button>

      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-aura-600/30 text-aura-300 border border-aura-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
