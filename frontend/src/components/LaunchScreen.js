'use client';

import { useState, useRef } from 'react';
import { Mic, MicOff, Upload, Send, Sparkles, Zap } from 'lucide-react';

export default function LaunchScreen({ onStart }) {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [includeImages, setIncludeImages] = useState(false);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target.result);
      // Extract base64 data (remove prefix)
      const base64 = ev.target.result.split(',')[1];
      setImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setPrompt(transcript);
      };

      recognition.onerror = (err) => {
        console.error('Speech recognition error:', err);
        setIsRecording(false);
      };

      recognition.start();
      mediaRecorderRef.current = recognition;
      setIsRecording(true);
    } catch (err) {
      console.error('Mic access denied:', err);
      alert('Please allow microphone access to use voice input.');
    }
  };

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    onStart(prompt, image, includeImages);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-aura-500 to-aura-700 flex items-center justify-center animate-glow">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-white via-aura-200 to-aura-400 bg-clip-text text-transparent">
          AURA Studio
        </h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Speak your idea. Watch it become a complete campaign — live.
        </p>
      </div>

      {/* Input Card */}
      <div className="glass p-6 w-full max-w-2xl space-y-4">
        {/* Text Input */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your campaign idea... e.g., 'Launch campaign for an eco-friendly sneaker brand targeting Gen Z'"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none h-32 focus:outline-none focus:border-aura-500/50 focus:ring-1 focus:ring-aura-500/30 transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
            }}
          />
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Brand asset"
              className="h-20 rounded-lg border border-white/10"
            />
            <button
              onClick={() => { setImage(null); setImagePreview(null); }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center hover:bg-red-400"
            >
              x
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Mic Button */}
          <button
            onClick={toggleRecording}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              isRecording
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 mic-active'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isRecording ? 'Stop' : 'Voice'}
          </button>

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-white/5 text-gray-400 border border-white/10 hover:text-white hover:bg-white/10 transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Spacer */}
          <div className="flex-1" />

          <label className="flex items-center gap-2 text-xs text-gray-400 select-none">
            <input
              type="checkbox"
              checked={includeImages}
              onChange={(e) => setIncludeImages(e.target.checked)}
              className="accent-aura-500"
            />
            Include images
          </label>

          {/* Generate Button */}
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              prompt.trim()
                ? 'bg-gradient-to-r from-aura-600 to-aura-500 text-white hover:from-aura-500 hover:to-aura-400 shadow-lg shadow-aura-500/25'
                : 'bg-white/5 text-gray-600 cursor-not-allowed'
            }`}
          >
            <Zap className="w-4 h-4" />
            Generate Campaign
          </button>
        </div>

        <p className="text-xs text-gray-600 text-center">
          Press Ctrl+Enter to generate &bull; Upload brand assets for context
        </p>
      </div>

      {/* Examples */}
      <div className="mt-8 flex flex-wrap gap-2 justify-center max-w-2xl">
        {[
          'Launch campaign for a sustainable fashion brand',
          'Social media campaign for a new fitness app',
          'Product launch for AI-powered headphones',
          'Holiday campaign for a luxury chocolate brand',
        ].map((example) => (
          <button
            key={example}
            onClick={() => setPrompt(example)}
            className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-gray-500 border border-white/5 hover:text-aura-300 hover:border-aura-500/30 transition-all"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
