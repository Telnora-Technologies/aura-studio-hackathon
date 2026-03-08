'use client';

import { useEffect, useRef } from 'react';
import { Download, Loader2, Plus, Sparkles, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function LiveOutput({
  content,
  isGenerating,
  sessionId,
  campaignPackUrl,
  generatedImages,
  onNewSession
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content]);

  const handleDownload = () => {
    if (campaignPackUrl) {
      window.open(campaignPackUrl, '_blank');
    } else if (content) {
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aura-campaign-${sessionId || 'export'}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Custom renderer for markdown that handles images
  const MarkdownComponents = {
    img: ({ node, ...props }) => (
      <div className="my-4">
        <img
          {...props}
          className="rounded-lg max-w-full h-auto border border-white/10"
          alt={props.alt || 'Generated image'}
        />
        {props.alt && (
          <p className="text-xs text-gray-500 mt-1 italic">{props.alt}</p>
        )}
      </div>
    ),
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aura-500 to-aura-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Campaign Output</h2>
            <p className="text-xs text-gray-500">
              {isGenerating ? 'Generating...' : sessionId ? `Session: ${sessionId.slice(0, 8)}...` : 'Ready'}
            </p>
          </div>
          {isGenerating && (
            <Loader2 className="w-4 h-4 text-aura-400 animate-spin" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {campaignPackUrl && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600/20 text-green-300 border border-green-500/30 hover:bg-green-600/30 transition-all"
            >
              <Download className="w-3 h-3" />
              Campaign Pack
            </button>
          )}
          <button
            onClick={handleDownload}
            disabled={!content && !campaignPackUrl}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 border border-white/10 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
          <button
            onClick={onNewSession}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-aura-600/20 text-aura-300 border border-aura-500/30 hover:bg-aura-600/30 transition-all"
          >
            <Plus className="w-3 h-3" />
            New
          </button>
        </div>
      </div>

      {/* Generated Images Gallery */}
      {generatedImages.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-aura-300 mb-2 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Generated Images
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {generatedImages.map((image, index) => (
              <div key={index} className="flex-shrink-0">
                <img
                  src={image.url}
                  alt={image.caption || `Generated image ${index + 1}`}
                  className="h-32 rounded-lg border border-white/10 hover:border-aura-500/50 transition-all cursor-pointer"
                  onClick={() => window.open(image.url, '_blank')}
                />
                {image.caption && (
                  <p className="text-xs text-gray-500 mt-1 max-w-32 truncate">{image.caption}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Streaming Content */}
      <div
        ref={scrollRef}
        className="flex-1 glass p-6 overflow-y-auto campaign-output"
      >
        {content ? (
          <ReactMarkdown components={MarkdownComponents}>{content}</ReactMarkdown>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-aura-500/50" />
            <p>Waiting for AURA to generate your campaign...</p>
          </div>
        )}

        {/* Typing cursor */}
        {isGenerating && (
          <span className="inline-block w-2 h-5 bg-aura-400 animate-pulse ml-1 align-middle" />
        )}
      </div>

      {/* Status Bar */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
        <span>
          {isGenerating ? '● Live streaming' : content ? '● Complete' : '○ Idle'}
        </span>
        <span>{content.length} characters</span>
      </div>
    </div>
  );
}
