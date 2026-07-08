'use client';

import { usePlayer } from '@/lib/PlayerContext';
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';

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
  const [showMore, setShowMore] = useState(false);
  const [bgColor, setBgColor] = useState('#0a0a0f');
  const [sheetMode, setSheetMode] = useState<'lyrics' | 'queue' | 'controls'>('lyrics');
  const [sheetOpen, setSheetOpen] = useState(false);

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

  const pct = duration > 0 ? (progress / duration) * 100 : 0;
  const circumference = 2 * Math.PI * 48;
  const offset = circumference - (pct / 100) * circumference;

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value));
  }, [seek]);

  if (!currentTrack) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4 bg-[#050505]">
        <div className="relative rounded-3xl p-12 text-center max-w-md overflow-hidden bg-white/[0.03] border border-white/[0.06]">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 blur-3xl rounded-full" />
          <div className="relative z-10">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-white/[0.06]">
              <span className="material-symbols-outlined text-5xl text-zinc-600">music_note</span>
            </div>
            <p className="text-zinc-400 text-lg mb-2 font-[family-name:var(--font-serif)]">No track playing</p>
            <p className="text-zinc-600 text-sm mb-6">Search millions of songs</p>
            <Link href="/" className="px-6 py-3 bg-gradient-to-r from-primary-container to-gold-light text-black rounded-full text-sm font-semibold hover:shadow-xl hover:shadow-primary/30 transition-all inline-flex items-center gap-2 active:scale-95">
              <span className="material-symbols-outlined text-lg">play_arrow</span>
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
    <div className="relative min-h-screen bg-[#050505] overflow-hidden flex flex-col">
      <div className="full-bleed-bg" style={{ backgroundImage: `url(${artSrc})` }} />
      <div className="obsidian-gradient" />

      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex flex-col items-center pt-8 px-gutter">
        <div className="w-full flex items-center justify-between max-w-screen-xl">
          <Link href="/" className="text-on-surface/70 active:scale-95 duration-200 p-2">
            <span className="material-symbols-outlined">expand_more</span>
          </Link>
          <div className="flex flex-col items-center">
            <p className="text-[10px] font-headline-md tracking-[0.2em] uppercase text-primary/80 mb-0.5">Master Quality Audio</p>
            <h1 className="font-label-sm text-label-sm tracking-widest text-on-surface/60 uppercase">Now Playing</h1>
          </div>
          <button onClick={() => setShowMore(!showMore)} className="text-on-surface/70 active:scale-95 duration-200 p-2">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>
      </header>

      {/* More menu dropdown */}
      {showMore && (
        <div className="fixed top-20 right-6 z-50 bg-[#1c1b1b]/90 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-3 min-w-[200px] shadow-2xl fade-in">
          <div className="space-y-1">
            <button onClick={() => { setShowEq(!showEq); setShowMore(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all">
              <span className="material-symbols-outlined text-primary text-xl">tune</span>
              <span>Equalizer</span>
            </button>
            <button onClick={() => { setShowSfx(!showSfx); setShowMore(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all">
              <span className="material-symbols-outlined text-primary text-xl">graphic_eq</span>
              <span>Sound FX</span>
            </button>
            <button onClick={() => { downloadCurrentTrack(); setShowMore(false); }} disabled={downloading} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all disabled:opacity-40">
              <span className="material-symbols-outlined text-primary text-xl">download</span>
              <span>{downloading ? 'Saving...' : 'Download'}</span>
            </button>
            <div className="h-px bg-white/[0.06] my-1" />
            <div className="px-3 py-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Audio Quality</p>
              <div className="flex gap-1">
                {['low', 'mid', 'high'].map(q => (
                  <button key={q} onClick={() => setAudioQuality(q)}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all font-medium ${
                      audioQuality === q ? 'bg-primary/20 text-primary' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
                    }`}>
                    {q === 'high' ? 'HD' : q === 'mid' ? 'SD' : 'Low'}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-px bg-white/[0.06] my-1" />
            <div className="px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-zinc-500">volume_up</span>
                <div className="flex-1 relative h-1 rounded-full bg-white/[0.08] overflow-hidden">
                  <div className="h-full rounded-full bg-primary/60 transition-all duration-200" style={{ width: `${volume * 100}%` }} />
                  <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EQ / FX panels */}
      <div className="fixed inset-x-0 top-24 z-40 px-gutter max-w-lg mx-auto">
        {showEq && (
          <div className="bg-[#1c1b1b]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 mb-3 fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs text-zinc-400 uppercase tracking-wider">Equalizer</h3>
              <button onClick={() => setShowEq(false)} className="text-zinc-500 hover:text-white">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="flex items-end gap-1.5 h-24">
              {[60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000].map((f, i) => (
                <div key={f} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full rounded-full bg-primary/30 transition-all duration-300`}
                    style={{ height: `${30 + Math.sin(i * 1.2 + Date.now() * 0.001) * 30}%` }} />
                  <span className="text-[6px] text-zinc-600">{f >= 1000 ? `${f / 1000}k` : f}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {showSfx && (
          <div className="bg-[#1c1b1b]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 mb-3 fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs text-zinc-400 uppercase tracking-wider">Sound Effects</h3>
              <button onClick={() => setShowSfx(false)} className="text-zinc-500 hover:text-white">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'surround3D', label: '3D Surround' },
                { key: 'bassBoost', label: 'Bass Boost' },
                { key: 'reverb', label: 'Reverb' },
                { key: 'vocalBoost', label: 'Vocal Boost' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400">{label}</span>
                    <span className="text-zinc-600 font-mono text-[10px]">{(soundEffects as any)[key]}%</span>
                  </div>
                  <div className="relative h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-primary/60 transition-all duration-200" style={{ width: `${(soundEffects as any)[key]}%` }} />
                    <input type="range" min={0} max={100} value={(soundEffects as any)[key]} onChange={e => setSoundEffect(key, Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                <span className="text-xs text-zinc-400">Night Mode</span>
                <button onClick={() => setSoundEffect('nightMode', !soundEffects.nightMode)}
                  className={`w-10 h-5 rounded-full transition-all relative ${soundEffects.nightMode ? 'bg-primary' : 'bg-zinc-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-300 shadow-md ${soundEffects.nightMode ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center pt-32 pb-48 px-container-padding-mobile space-y-8">
        {/* Album Art with Progress Ring */}
        <div className="relative flex items-center justify-center">
          <svg className="absolute w-[310px] h-[310px] md:w-[410px] md:h-[410px]" viewBox="0 0 100 100">
            <circle cx="50" cy="50" fill="transparent" r="48" stroke="currentColor" strokeWidth="0.5" className="text-white/5" />
            <circle className="progress-ring text-primary" cx="50" cy="50" fill="transparent" r="48" stroke="currentColor"
              strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" strokeWidth="0.5" />
          </svg>
          <div className={`relative w-72 h-72 md:w-96 md:h-96 rounded-full overflow-hidden ring-1 ring-primary/20 shadow-[0_0_60px_rgba(0,0,0,0.8)] ${isPlaying ? 'animate-spin-slow' : ''}`}
            style={{ animationDuration: '8s', animationTimingFunction: 'linear', animationIterationCount: 'infinite', animationPlayState: isPlaying ? 'running' : 'paused' }}>
            {artSrc ? (
              <img src={artSrc} alt="" className="w-full h-full object-cover scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                <span className="material-symbols-outlined text-6xl text-zinc-700">music_note</span>
              </div>
            )}
          </div>
        </div>

        {/* Track Info */}
        <div className="text-center space-y-2">
          <h2 className="font-display-lg-mobile text-[32px] md:text-[56px] gold-gradient-text tracking-[0.05em] italic leading-tight">
            {currentTrack.title}
          </h2>
          <p className="text-primary font-body-md text-body-md small-caps tracking-[0.4em] font-medium opacity-90">
            {currentTrack.artist.name}
          </p>
        </div>

        {/* Seek Bar */}
        <div className="w-full max-w-sm space-y-3">
          <div className="relative w-full h-[1px] bg-white/10">
            <div className="absolute top-0 left-0 h-full bg-primary shadow-[0_0_8px_#f2ca50] transition-all duration-300" style={{ width: `${pct}%` }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_#f2ca50] transition-all duration-300" style={{ left: `${pct}%` }} />
            <input type="range" min={0} max={duration || 1} value={progress} onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
          <div className="flex justify-between text-[11px] font-label-sm tracking-widest text-on-surface/40 uppercase">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between w-full max-w-sm px-2">
          <button onClick={toggleShuffle} className={`transition-all duration-300 active:scale-90 ${shuffle ? 'text-primary drop-shadow-[0_0_8px_rgba(242,202,80,0.3)]' : 'text-on-surface/40 hover:text-primary'}`}>
            <span className="material-symbols-outlined text-2xl">shuffle</span>
          </button>
          <div className="flex items-center space-x-8">
            <button onClick={prev} className="text-on-surface active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-[36px] font-light">skip_previous</span>
            </button>
            <button onClick={() => (isPlaying ? pause() : resume())}
              className="w-20 h-20 rounded-full sunburst-btn flex items-center justify-center text-on-primary active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[44px] font-light" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <button onClick={next} className="text-on-surface active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-[36px] font-light">skip_next</span>
            </button>
          </div>
          <button onClick={toggleRepeat} className={`transition-all duration-300 active:scale-90 relative ${repeat !== 'off' ? 'text-primary drop-shadow-[0_0_8px_rgba(242,202,80,0.3)]' : 'text-on-surface/40 hover:text-primary'}`}>
            <span className="material-symbols-outlined text-2xl">repeat</span>
            {repeat === 'one' && <span className="absolute -top-1 -right-1 text-[9px] font-bold text-primary">1</span>}
          </button>
        </div>
      </main>

      {/* Frosted Obsidian Bottom Sheet */}
      <div className={`fixed bottom-0 left-0 w-full z-40 frosted-obsidian rounded-t-[3rem] px-gutter pt-5 pb-12 transition-all duration-500 ${sheetOpen ? 'max-h-[70vh]' : 'max-h-[180px]'}`}>
        <div className="flex flex-col items-center">
          <button onClick={() => setSheetOpen(!sheetOpen)} className="w-12 h-1 bg-primary/30 rounded-full mb-4 hover:bg-primary/50 transition-colors" />

          {/* Tabs */}
          <div className="flex items-center gap-4 mb-4">
            {(['lyrics', 'queue', 'controls'] as const).map(mode => (
              <button key={mode} onClick={() => setSheetMode(mode)}
                className={`text-[10px] uppercase tracking-[0.2em] transition-all pb-1 ${
                  sheetMode === mode ? 'text-primary border-b border-primary' : 'text-zinc-500 hover:text-zinc-300'
                }`}>
                {mode === 'lyrics' ? 'Lyrics' : mode === 'queue' ? 'Up Next' : 'Extras'}
              </button>
            ))}
          </div>

          {/* Lyrics */}
          {sheetMode === 'lyrics' && (
            <div className="text-center space-y-3 w-full max-w-md">
              <p className="text-on-surface font-body-lg text-body-lg opacity-90 italic leading-relaxed">
                Midnight whispers in the rain...
              </p>
              <p className="text-on-surface/30 font-body-md text-body-md leading-relaxed">
                Golden lights are fading in the dark...
              </p>
              <button className="flex items-center justify-center space-x-2 text-primary font-label-sm text-label-sm uppercase tracking-[0.2em] hover:brightness-110 mx-auto mt-2">
                <span className="material-symbols-outlined text-lg">lyrics</span>
                <span>Full Lyrics</span>
              </button>
            </div>
          )}

          {/* Queue */}
          {sheetMode === 'queue' && queue.length > 1 && (
            <div className="w-full max-w-md max-h-48 overflow-y-auto custom-scrollbar space-y-1">
              {queue.map((track, i) => (
                <div key={`${track.source || 'queue'}-${track.id}`}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                    i === queueIndex ? 'bg-primary/8 border border-primary/15' : 'hover:bg-white/[0.03] border border-transparent'
                  }`}>
                  <span className="w-5 text-center text-xs text-zinc-600 font-mono">{i + 1}</span>
                  {(() => {
                    const src = track.youtubeId ? `https://i.ytimg.com/vi/${track.youtubeId}/default.jpg` : (track.album.cover_small || track.album.cover_medium);
                    return src ? (
                      <img src={src} alt="" className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/[0.05]" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm text-zinc-600">music_note</span>
                      </div>
                    );
                  })()}
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium truncate ${i === queueIndex ? 'text-primary' : 'text-zinc-300'}`}>{track.title}</p>
                    <p className="text-[10px] text-zinc-600 truncate">{track.artist.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Controls */}
          {sheetMode === 'controls' && (
            <div className="w-full max-w-md space-y-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-lg text-zinc-500">volume_up</span>
                <div className="flex-1 relative h-1 rounded-full bg-white/[0.08] overflow-hidden">
                  <div className="h-full rounded-full bg-primary/60 transition-all duration-200" style={{ width: `${volume * 100}%` }} />
                  <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <span className="text-[10px] text-zinc-500 w-6 text-right font-mono">{Math.round(volume * 100)}%</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setShowEq(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-all uppercase tracking-wider">
                  <span className="material-symbols-outlined text-lg">tune</span>
                  EQ
                </button>
                <button onClick={() => setShowSfx(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-all uppercase tracking-wider">
                  <span className="material-symbols-outlined text-lg">graphic_eq</span>
                  FX
                </button>
                <button onClick={() => downloadCurrentTrack()} disabled={downloading} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-all disabled:opacity-40 uppercase tracking-wider">
                  {downloading ? (
                    <div className="w-3.5 h-3.5 rounded-full border border-primary/30 border-t-primary animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-lg">download</span>
                  )}
                  {downloading ? 'Saving...' : 'Download'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Airplay / Output button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-on-surface/60 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-xl">airplay</span>
        </button>
      </div>
    </div>
  );
}
