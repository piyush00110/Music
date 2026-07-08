'use client';

import { usePlayer } from '@/lib/PlayerContext';
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';

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
    progress, duration, volume,
    pause, resume, next, prev,
    setVolume, seek, toggleShuffle, toggleRepeat,
    shuffle, repeat, soundEffects, audioQuality,
    downloadCurrentTrack, downloading, setAudioQuality,
    setSoundEffect,
  } = usePlayer();
  const [showMore, setShowMore] = useState(false);
  const [sheetMode, setSheetMode] = useState<'optimization' | 'lyrics'>('optimization');
  const [sheetOpen, setSheetOpen] = useState(false);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value));
  }, [seek]);

  const [eqBands, setEqBands] = useState([50, 60, 40, 70, 55]);

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
      <div className="full-bleed-bg" style={{ backgroundImage: `url(${artSrc})`, opacity: 0.6, filter: 'blur(20px) brightness(0.5)' }} />
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

      {/* More menu */}
      {showMore && (
        <div className="fixed top-20 right-6 z-50 bg-[#1c1b1b]/90 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-3 min-w-[200px] shadow-2xl fade-in">
          <div className="space-y-1">
            <button onClick={() => { downloadCurrentTrack(); setShowMore(false); }} disabled={downloading} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all disabled:opacity-40">
              <span className="material-symbols-outlined text-primary text-xl">download</span>
              <span>{downloading ? 'Saving...' : 'Download'}</span>
            </button>
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
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center pt-32 pb-48 px-container-padding-mobile space-y-8">
        {/* Album Art (square rounded) */}
        <div className="relative flex items-center justify-center">
          <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
            {artSrc ? (
              <img src={artSrc} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                <span className="material-symbols-outlined text-6xl text-zinc-700">music_note</span>
              </div>
            )}
          </div>
        </div>

        {/* Track Info */}
        <div className="text-center space-y-2">
          <MarqueeText text={currentTrack.title} className="font-display-lg-mobile text-[36px] md:text-[48px] gold-gradient-text font-bold tracking-tight leading-tight" />
          <p className="text-on-surface/70 font-body-md text-body-md tracking-[0.2em] uppercase">{currentTrack.artist.name}</p>
          <div className="flex items-center justify-center mt-1">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-primary/30 bg-primary/5">
              <span className="material-symbols-outlined text-[14px] text-primary">high_res</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Hi-Res Lossless</span>
            </div>
          </div>
        </div>

        {/* Seek Bar */}
        <div className="w-full max-w-sm space-y-3">
          <div className="relative w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
            <input type="range" min={0} max={duration || 1} value={progress} onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
          <div className="flex justify-between text-[12px] font-medium text-on-surface/40">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between w-full max-w-sm px-2">
          <button onClick={toggleShuffle} className={`transition-all duration-300 active:scale-90 ${shuffle ? 'text-primary' : 'text-primary/60 hover:text-primary'}`}>
            <span className="material-symbols-outlined text-2xl">shuffle</span>
          </button>
          <div className="flex items-center space-x-6">
            <button onClick={prev} className="text-primary active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-[32px] font-light">skip_previous</span>
            </button>
            <button onClick={() => (isPlaying ? pause() : resume())}
              className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary active:scale-95 transition-all shadow-[0_0_20px_rgba(242,202,80,0.3)]">
              <span className="material-symbols-outlined text-[40px] font-light" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <button onClick={next} className="text-primary active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-[32px] font-light">skip_next</span>
            </button>
          </div>
          <button onClick={toggleRepeat} className={`transition-all duration-300 active:scale-90 relative ${repeat !== 'off' ? 'text-primary' : 'text-primary/60 hover:text-primary'}`}>
            <span className="material-symbols-outlined text-2xl">repeat</span>
            {repeat === 'one' && <span className="absolute -top-1 -right-1 text-[9px] font-bold text-primary">1</span>}
          </button>
        </div>
      </main>

      {/* Frosted Obsidian Bottom Sheet */}
      <div className={`fixed bottom-0 left-0 w-full z-40 frosted-obsidian rounded-t-[3rem] px-gutter pt-5 pb-12 transition-all duration-500 bg-black/40 ${sheetOpen ? 'max-h-[80vh]' : 'max-h-[200px]'}`}>
        <div className="flex flex-col items-center">
          <button onClick={() => setSheetOpen(!sheetOpen)} className="w-8 h-1 bg-white/20 rounded-full mb-6" />

          {/* Tabs */}
          <div className="flex justify-around w-full max-w-md border-b border-white/5 pb-4 mb-6">
            {(['optimization', 'lyrics'] as const).map(mode => (
              <button key={mode} onClick={() => setSheetMode(mode)}
                className={`font-label-sm text-label-sm uppercase tracking-widest transition-all ${
                  sheetMode === mode ? 'text-primary' : 'text-on-surface/40'
                }`}>
                {mode === 'optimization' ? 'Optimization' : 'Lyrics'}
              </button>
            ))}
          </div>

          {/* Optimization */}
          {sheetMode === 'optimization' && (
            <div className="w-full max-w-md space-y-8">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-on-surface font-medium">Spatial Audio</p>
                  <p className="text-[12px] text-on-surface/40">Immersive 360&deg; Sound</p>
                </div>
                <button onClick={() => setSoundEffect('spatialAudio', !soundEffects.spatialAudio)}
                  className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-all ${soundEffects.spatialAudio ? 'bg-primary/20' : 'bg-white/10'}`}>
                  <div className={`w-4 h-4 rounded-full transition-all duration-300 shadow-[0_0_10px_#f2ca50] ${soundEffects.spatialAudio ? 'bg-primary translate-x-6' : 'bg-white/40'}`} />
                </button>
              </div>

              <div className="space-y-6">
                <p className="text-[12px] uppercase tracking-widest text-on-surface/40 font-bold">5-Band Equalizer</p>
                <div className="flex justify-between items-end h-32 px-2">
                  {[
                    { label: '60Hz', value: eqBands[0], idx: 0 },
                    { label: '230Hz', value: eqBands[1], idx: 1 },
                    { label: '1kHz', value: eqBands[2], idx: 2 },
                    { label: '4kHz', value: eqBands[3], idx: 3 },
                    { label: '16kHz', value: eqBands[4], idx: 4 },
                  ].map(band => (
                    <div key={band.label} className="flex flex-col items-center space-y-2 h-full justify-end">
                      <div className="w-1 h-24 bg-white/10 rounded-full relative flex items-center cursor-pointer"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const pct = 100 - ((e.clientY - rect.top) / rect.height) * 100;
                          const val = Math.max(0, Math.min(100, Math.round(pct)));
                          const newBands = [...eqBands];
                          newBands[band.idx] = val;
                          setEqBands(newBands);
                        }}>
                        <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_#f2ca50] absolute transition-all duration-150"
                          style={{ bottom: `${band.value}%`, transform: 'translateY(50%)' }} />
                      </div>
                      <span className="text-[10px] text-on-surface/40">{band.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="space-y-1">
                  <p className="text-on-surface font-medium">Master Quality Rendering</p>
                  <p className="text-[12px] text-on-surface/40">Studio-grade MQA unfolding</p>
                </div>
                <button onClick={() => setSoundEffect('masterQuality', !soundEffects.masterQuality)}
                  className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-all ${soundEffects.masterQuality ? 'bg-primary/20' : 'bg-white/10'}`}>
                  <div className={`w-4 h-4 rounded-full transition-all duration-300 ${soundEffects.masterQuality ? 'bg-primary translate-x-6' : 'bg-white/40'}`} />
                </button>
              </div>
            </div>
          )}

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
