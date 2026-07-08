'use client';

import { usePlayer } from '@/lib/PlayerContext';
import ProgressBar from '@/components/ProgressBar';
import EnhancedVisualizer from '@/components/EnhancedVisualizer';
import Equalizer from '@/components/Equalizer';
import Recommendations from '@/components/Recommendations';
import Link from 'next/link';
import { useState } from 'react';

export default function PlayerPage() {
  const {
    currentTrack, isPlaying, queue, queueIndex,
    progress, duration, volume, audioQuality,
    pause, resume, next, prev,
    setVolume, seek, toggleShuffle, toggleRepeat,
    shuffle, repeat, equalizer, soundEffects,
    downloadCurrentTrack, downloading, setAudioQuality,
    showEqualizer, showSoundEffects, setSoundEffect,
  } = usePlayer();
  const [showEq, setShowEq] = useState(false);
  const [showSfx, setShowSfx] = useState(false);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="glass-panel rounded-2xl p-12 text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-zinc-800/50 flex items-center justify-center">
            <svg className="w-12 h-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377" />
            </svg>
          </div>
          <p className="text-zinc-400 text-lg mb-2 font-[family-name:var(--font-serif)]">No track playing</p>
          <p className="text-zinc-600 text-sm mb-6">Search for music from YouTube, Audius & Deezer</p>
          <Link href="/" className="px-6 py-3 bg-[#D4AF37] text-black rounded-full text-sm font-semibold hover:bg-[#E0BF4A] transition-all shadow-lg shadow-[#D4AF37]/20 gold-glow-btn inline-flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            Browse Music
          </Link>
        </div>
      </div>
    );
  }

  const useYtThumb = !!currentTrack.youtubeId;
  const thumb = useYtThumb ? `https://i.ytimg.com/vi/${currentTrack.youtubeId}/hqdefault.jpg` : '';

  return (
    <div className="flex flex-col items-center px-4 py-6 max-w-2xl mx-auto slide-up">
      {/* Album art with spinning animation */}
      <div className="relative group mb-4">
        <div className={`relative w-64 h-64 md:w-72 md:h-72 rounded-2xl overflow-hidden bg-zinc-900 glow-gold ${isPlaying ? 'animate-spin-slow' : ''}`}
          style={{ animationDuration: '8s', animationTimingFunction: 'linear', animationIterationCount: 'infinite', animationPlayState: isPlaying ? 'running' : 'paused' }}>
          {(() => {
            const artSrc = thumb || currentTrack.album.cover_medium;
            return artSrc ? (
              <img src={artSrc} alt={currentTrack.album.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                <svg className="w-16 h-16 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377" />
                </svg>
              </div>
            );
          })()}
          {/* Vinyl grooves overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-3 rounded-full border border-white/[0.03]" />
            <div className="absolute inset-6 rounded-full border border-white/[0.02]" />
            <div className="absolute inset-9 rounded-full border border-white/[0.02]" />
          </div>
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-black/70 backdrop-blur-md border-2 border-[#D4AF37]/30 flex items-center justify-center shadow-lg">
              <button
                onClick={() => (isPlaying ? pause() : resume())}
                className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center hover:bg-[#E0BF4A] transition-all active:scale-90"
              >
                {isPlaying ? (
                  <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-black ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        {/* Track info overlay */}
        <div className="mt-3 text-center">
          <h2 className="text-white font-[family-name:var(--font-serif)] text-lg font-semibold truncate max-w-64 mx-auto">{currentTrack.title}</h2>
          <p className="text-zinc-400 text-sm truncate max-w-64 mx-auto">{currentTrack.artist.name}</p>
        </div>
      </div>

      {/* Visualizer */}
      <div className="w-full mb-3">
        <EnhancedVisualizer isPlaying={isPlaying} barCount={64} height={48} />
      </div>

      {/* Progress */}
      <div className="w-full mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-zinc-500 font-mono">{formatTime(progress)}</span>
          <span className="text-xs text-zinc-500 font-mono">{formatTime(duration)}</span>
        </div>
        <div className="transition-all duration-300 ease-out">
          <ProgressBar value={progress} max={duration} onChange={seek} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-5 mb-5">
        <button onClick={toggleShuffle} className={`transition-all active:scale-90 ${shuffle ? 'text-[#D4AF37]' : 'text-zinc-400 hover:text-white'}`} title="Shuffle">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        </button>
        <button onClick={prev} className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-90" title="Previous">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" /></svg>
        </button>
        <button onClick={() => (isPlaying ? pause() : resume())} className="w-16 h-16 rounded-full bg-[#D4AF37] flex items-center justify-center hover:bg-[#E0BF4A] transition-all shadow-xl shadow-[#D4AF37]/30 active:scale-95 gold-glow-btn" title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? (
            <svg className="w-7 h-7 text-black" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
          ) : (
            <svg className="w-7 h-7 text-black ml-1" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
        <button onClick={next} className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-90" title="Next">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM5.5 6l8.5 6-8.5 6z" /></svg>
        </button>
        <button onClick={toggleRepeat} className={`transition-all active:scale-90 ${repeat !== 'off' ? 'text-[#D4AF37]' : 'text-zinc-400 hover:text-white'}`} title={`Repeat: ${repeat}`}>
          <div className="relative">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
            </svg>
            {repeat === 'one' && <span className="absolute -top-1 -right-1 text-[8px] font-bold text-[#D4AF37]">1</span>}
          </div>
        </button>
      </div>

      {/* Volume */}
      <div className="w-full flex items-center gap-3 mb-4">
        <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
        </svg>
        <div className="flex-1"><ProgressBar value={volume} max={1} onChange={setVolume} /></div>
        <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.531v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
        </svg>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mb-5 flex-wrap justify-center">
        <button
          onClick={() => setShowEq(!showEq)}
          className={`px-4 py-2 rounded-full border text-[11px] transition-all flex items-center gap-1.5 active:scale-95 ${
            showEq ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]' : 'border-white/10 text-zinc-400 hover:border-[#D4AF37]/30 hover:text-[#D4AF37]'
          }`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
          EQ
        </button>
        <button
          onClick={() => setShowSfx(!showSfx)}
          className={`px-4 py-2 rounded-full border text-[11px] transition-all flex items-center gap-1.5 active:scale-95 ${
            showSfx ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]' : 'border-white/10 text-zinc-400 hover:border-[#D4AF37]/30 hover:text-[#D4AF37]'
          }`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
          FX
        </button>
        <button
          onClick={() => downloadCurrentTrack()}
          disabled={downloading}
          className="px-4 py-2 rounded-full border border-white/10 text-[11px] text-zinc-400 hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
        >
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
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Quality</span>
            {['low', 'mid', 'high'].map(q => (
              <button
                key={q}
                onClick={() => setAudioQuality(q)}
                className={`px-2.5 py-1.5 rounded-full text-[10px] uppercase tracking-wider transition-all ${
                  audioQuality === q
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                    : 'text-zinc-500 border border-white/5 hover:border-[#D4AF37]/20 hover:text-zinc-300'
                }`}
              >
                {q === 'high' ? 'HD' : q === 'mid' ? 'SD' : 'Low'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Equalizer panel */}
      {showEq && (
        <div className="w-full fade-in">
          <Equalizer />
        </div>
      )}

      {/* Sound Effects panel */}
      {showSfx && (
        <div className="w-full glass-panel rounded-2xl p-5 fade-in">
          <h3 className="text-sm font-[family-name:var(--font-serif)] text-white uppercase tracking-wider mb-4">Sound Effects</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">3D Surround</span>
                <span className="text-zinc-500 font-mono">{soundEffects.surround3D}%</span>
              </div>
              <ProgressBar value={soundEffects.surround3D / 100} max={1} onChange={v => setSoundEffect('surround3D', Math.round(v * 100))} />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Bass Boost</span>
                <span className="text-zinc-500 font-mono">{soundEffects.bassBoost}%</span>
              </div>
              <ProgressBar value={soundEffects.bassBoost / 100} max={1} onChange={v => setSoundEffect('bassBoost', Math.round(v * 100))} />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Reverb</span>
                <span className="text-zinc-500 font-mono">{soundEffects.reverb}%</span>
              </div>
              <ProgressBar value={soundEffects.reverb / 100} max={1} onChange={v => setSoundEffect('reverb', Math.round(v * 100))} />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Vocal Boost</span>
                <span className="text-zinc-500 font-mono">{soundEffects.vocalBoost}%</span>
              </div>
              <ProgressBar value={soundEffects.vocalBoost / 100} max={1} onChange={v => setSoundEffect('vocalBoost', Math.round(v * 100))} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Night Mode</span>
              <button
                onClick={() => setSoundEffect('nightMode', !soundEffects.nightMode)}
                className={`w-10 h-5 rounded-full transition-all relative ${soundEffects.nightMode ? 'bg-[#D4AF37]' : 'bg-zinc-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${soundEffects.nightMode ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="w-full mt-4">
        <Recommendations />
      </div>

      {/* Queue */}
      {queue.length > 1 && (
        <div className="w-full mt-6">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
            </svg>
            Up Next ({queue.length} tracks)
          </h3>
          <div className="space-y-0.5 max-h-64 overflow-y-auto">
            {queue.map((track, i) => (
              <div key={`${track.source || 'queue'}-${track.id}`} className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                i === queueIndex ? 'active-track-glow border border-[#D4AF37]/20' : 'hover:bg-white/[0.03] border border-transparent'
              }`}>
                <span className="w-5 text-center text-xs text-zinc-600 font-mono">{i + 1}</span>
                {(() => {
                  const src = track.youtubeId ? `https://i.ytimg.com/vi/${track.youtubeId}/default.jpg` : (track.album.cover_small || track.album.cover_medium);
                  return src ? (
                    <img src={src} alt="" className="w-9 h-9 rounded object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded bg-zinc-800 flex items-center justify-center">
                      <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377" />
                      </svg>
                    </div>
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
  );
}
