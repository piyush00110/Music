'use client';

import { usePlayer } from '@/lib/PlayerContext';
import ProgressBar from '@/components/ProgressBar';
import EnhancedVisualizer from '@/components/EnhancedVisualizer';
import Equalizer from '@/components/Equalizer';
import Recommendations from '@/components/Recommendations';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

function extractColor(imgUrl: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 1; c.height = 1;
      const ctx = c.getContext('2d');
      if (!ctx) { resolve('#1a1a2e'); return; }
      ctx.drawImage(img, 0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      resolve(`rgb(${d[0]},${d[1]},${d[2]})`);
    };
    img.onerror = () => resolve('#1a1a2e');
    img.src = imgUrl;
  });
}

function MarqueeText({ text, className }: { text: string; className?: string }) {
  const [overflow, setOverflow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) setOverflow(el.scrollWidth > el.clientWidth);
  }, [text]);
  return (
    <div ref={ref} className={`overflow-hidden ${className || ''}`}>
      <div className={`whitespace-nowrap ${overflow ? 'animate-marquee hover:pause' : ''}`}>
        {text}{overflow && <span className="invisible">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}</span>}
      </div>
    </div>
  );
}

export default function PlayerPage() {
  const {
    currentTrack, isPlaying, queue, queueIndex,
    progress, duration, volume, audioQuality,
    pause, resume, next, prev,
    setVolume, seek, toggleShuffle, toggleRepeat,
    shuffle, repeat, soundEffects,
    downloadCurrentTrack, downloading, setAudioQuality,
    setSoundEffect,
  } = usePlayer();
  const [showEq, setShowEq] = useState(false);
  const [showSfx, setShowSfx] = useState(false);
  const [bgColor, setBgColor] = useState('#0a0a0f');
  const artRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentTrack) return;
    const src = currentTrack.youtubeId
      ? `https://i.ytimg.com/vi/${currentTrack.youtubeId}/hqdefault.jpg`
      : currentTrack.album.cover_medium;
    if (src) extractColor(src).then(setBgColor);
    else setBgColor('#0a0a0f');
  }, [currentTrack?.youtubeId, currentTrack?.album.cover_medium]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="relative glass-panel rounded-3xl p-12 text-center max-w-md overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#D4AF37]/5 blur-3xl rounded-full" />
          <div className="relative z-10">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-white/[0.06]">
              <svg className="w-12 h-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377" />
              </svg>
            </div>
            <p className="text-zinc-400 text-lg mb-2 font-[family-name:var(--font-serif)]">No track playing</p>
            <p className="text-zinc-600 text-sm mb-6">Search millions of songs</p>
            <Link href="/" className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black rounded-full text-sm font-semibold hover:shadow-xl hover:shadow-[#D4AF37]/30 transition-all inline-flex items-center gap-2 active:scale-95">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              Browse Music
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const useYtThumb = !!currentTrack.youtubeId;
  const artSrc = useYtThumb ? `https://i.ytimg.com/vi/${currentTrack.youtubeId}/hqdefault.jpg` : currentTrack.album.cover_medium;

  return (
    <div className="relative min-h-[calc(100vh-12rem)] flex flex-col items-center px-4 md:px-8 py-6 max-w-2xl mx-auto">
      {/* Dynamic gradient background */}
      <div className="fixed inset-0 pointer-events-none transition-colors duration-1000" style={{ background: `radial-gradient(ellipse at 50% 0%, ${bgColor}66 0%, transparent 70%)` }} />
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[#0f0f0f]/60 to-[#0f0f0f]" />

      <div className="relative z-10 w-full flex flex-col items-center slide-up">
        {/* Album art with vinyl effect */}
        <div ref={artRef} className="relative group mb-5">
          {/* Ambient glow */}
          <div className={`absolute -inset-8 rounded-full bg-gradient-to-br from-[#D4AF37]/20 via-transparent to-[#D4AF37]/5 blur-3xl transition-opacity duration-700 ${isPlaying ? 'opacity-100' : 'opacity-50'}`} />

          {/* Vinyl record outer */}
          <div className={`relative w-64 h-64 md:w-72 md:h-72 rounded-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-2 shadow-2xl shadow-black/50 ${isPlaying ? 'animate-spin-slow' : ''}`}
            style={{ animationDuration: '6s', animationTimingFunction: 'linear', animationIterationCount: 'infinite', animationPlayState: isPlaying ? 'running' : 'paused' }}>
            {/* Grooves */}
            <div className="absolute inset-3 rounded-full border border-white/[0.03]" />
            <div className="absolute inset-6 rounded-full border border-white/[0.02]" />
            <div className="absolute inset-9 rounded-full border border-white/[0.02]" />
            <div className="absolute inset-12 rounded-full border border-white/[0.015]" />
            <div className="absolute inset-15 rounded-full border border-white/[0.01]" />
            {/* Album art */}
            <div className="w-full h-full rounded-full overflow-hidden ring-2 ring-white/[0.08]">
              {artSrc ? (
                <img src={artSrc} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                  <svg className="w-16 h-16 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377" />
                  </svg>
                </div>
              )}
            </div>
            {/* Reflection overlay */}
            <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-t from-transparent via-transparent to-white/[0.03]" />
            <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/[0.3]" />
          </div>

          {/* Center play/pause button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/[0.1] flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-105 active:scale-95">
              <button
                onClick={() => (isPlaying ? pause() : resume())}
                className="w-11 h-11 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#FFD700] flex items-center justify-center transition-all shadow-lg shadow-[#D4AF37]/30"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-black ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Track info with marquee */}
        <div className="w-full text-center mb-3 max-w-sm">
          <MarqueeText text={currentTrack.title} className="text-lg md:text-xl font-[family-name:var(--font-serif)] text-white font-semibold mb-1" />
          <p className="text-sm text-zinc-400 truncate">{currentTrack.artist.name}</p>
        </div>

        {/* Rich visualizer */}
        <div className="w-full mb-4">
          <EnhancedVisualizer isPlaying={isPlaying} barCount={64} height={40} />
        </div>

        {/* Premium progress */}
        <div className="w-full mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-zinc-600 font-mono tabular-nums">{formatTime(progress)}</span>
            <span className="text-[10px] text-zinc-600 font-mono tabular-nums">{formatTime(duration)}</span>
          </div>
          <div className="relative h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#FFD700] transition-all duration-300 ease-out relative" style={{ width: `${(progress / (duration || 1)) * 100}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg shadow-[#D4AF37]/40" />
            </div>
            <input type="range" min={0} max={duration || 1} value={progress} onChange={e => seek(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
        </div>

        {/* Luxe controls */}
        <div className="flex items-center justify-center gap-5 md:gap-6 mb-5">
          <button onClick={toggleShuffle} className={`transition-all duration-300 active:scale-90 ${shuffle ? 'text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]' : 'text-zinc-500 hover:text-white'}`} title="Shuffle">
            <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </button>

          <button onClick={prev} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-all active:scale-90 border border-white/[0.04]" title="Previous">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" /></svg>
          </button>

          <button onClick={() => (isPlaying ? pause() : resume())} className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#FFD700] flex items-center justify-center transition-all duration-300 shadow-2xl shadow-[#D4AF37]/30 hover:shadow-[#D4AF37]/50 active:scale-95 hover:scale-105" title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? (
              <svg className="w-6 h-6 md:w-7 md:h-7 text-black" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            ) : (
              <svg className="w-6 h-6 md:w-7 md:h-7 text-black ml-1" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          <button onClick={next} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-all active:scale-90 border border-white/[0.04]" title="Next">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM5.5 6l8.5 6-8.5 6z" /></svg>
          </button>

          <button onClick={toggleRepeat} className={`transition-all duration-300 active:scale-90 ${repeat !== 'off' ? 'text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]' : 'text-zinc-500 hover:text-white'}`} title={`Repeat: ${repeat}`}>
            <div className="relative">
              <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
              </svg>
              {repeat === 'one' && <span className="absolute -top-1 -right-1 text-[7px] md:text-[8px] font-bold text-[#D4AF37]">1</span>}
            </div>
          </button>
        </div>

        {/* Volume */}
        <div className="w-full flex items-center gap-3 mb-5 max-w-sm mx-auto">
          <svg className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
          </svg>
          <div className="flex-1 relative h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-zinc-400 to-white transition-all duration-200" style={{ width: `${volume * 100}%` }} />
            <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
          <svg className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.531v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
          </svg>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 md:gap-3 mb-5 flex-wrap justify-center">
          <button onClick={() => setShowEq(!showEq)} className={`px-4 py-2.5 rounded-xl text-[10px] md:text-xs transition-all flex items-center gap-1.5 active:scale-95 font-medium tracking-wider uppercase ${showEq ? 'glass-card text-[#D4AF37] border-[#D4AF37]/30' : 'bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 border border-white/[0.04]'}`}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
            EQ
          </button>
          <button onClick={() => setShowSfx(!showSfx)} className={`px-4 py-2.5 rounded-xl text-[10px] md:text-xs transition-all flex items-center gap-1.5 active:scale-95 font-medium tracking-wider uppercase ${showSfx ? 'glass-card text-[#D4AF37] border-[#D4AF37]/30' : 'bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 border border-white/[0.04]'}`}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
            FX
          </button>
          <button onClick={() => downloadCurrentTrack()} disabled={downloading} className="px-4 py-2.5 rounded-xl text-[10px] md:text-xs bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 font-medium tracking-wider uppercase border border-white/[0.04]">
            {downloading ? (
              <div className="w-3.5 h-3.5 rounded-full border border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            )}
            {downloading ? 'Saving...' : 'Download'}
          </button>
          {currentTrack.youtubeId && (
            <div className="flex items-center gap-1.5 bg-white/[0.03] px-3 py-2 rounded-xl border border-white/[0.04]">
              <span className="text-[9px] md:text-[10px] text-zinc-600 uppercase tracking-wider">Quality</span>
              {['low', 'mid', 'high'].map(q => (
                <button key={q} onClick={() => setAudioQuality(q)} className={`px-2 py-1 rounded-md text-[9px] md:text-[10px] uppercase tracking-wider transition-all font-medium ${audioQuality === q ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'}`}>
                  {q === 'high' ? 'HD' : q === 'mid' ? 'SD' : 'Low'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* EQ panel */}
        {showEq && (
          <div className="w-full fade-in mb-5">
            <Equalizer />
          </div>
        )}

        {/* FX panel */}
        {showSfx && (
          <div className="w-full glass-panel rounded-2xl p-5 md:p-6 fade-in mb-5">
            <h3 className="text-sm font-[family-name:var(--font-serif)] text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              Sound Effects
            </h3>
            <div className="space-y-5">
              {[
                { key: 'surround3D', label: '3D Surround', icon: '○' },
                { key: 'bassBoost', label: 'Bass Boost', icon: '⌇' },
                { key: 'reverb', label: 'Reverb', icon: '≈' },
                { key: 'vocalBoost', label: 'Vocal Boost', icon: '♪' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-zinc-400">{label}</span>
                    <span className="text-zinc-600 font-mono text-[10px]">{(soundEffects as any)[key]}%</span>
                  </div>
                  <div className="relative h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#D4AF37]/60 to-[#FFD700] transition-all duration-200" style={{ width: `${(soundEffects as any)[key]}%` }} />
                    <input type="range" min={0} max={100} value={(soundEffects as any)[key]} onChange={e => setSoundEffect(key, Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                <span className="text-xs text-zinc-400">Night Mode</span>
                <button onClick={() => setSoundEffect('nightMode', !soundEffects.nightMode)} className={`w-11 h-6 rounded-full transition-all relative ${soundEffects.nightMode ? 'bg-gradient-to-r from-[#D4AF37] to-[#FFD700]' : 'bg-zinc-700'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all duration-300 shadow-md ${soundEffects.nightMode ? 'left-5.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="w-full mt-2">
          <Recommendations />
        </div>

        {/* Queue */}
        {queue.length > 1 && (
          <div className="w-full mt-6 glass-panel rounded-2xl p-5">
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
              </svg>
              Up Next ({queue.length} tracks)
            </h3>
            <div className="space-y-0.5 max-h-64 overflow-y-auto custom-scrollbar">
              {queue.map((track, i) => (
                <div key={`${track.source || 'queue'}-${track.id}`} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                  i === queueIndex ? 'bg-gradient-to-r from-[#D4AF37]/8 to-transparent border border-[#D4AF37]/15' : 'hover:bg-white/[0.02] border border-transparent'
                }`}>
                  <span className="w-5 text-center text-xs text-zinc-600 font-mono">{i + 1}</span>
                  {(() => {
                    const src = track.youtubeId ? `https://i.ytimg.com/vi/${track.youtubeId}/default.jpg` : (track.album.cover_small || track.album.cover_medium);
                    return src ? (
                      <img src={src} alt="" className="w-9 h-9 rounded-lg object-cover ring-1 ring-white/[0.05]" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center"><svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377" /></svg></div>
                    );
                  })()}
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium truncate ${i === queueIndex ? 'text-[#D4AF37]' : 'text-zinc-300'}`}>{track.title}</p>
                    <p className="text-[10px] text-zinc-600 truncate">{track.artist.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
