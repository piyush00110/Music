'use client';

import { usePlayer } from '@/lib/PlayerContext';
import Equalizer from '@/components/Equalizer';
import EnhancedVisualizer from '@/components/EnhancedVisualizer';
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';

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
  const [showQueue, setShowQueue] = useState(false);
  const [showEq, setShowEq] = useState(false);
  const [showFx, setShowFx] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [liked, setLiked] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [showSleepPicker, setShowSleepPicker] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const startSleepTimer = useCallback((minutes: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSleepTimer(minutes);
    timerRef.current = setTimeout(() => {
      pause();
      setSleepTimer(null);
      timerRef.current = null;
    }, minutes * 60000);
    setShowSleepPicker(false);
  }, [pause]);

  const cancelSleepTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSleepTimer(null);
    timerRef.current = null;
  }, []);

  const pct = duration > 0 ? (progress / duration) * 100 : 0;
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => seek(Number(e.target.value)), [seek]);

  if (!currentTrack) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-[#0a0a0f]">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-zinc-800 flex items-center justify-center ring-1 ring-white/[0.06]">
            <span className="material-symbols-outlined text-4xl text-zinc-600">music_note</span>
          </div>
          <p className="text-zinc-300 text-lg mb-1 font-medium">No track playing</p>
          <p className="text-zinc-600 text-sm mb-6">Pick a song to get started</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full text-sm font-semibold hover:opacity-90 transition-all active:scale-95 shadow-lg">
            <span className="material-symbols-outlined text-lg">play_arrow</span>
            Browse Music
          </Link>
        </div>
      </div>
    );
  }

  const useYtThumb = !!currentTrack.youtubeId;
  const artSrc = useYtThumb ? `https://i.ytimg.com/vi/${currentTrack.youtubeId}/hqdefault.jpg` : currentTrack.album.cover_medium;
  const albumTitle = currentTrack.album?.title || 'Unknown Album';

  return (
    <div className="relative min-h-screen flex flex-col bg-[#0a0a0f]">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: `url(${artSrc})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(40px) brightness(0.4)', opacity: 0.8 }} />
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[#0a0a0f]/30 to-[#0a0a0f]" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-6 pt-12 pb-2">
        <Link href="/" className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-90">
          <span className="material-symbols-outlined text-xl">chevron_left</span>
        </Link>
        <div className="flex items-center gap-2">
          {sleepTimer && (
            <button onClick={cancelSleepTimer} className="px-3 py-1.5 rounded-full bg-[#1DB954]/20 text-[#1DB954] text-[10px] font-medium flex items-center gap-1 hover:bg-[#1DB954]/30 transition-all">
              <span className="material-symbols-outlined text-sm">timer</span>
              {sleepTimer}m
            </button>
          )}
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium">Now Playing</p>
        </div>
        <button onClick={() => setShowMenu(!showMenu)} className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-90">
          <span className="material-symbols-outlined text-xl">more_horiz</span>
        </button>
      </header>

      {/* Menu */}
      {showMenu && (
        <div className="fixed top-24 right-4 md:right-6 z-50 bg-zinc-900/95 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-2 min-w-[200px] shadow-2xl fade-in">
          <button onClick={() => { setShowEq(!showEq); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all">
            <span className="material-symbols-outlined text-zinc-400">tune</span>
            Equalizer
          </button>
          <button onClick={() => { setShowFx(!showFx); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all">
            <span className="material-symbols-outlined text-zinc-400">graphic_eq</span>
            Sound Effects
          </button>
          <button onClick={() => { setShowSleepPicker(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all">
            <span className="material-symbols-outlined text-zinc-400">bedtime</span>
            Sleep Timer
          </button>
          <div className="h-px bg-white/[0.04] my-1" />
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

      {/* Sleep timer picker */}
      {showSleepPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm fade-in">
          <div className="bg-zinc-900 border border-white/[0.06] rounded-2xl p-6 w-[280px] shadow-2xl">
            <h3 className="text-sm text-zinc-300 font-medium mb-4">Set Sleep Timer</h3>
            <div className="space-y-1">
              {[15, 30, 45, 60, 90].map(min => (
                <button key={min} onClick={() => startSleepTimer(min)} className="w-full px-4 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all text-left">
                  {min} minutes
                </button>
              ))}
              <button onClick={() => { setShowSleepPicker(false); startSleepTimer(5); }} className="w-full px-4 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all text-left">
                End of track
              </button>
            </div>
            <button onClick={() => setShowSleepPicker(false)} className="w-full mt-3 px-4 py-2.5 rounded-xl text-sm text-zinc-500 hover:bg-white/[0.04] transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* EQ panel */}
      {showEq && (
        <div className="relative z-10 px-4 md:px-6 mb-2 fade-in">
          <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Equalizer</h3>
              <button onClick={() => setShowEq(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <Equalizer />
          </div>
        </div>
      )}

      {/* FX panel */}
      {showFx && (
        <div className="relative z-10 px-4 md:px-6 mb-2 fade-in">
          <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Sound Effects</h3>
              <button onClick={() => setShowFx(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="space-y-4">
              {[
                { key: 'surround3D', label: '3D Surround', icon: 'surround_sound' },
                { key: 'bassBoost', label: 'Bass Boost', icon: 'bass' },
                { key: 'reverb', label: 'Reverb', icon: 'echo' },
                { key: 'vocalBoost', label: 'Vocal Boost', icon: 'mic' },
              ].map(({ key, label, icon }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-zinc-500">{icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">{label}</span>
                      <span className="text-zinc-600 font-mono text-[10px]">{(soundEffects as any)[key]}%</span>
                    </div>
                    <div className="relative h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#1DB954] to-[#1ED760] rounded-full transition-all duration-200" style={{ width: `${(soundEffects as any)[key]}%` }} />
                      <input type="range" min={0} max={100} value={(soundEffects as any)[key]} onChange={e => setSoundEffect(key, Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-zinc-500">dark_mode</span>
                  <span className="text-xs text-zinc-400">Night Mode</span>
                </div>
                <button onClick={() => setSoundEffect('nightMode', !soundEffects.nightMode)}
                  className={`w-10 h-5 rounded-full transition-all relative ${soundEffects.nightMode ? 'bg-[#1DB954]' : 'bg-zinc-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-300 shadow-md ${soundEffects.nightMode ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 md:px-6 pb-4 overflow-y-auto">
        <div className="flex flex-col items-center justify-center space-y-5 md:space-y-6 py-4 w-full max-w-lg mx-auto">

          {/* Album art */}
          <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/[0.06]">
            {artSrc ? (
              <img src={artSrc} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                <span className="material-symbols-outlined text-5xl text-zinc-700">music_note</span>
              </div>
            )}
          </div>

          {/* Visualizer */}
          <div className="w-full max-w-sm">
            <EnhancedVisualizer isPlaying={isPlaying} barCount={48} height={32} />
          </div>

          {/* Track info */}
          <div className="w-full max-w-sm text-center space-y-1">
            <h2 className="text-xl md:text-2xl font-bold text-white truncate">{currentTrack.title}</h2>
            <p className="text-sm text-zinc-400 truncate hover:text-zinc-300 transition-colors cursor-pointer">{currentTrack.artist.name}</p>
            <p className="text-[11px] text-zinc-600 truncate">{albumTitle}</p>
          </div>

          {/* Progress */}
          <div className="w-full max-w-sm space-y-1.5">
            <div className="relative w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden group cursor-pointer">
              <div className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-300 group-hover:bg-[#1DB954]" style={{ width: `${pct}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-black/40" style={{ left: `${pct}%` }} />
              <input type="range" min={0} max={duration || 1} value={progress} onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
            <div className="flex justify-between text-[11px] text-zinc-600 font-mono tabular-nums">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between w-full max-w-sm">
            <button onClick={toggleShuffle} className={`transition-all active:scale-90 ${shuffle ? 'text-[#1DB954]' : 'text-zinc-400 hover:text-white'}`}>
              <span className="material-symbols-outlined text-2xl">shuffle</span>
            </button>
            <button onClick={prev} className="text-zinc-300 hover:text-white transition-all active:scale-90">
              <span className="material-symbols-outlined text-[36px]">skip_previous</span>
            </button>
            <button onClick={() => (isPlaying ? pause() : resume())}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/30">
              <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <button onClick={next} className="text-zinc-300 hover:text-white transition-all active:scale-90">
              <span className="material-symbols-outlined text-[36px]">skip_next</span>
            </button>
            <button onClick={toggleRepeat} className={`transition-all active:scale-90 relative ${repeat !== 'off' ? 'text-[#1DB954]' : 'text-zinc-400 hover:text-white'}`}>
              <span className="material-symbols-outlined text-2xl">repeat</span>
              {repeat === 'one' && <span className="absolute -top-1 -right-1 text-[9px] font-bold text-[#1DB954]">1</span>}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between w-full max-w-sm px-1">
            <button onClick={() => setLiked(!liked)} className={`transition-all active:scale-90 ${liked ? 'text-[#1DB954]' : 'text-zinc-500 hover:text-white'}`}>
              <span className="material-symbols-outlined text-2xl" style={liked ? { fontVariationSettings: "'FILL' 1" } : undefined}>favorite</span>
            </button>
            <button onClick={() => setShowLyrics(!showLyrics)} className={`transition-all active:scale-90 ${showLyrics ? 'text-[#1DB954]' : 'text-zinc-500 hover:text-white'}`}>
              <span className="material-symbols-outlined text-2xl">lyrics</span>
            </button>
            <button onClick={() => setShowQueue(!showQueue)} className={`transition-all active:scale-90 ${showQueue ? 'text-[#1DB954]' : 'text-zinc-500 hover:text-white'}`}>
              <span className="material-symbols-outlined text-2xl">queue_music</span>
            </button>
            <button className="text-zinc-500 hover:text-white transition-all active:scale-90">
              <span className="material-symbols-outlined text-2xl">devices</span>
            </button>
            <button onClick={() => downloadCurrentTrack()} disabled={downloading} className="text-zinc-500 hover:text-white transition-all active:scale-90 disabled:opacity-40">
              {downloading ? (
                <div className="w-5 h-5 rounded-full border border-zinc-500/30 border-t-zinc-300 animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-2xl">download</span>
              )}
            </button>
          </div>

          {/* Volume */}
          <div className="w-full max-w-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-lg text-zinc-500">volume_down</span>
            <div className="flex-1 relative h-1.5 bg-white/[0.06] rounded-full overflow-hidden group cursor-pointer">
              <div className="h-full bg-white/60 rounded-full transition-all duration-200 group-hover:bg-[#1DB954]/60" style={{ width: `${volume * 100}%` }} />
              <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
            <span className="material-symbols-outlined text-lg text-zinc-500">volume_up</span>
          </div>
        </div>

      </main>

      {/* Lyrics overlay */}
      {showLyrics && (
        <div className="fixed inset-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-2xl fade-in flex flex-col">
          <div className="flex items-center justify-between px-5 pt-12 pb-2">
            <h3 className="text-sm text-zinc-400 uppercase tracking-wider font-medium">Lyrics</h3>
            <button onClick={() => setShowLyrics(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-20">
            <div className="text-center space-y-6 max-w-lg mx-auto mt-10">
              <p className="text-white text-lg md:text-xl leading-relaxed font-medium">Midnight whispers in the rain...</p>
              <p className="text-zinc-500 text-lg md:text-xl leading-relaxed">Golden lights are fading in the dark...</p>
              <p className="text-white/80 text-lg md:text-xl leading-relaxed">Every note a memory we share...</p>
              <p className="text-zinc-500 text-lg md:text-xl leading-relaxed">Lost in melodies without a care...</p>
              <p className="text-white text-lg md:text-xl leading-relaxed font-medium">Underneath the starry sky...</p>
              <p className="text-zinc-500 text-lg md:text-xl leading-relaxed">Where the music never dies...</p>
            </div>
          </div>
        </div>
      )}

      {/* Full queue overlay */}
      {showQueue && (
        <div className="fixed inset-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-2xl fade-in flex flex-col">
          <div className="flex items-center justify-between px-5 pt-12 pb-2">
            <div>
              <h3 className="text-sm text-zinc-400 uppercase tracking-wider font-medium">Up Next</h3>
              <p className="text-xs text-zinc-600 mt-0.5">{queue.length} tracks</p>
            </div>
            <button onClick={() => setShowQueue(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-0.5">
            {queue.map((track, i) => (
              <div key={`${track.source || 'queue'}-${track.id}`}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  i === queueIndex ? 'bg-white/[0.06] ring-1 ring-white/[0.06]' : 'hover:bg-white/[0.03]'
                }`}>
                <span className="w-6 text-center text-xs text-zinc-600 font-mono">{i + 1}</span>
                {(() => {
                  const src = track.youtubeId ? `https://i.ytimg.com/vi/${track.youtubeId}/default.jpg` : (track.album.cover_small || track.album.cover_medium);
                  return src ? (
                    <img src={src} alt="" className="w-10 h-10 rounded-lg object-cover ring-1 ring-white/[0.04]" />
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
                  <div className="flex items-center gap-1.5 text-[#1DB954]">
                    <span className="material-symbols-outlined text-sm">volume_up</span>
                    <span className="text-[9px] font-medium uppercase tracking-wider">Now</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
