'use client';

import { X, Download, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function ImageViewerModal({ open, image, onClose }) {
  if (!open || !image?.url) return null;

  const presets = useMemo(
    () => [
      { name: 'Original', filter: '' },
      { name: 'Cinematic', filter: 'contrast(1.12) saturate(1.15) brightness(0.95)' },
      { name: 'Neon Night', filter: 'contrast(1.15) saturate(1.4) hue-rotate(18deg)' },
      { name: 'Soft Glow', filter: 'brightness(1.05) saturate(1.1) contrast(0.98)' },
    ],
    []
  );
  const [selected, setSelected] = useState(presets[0].name);
  const active = presets.find((p) => p.name === selected) || presets[0];

  return (
    <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-xl">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative mx-auto mt-10 w-[min(1100px,95vw)] h-[min(720px,85vh)] glass overflow-hidden">
        <div className="h-12 px-4 flex items-center justify-between border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-2 text-sm text-gray-200">
            <Sparkles className="w-4 h-4 text-aura-300" />
            <span className="truncate max-w-[50vw]">{image.caption || 'Asset preview'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(image.url, '_blank')}
              className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-gray-200" />
            </button>
          </div>
        </div>

        <div className="h-[calc(100%-3rem)] flex">
          <div className="flex-1 bg-black/30 flex items-center justify-center p-4">
            <img
              src={image.url}
              alt={image.caption || 'Asset'}
              className="max-h-full max-w-full rounded-xl border border-white/10"
              style={{ filter: active.filter || undefined }}
            />
          </div>

          <div className="w-72 border-l border-white/10 bg-black/20 p-4">
            <div className="text-xs text-gray-500 mb-2">FILTERS / SELECTOR</div>
            <div className="space-y-2">
              {presets.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setSelected(p.name)}
                  className={`w-full text-left px-3 py-2 rounded-xl border transition-all text-sm ${
                    selected === p.name
                      ? 'bg-aura-600/20 border-aura-500/30 text-white'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-200'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            <div className="mt-4 text-xs text-gray-600">
              These filters are local preview presets. If you want, I can wire them to regenerate variations via Nano Banana.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
