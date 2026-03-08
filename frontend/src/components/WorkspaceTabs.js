'use client';

import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';

function ChevronIcon({ open }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TABS = [
  { id: 'strategy', label: 'Campaign Strategy' },
  { id: 'visuals', label: 'Visual Concepts' },
  { id: 'headlines', label: 'Ad Headlines' },
  { id: 'storyboard', label: 'Storyboard' },
  { id: 'voiceover', label: 'Voiceover Script' },
];

const PRESELECT = [
  { id: 'strategy', label: 'Campaign Strategy' },
  { id: 'visuals', label: 'Visual Concepts' },
  { id: 'headlines', label: 'Ad Headlines' },
];

function normalizeHeading(h) {
  return (h || '').trim().toLowerCase();
}

function sectionFromTitle(title) {
  const t = normalizeHeading(title)
    .replace(/^\d+\s*[.)-]\s*/, '')
    .replace(/^[^a-z0-9]+/g, '')
    .trim();

  if (!t) return null;

  if (t.includes('campaign strategy') || t === 'strategy' || t.includes('strategy')) return 'strategy';
  if (t.includes('visual concept') || t.includes('visuals') || t.includes('creative') || t.includes('hero creative')) return 'visuals';
  if (t.includes('headline') || t.includes('copy') || t.includes('ad headlines')) return 'headlines';
  if (t.includes('storyboard') || t.includes('shots') || t.includes('scenes')) return 'storyboard';
  if (t.includes('voiceover') || t.includes('vo script') || (t.includes('script') && t.includes('voice'))) return 'voiceover';

  return null;
}

function sectionsFromMarkdown(markdown) {
  const out = {
    strategy: '',
    visuals: '',
    headlines: '',
    storyboard: '',
    voiceover: '',
  };
  if (!markdown) return out;

  const lines = markdown.split(/\r?\n/);
  let current = 'strategy';
  let sawAnyHeading = false;

  for (const line of lines) {
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    const label = line.match(/^\*\*(.+?)\*\*\s*:?\s*$/);
    const colonLabel = line.match(/^([A-Za-z][A-Za-z\s&/-]{2,})\s*:\s*$/);

    const title = heading?.[1] || label?.[1] || colonLabel?.[1];
    if (title) {
      const section = sectionFromTitle(title);
      if (section) {
        sawAnyHeading = true;
        current = section;
      }
    }

    out[current] += `${line}\n`;
  }

  // If there were no headings at all, keep everything in Strategy.
  if (!sawAnyHeading) {
    out.strategy = markdown;
    out.visuals = '';
    out.headlines = '';
    out.storyboard = '';
    out.voiceover = '';
  }

  return out;
}

function stripLeadingSectionHeading(markdown, label) {
  const text = String(markdown || '');
  const lines = text.split(/\r?\n/);
  const firstNonEmptyIdx = lines.findIndex((l) => l.trim().length > 0);
  if (firstNonEmptyIdx === -1) return text;
  const first = lines[firstNonEmptyIdx].trim();
  const normalizedFirst = first
    .replace(/^#{1,6}\s+/, '')
    .replace(/^\*\*(.+?)\*\*\s*:?.*$/, '$1')
    .trim()
    .toLowerCase();
  const normalizedLabel = String(label || '').trim().toLowerCase();
  if (normalizedFirst === normalizedLabel) {
    const rest = lines.slice(firstNonEmptyIdx + 1).join('\n');
    return rest.trimStart();
  }
  return text;
}

export default function WorkspaceTabs({ activeTab, onTabChange, content, isGenerating, connectionState }) {
  const sections = useMemo(() => sectionsFromMarkdown(content), [content]);
  const activeContent = sections[activeTab] || '';
  const [openCards, setOpenCards] = useState({
    strategy: true,
    visuals: true,
    headlines: true,
    storyboard: true,
    voiceover: true,
  });

  const available = useMemo(() => {
    return TABS.filter((t) => {
      if (t.id === 'strategy') return true;
      return Boolean((sections[t.id] || '').trim());
    });
  }, [sections]);

  const showSelector = !content && !isGenerating;

  return (
    <div className="flex flex-col min-w-0">
      <div className="h-12 px-4 flex items-center gap-2 border-b border-white/10 bg-black/10">
        {showSelector ? (
          <>
            {PRESELECT.map((t) => {
              const active = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  onClick={() => onTabChange(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    active
                      ? 'bg-white/10 text-white border-white/20'
                      : 'bg-transparent text-gray-400 border-transparent hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </>
        ) : (
          <>
            {available.map((t) => {
              const active = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  onClick={() => onTabChange(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    active
                      ? 'bg-white/10 text-white border-white/20'
                      : 'bg-transparent text-gray-400 border-transparent hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </>
        )}
        <div className="flex-1" />
        <div className="text-xs text-gray-500">{isGenerating ? 'Generating…' : 'Ready'}</div>
      </div>

      <div className="flex-1 min-h-0 p-4 overflow-y-auto glass rounded-none border-0 border-t border-white/10 campaign-output">
        {!content && (isGenerating || connectionState === 'connecting') ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <div className="aura-spinner mb-4" />
            <div className="text-sm text-gray-400">Connecting to AURA…</div>
            <div className="text-xs text-gray-600 mt-1">Preparing your campaign workspace</div>
          </div>
        ) : content ? (
          <div className="space-y-3">
            {available.map((t) => {
              const isOpen = Boolean(openCards[t.id]);
              const body = stripLeadingSectionHeading(sections[t.id] || '', t.label).trim();
              return (
                <div key={t.id} className="glass p-0 overflow-hidden">
                  <button
                    onClick={() => setOpenCards((p) => ({ ...p, [t.id]: !p[t.id] }))}
                    className="w-full px-4 py-3 flex items-center justify-between bg-black/10 border-b border-white/10"
                  >
                    <div className="text-sm font-medium text-white">{t.label}</div>
                    <ChevronIcon open={isOpen} />
                  </button>
                  <div
                    className={`px-4 py-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 h-0 p-0 overflow-hidden'}`}
                  >
                    {body ? (
                      <ReactMarkdown>{body}</ReactMarkdown>
                    ) : (
                      <div className="text-sm text-gray-600">Waiting for {t.label}…</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : activeContent.trim() ? (
          <ReactMarkdown>{activeContent}</ReactMarkdown>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-gray-600">
            Waiting for {TABS.find((t) => t.id === activeTab)?.label || 'content'}…
          </div>
        )}
      </div>
    </div>
  );
}
