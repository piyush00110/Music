'use client';

import { usePlayer } from '@/lib/PlayerContext';
import Equalizer from '@/components/Equalizer';
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
      if (!ctx) { resolve('#0a0a0f'); return; }
      ctx.drawImage(img, 0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      resolve(`rgb(${d[0]},${d[1]},${d[2]})`);
    };
    img.onerror = () => resolve('#0a0a0f');
    img.src = imgUrl;
  });
}

function formatTime(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlayerPage() {
  const {
    currentTrack, isPlaying, queue, queueIndex,
    progress, duration, volume,
    pause, resume, next, prev,
    setVolume, seek, toggleShuffle, toggleRepeat,
    shuffle, repeat, soundEffects,
    downloadCurrentTrack, downloading,
    setSoundEffect,
  } = usePlayer();
  const [bgColor, setBgColor] = useState('#0a0a0f');
  const [showQueue, setShowQueue] = useState(false);
  const [showEq, setShowEq] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!currentTrack) return;
    const src = currentTrack.youtubeId
      ? `https://i.ytimg.com/vi/${currentTrack.youtubeId}/hqdefault.jpg`
      : currentTrack.album.cover_medium;
    if (src) extractColor(src).then(setBgColor);
    else setBgColor('#0a0a0f');
  }, [currentTrack?.youtubeId, currentTrack?.album.cover_medium]);

  const pct = duration > 0 ? (progress / duration) * 100 : 0;
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => seek(Number(e.target.value)), [seek]);

  if (!currentTrack) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-[#0a0a0f]">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-zinc-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-zinc-600">music_note</span>
          </div>
          <p className="text-zinc-300 text-lg mb-1 font-medium">No track playing</p>
          <p className="text-zinc-600 text-sm mb-6">Pick a song to get started</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full text-sm font-semibold hover:opacity-90 transition-all active:scale-95">
            <span className="material-symbols-outlined text-lg">play_arrow</span>
            Browse Music
          </Link>
        </div>
      </div>
    );
  }

  const useYtThumb = !!currentTrack.youtubeId;
  const artSrc = useYtThumb ? `https://i.ytimg.com/vi/${currentTrack.youtubeId}/hqdefault.jpg` : currentTrack.album.cover_medium;

  return (
    <div className="relative min-h-screen flex flex-col bg-[#0a0a0f]">
      {/* Gradient background from album art */}
      <div className="fixed inset-0 pointer-events-none transition-colors duration-1000" style={{ background: `radial-gradient(ellipse at 50% 0%, ${bgColor}80 0%, transparent 70%)` }} />
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[#0a0a0f]/60 to-[#0a0a0f]" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-12 pb-2">
        <Link href="/" className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-90">
          <span className="material-symbols-outlined text-xl">chevron_left</span>
        </Link>
        <div className="text-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium">Now Playing</p>
        </div>
        <button onClick={() => setShowMenu(!showMenu)} className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-90">
          <span className="material-symbols-outlined text-xl">more_horiz</span>
        </button>
      </header>

      {/* Menu dropdown */}
      {showMenu && (
        <div className="fixed top-24 right-5 z-50 bg-zinc-900/95 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-2 min-w-[180px] shadow-2xl fade-in">
          <button onClick={() => { setShowEq(!showEq); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all">
            <span className="material-symbols-outlined text-zinc-400">tune</span>
            Equalizer
          </button>
          <button onClick={() => { downloadCurrentTrack(); setShowMenu(false); }} disabled={downloading} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all disabled:opacity-40">
            {downloading ? (
              <div className="w-5 h-5 rounded-full border border-zinc-500/30 border-t-zinc-300 animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-zinc-400">download</span>
            )}
            {downloading ? 'Saving...' : 'Download'}
          </button>
        </div>
      )}

      {/* EQ panel */}
      {showEq && (
        <div className="relative z-10 px-5 mb-2 fade-in">
          <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs text-zinc-400 uppercase tracking-wider">Equalizer</h3>
              <button onClick={() => setShowEq(false)} className="text-zinc-500 hover:text-white">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <Equalizer />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-4 space-y-6">
        {/* Album art */}
        <div className="w-72 h-72 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/[0.06]">
          {artSrc ? (
            <img src={artSrc} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
              <span className="material-symbols-outlined text-6xl text-zinc-700">music_note</span>
            </div>
          )}
        </div>

        {/* Track info */}
        <div className="w-full max-w-sm text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white truncate">{currentTrack.title}</h2>
          <p className="text-sm text-zinc-400 mt-0.5 truncate hover:text-zinc-300 transition-colors cursor-pointer">{currentTrack.artist.name}</p>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-sm space-y-1.5">
          <div className="relative w-full h-1 bg-white/[0.07] rounded-full overflow-hidden group cursor-pointer">
            <div className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-300 group-hover:bg-[#1DB954]" style={{ width: `${pct}%` }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" style={{ left: `${pct}%` }} />
            <input type="range" min={0} max={duration || 1} value={progress} onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
          <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between w-full max-w-sm">
          <button onClick={toggleShuffle} className={`transition-all active:scale-90 ${shuffle ? 'text-[#1DB954]' : 'text-zinc-400 hover:text-white'}`}>
            <span className="material-symbols-outlined text-xl">shuffle</span>
          </button>
          <button onClick={prev} className="text-zinc-300 hover:text-white transition-all active:scale-90">
            <span className="material-symbols-outlined text-[32px]">skip_previous</span>
          </button>
          <button onClick={() => (isPlaying ? pause() : resume())}
            className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-xl">
            <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button onClick={next} className="text-zinc-300 hover:text-white transition-all active:scale-90">
            <span className="material-symbols-outlined text-[32px]">skip_next</span>
          </button>
          <button onClick={toggleRepeat} className={`transition-all active:scale-90 relative ${repeat !== 'off' ? 'text-[#1DB954]' : 'text-zinc-400 hover:text-white'}`}>
            <span className="material-symbols-outlined text-xl">repeat</span>
            {repeat === 'one' && <span className="absolute -top-1 -right-1 text-[8px] font-bold text-[#1DB954]">1</span>}
          </button>
        </div>

        {/* Action buttons row */}
        <div className="flex items-center justify-between w-full max-w-sm px-2">
          <button onClick={() => setLiked(!liked)} className={`transition-all active:scale-90 ${liked ? 'text-[#1DB954]' : 'text-zinc-500 hover:text-white'}`}>
            <span className="material-symbols-outlined text-xl" style={liked ? { fontVariationSettings: "'FILL' 1" } : undefined}>
              favorite
            </span>
          </button>
          <button onClick={() => setShowLyrics(!showLyrics)} className={`transition-all active:scale-90 ${showLyrics ? 'text-[#1DB954]' : 'text-zinc-500 hover:text-white'}`}>
            <span className="material-symbols-outlined text-xl">lyrics</span>
          </button>
          <button onClick={() => setShowQueue(!showQueue)} className={`transition-all active:scale-90 ${showQueue ? 'text-[#1DB954]' : 'text-zinc-500 hover:text-white'}`}>
            <span className="material-symbols-outlined text-xl">queue_music</span>
          </button>
          <button className="text-zinc-500 hover:text-white transition-all active:scale-90">
            <span className="material-symbols-outlined text-xl">devices</span>
          </button>
          <button onClick={() => downloadCurrentTrack()} disabled={downloading} className="text-zinc-500 hover:text-white transition-all active:scale-90 disabled:opacity-40">
            {downloading ? (
              <div className="w-5 h-5 rounded-full border border-zinc-500/30 border-t-zinc-300 animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-xl">download</span>
            )}
          </button>
        </div>

        {/* Volume */}
        <div className="w-full max-w-sm flex items-center gap-3">
          <span className="material-symbols-outlined text-lg text-zinc-500">volume_down</span>
          <div className="flex-1 relative h-1 bg-white/[0.07] rounded-full overflow-hidden group cursor-pointer">
            <div className="h-full bg-white/60 rounded-full transition-all duration-200 group-hover:bg-[#1DB954]/60" style={{ width: `${volume * 100}%` }} />
            <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
          <span className="material-symbols-outlined text-lg text-zinc-500">volume_up</span>
        </div>
      </main>

      {/* Lyrics panel */}
      {showLyrics && (
        <div className="fixed inset-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-2xl fade-in flex flex-col">
          <div className="flex items-center justify-between p-5 pt-12">
            <h3 className="text-sm text-zinc-400 uppercase tracking-wider font-medium">Lyrics</h3>
            <button onClick={() => setShowLyrics(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-20">
            <div className="text-center space-y-6 max-w-md mx-auto mt-10">
              <p className="text-white text-lg leading-relaxed">Midnight whispers in the rain...</p>
              <p className="text-zinc-500 text-lg leading-relaxed">Golden lights are fading in the dark...</p>
              <p className="text-white/80 text-lg leading-relaxed">Every note a memory we share...</p>
              <p className="text-zinc-500 text-lg leading-relaxed">Lost in melodies without a care...</p>
            </div>
          </div>
        </div>
      )}

      {/* Queue panel */}
      {showQueue && (
        <div className="fixed inset-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-2xl fade-in flex flex-col">
          <div className="flex items-center justify-between p-5 pt-12">
            <div>
              <h3 className="text-sm text-zinc-400 uppercase tracking-wider font-medium">Up Next</h3>
              <p className="text-xs text-zinc-600 mt-0.5">{queue.length} tracks</p>
            </div>
            <button onClick={() => setShowQueue(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-20 space-y-0.5">
            {queue.map((track, i) => (
              <div key={`${track.source || 'queue'}-${track.id}`}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  i === queueIndex ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                }`}>
                <span className="w-5 text-center text-xs text-zinc-600 font-mono">{i + 1}</span>
                {(() => {
                  const src = track.youtubeId ? `https://i.ytimg.com/vi/${track.youtubeId}/default.jpg` : (track.album.cover_small || track.album.cover_medium);
                  return src ? (
                    <img src={src} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                      <span className="material-symbols-outlined text-zinc-600">music_note</span>
                    </div>
                  );
                })()}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${i === queueIndex ? 'text-white' : 'text-zinc-300'}`}>{track.title}</p>
                  <p className="text-xs text-zinc-600 truncate">{track.artist.name}</p>
                </div>
                {i === queueIndex && (
                  <span className="material-symbols-outlined text-sm text-[#1DB954]">volume_up</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


