'use client';

import { Download, Image as ImageIcon } from 'lucide-react';

export default function AssetsPanel({ generatedImages, campaignPackUrl, onOpenImage }) {
  return (
    <aside className="w-80 shrink-0 border-l border-white/10 bg-black/30 backdrop-blur-xl p-4 space-y-4">
      <div className="glass p-3 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold tracking-wide text-gray-300">ASSETS</div>
        </div>

        <div className="space-y-2">
          {campaignPackUrl && (
            <button
              onClick={() => window.open(campaignPackUrl, '_blank')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-aura-600/20 border border-aura-500/30 text-aura-200 hover:bg-aura-600/30 transition-all"
            >
              <span className="text-sm font-medium">Download Campaign Pack</span>
              <Download className="w-4 h-4" />
            </button>
          )}

          <div className="text-xs text-gray-500">Images</div>
          {generatedImages?.length ? (
            <div className="grid grid-cols-2 gap-2">
              {generatedImages.slice(0, 6).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => onOpenImage?.(img)}
                  className="group rounded-xl overflow-hidden border border-white/10 hover:border-aura-500/40 transition-all bg-white/5"
                >
                  <img src={img.url} alt={img.caption || 'Generated image'} className="w-full h-20 object-cover" />
                  <div className="px-2 py-1 text-[10px] text-gray-500 truncate">{img.caption || 'Image'}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <ImageIcon className="w-4 h-4" />
              No images yet
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
