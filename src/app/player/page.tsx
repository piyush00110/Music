'use client';

import { usePlayer } from '@/lib/PlayerContext';
import ProgressBar from '@/components/ProgressBar';
import EnhancedVisualizer from '@/components/EnhancedVisualizer';
import Recommendations from '@/components/Recommendations';
import Link from 'next/link';
import { useCallback } from 'react';

export default function PlayerPage() {
  const {
    currentTrack, isPlaying, queue, queueIndex,
    progress, duration, volume, audioQuality,
    pause, resume, next, prev,
    setVolume, seek, toggleShuffle, toggleRepeat,
    shuffle, repeat,
    downloadCurrentTrack, downloading, setAudioQuality,
  } = usePlayer();

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="glass-panel rounded-2xl p-12 text-center max-w-md">
          <svg className="w-20 h-20 mx-auto text-zinc-700 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377" />
          </svg>
          <p className="text-zinc-400 text-lg mb-2 font-[family-name:var(--font-serif)]">No track playing</p>
          <p className="text-zinc-600 text-sm mb-6">Search for music from YouTube</p>
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
    <div className="flex flex-col items-center px-4 py-8 max-w-2xl mx-auto slide-up">
      <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden mb-4 bg-zinc-900 album-hover glow-gold">
        {(() => {
          const artSrc = thumb || currentTrack.album.cover_medium;
          return artSrc ? <img src={artSrc} alt={currentTrack.album.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><svg className="w-16 h-16 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377" /></svg></div>;
        })()}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => (isPlaying ? pause() : resume())}
            className="w-16 h-16 rounded-full bg-[#D4AF37]/90 flex items-center justify-center shadow-2xl shadow-[#D4AF37]/40 active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <svg className="w-7 h-7 text-black" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-black ml-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <h2 className="text-white font-[family-name:var(--font-serif)] text-lg font-semibold truncate">{currentTrack.title}</h2>
          <p className="text-zinc-300 text-sm truncate">{currentTrack.artist.name}</p>
        </div>
      </div>

      <div className="w-full mb-2">
        <EnhancedVisualizer isPlaying={isPlaying} barCount={48} height={60} />
      </div>

      <div className="w-full mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500">{formatTime(progress)}</span>
          <span className="text-xs text-zinc-500">{formatTime(duration)}</span>
        </div>
        <ProgressBar value={progress} max={duration} onChange={seek} />
      </div>

      <div className="flex items-center justify-center gap-6 mb-6">
        <button onClick={toggleShuffle} className={`transition-all active:scale-90 ${shuffle ? 'text-[#D4AF37]' : 'text-zinc-400 hover:text-white'}`}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        </button>
        <button onClick={prev} className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-90">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" /></svg>
        </button>
        <button onClick={() => (isPlaying ? pause() : resume())} className="w-16 h-16 rounded-full bg-[#D4AF37] flex items-center justify-center hover:bg-[#E0BF4A] transition-all shadow-xl shadow-[#D4AF37]/30 active:scale-95 gold-glow-btn">
          {isPlaying ? (
            <svg className="w-7 h-7 text-black" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
          ) : (
            <svg className="w-7 h-7 text-black ml-1" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
        <button onClick={next} className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-90">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM5.5 6l8.5 6-8.5 6z" /></svg>
        </button>
        <button onClick={toggleRepeat} className={`transition-all active:scale-90 ${repeat !== 'off' ? 'text-[#D4AF37]' : 'text-zinc-400 hover:text-white'}`}>
          <div className="relative">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
            </svg>
            {repeat === 'one' && <span className="absolute -top-1 -right-1 text-[8px] font-bold text-[#D4AF37]">1</span>}
          </div>
        </button>
      </div>

      <div className="w-full flex items-center gap-3 mb-6">
        <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
        </svg>
        <div className="flex-1"><ProgressBar value={volume} max={1} onChange={setVolume} /></div>
        <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
        </svg>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => downloadCurrentTrack()}
          disabled={downloading}
          className="px-5 py-2.5 rounded-full border border-white/10 text-xs text-zinc-400 hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-wait"
        >
          {downloading ? (
            <div className="w-4 h-4 rounded-full border border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          )}
          {downloading ? 'Downloading...' : currentTrack.youtubeId ? 'Save via YouTube' : 'Download MP3'}
        </button>

          {currentTrack.youtubeId && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Quality</span>
            {['low', 'mid', 'high'].map(q => (
              <button
                key={q}
                onClick={() => setAudioQuality(q)}
                className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider transition-all ${
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

      <div className="flex gap-4">
        <button
          onClick={() => usePlayer().setEqualizer}
          className="px-4 py-2 rounded-full border border-white/10 text-[10px] text-zinc-500 hover:border-[#D4AF37]/30 hover:text-[#D4AF37] transition-all uppercase tracking-wider"
        >
          Equalizer
        </button>
      </div>

      <div className="w-full">
        <Recommendations />
      </div>

      {queue.length > 1 && (
        <div className="w-full mt-6">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-widest text-xs mb-3">
            Up Next ({queue.length} tracks)
          </h3>
          <div className="space-y-1">
            {queue.map((track, i) => (
              <div key={`${track.source || 'queue'}-${track.id}`} className={`flex items-center gap-3 p-2 rounded-lg ${i === queueIndex ? 'active-track-glow' : 'hover:bg-white/[0.03]'}`}>
                <span className="w-5 text-center text-xs text-zinc-600">{i + 1}</span>
                {(() => {
                  const src = track.youtubeId ? `https://i.ytimg.com/vi/${track.youtubeId}/default.jpg` : (track.album.cover_small || track.album.cover_medium);
                  return src ? <img src={src} alt="" className="w-9 h-9 rounded object-cover" /> : <div className="w-9 h-9 rounded bg-zinc-800 flex items-center justify-center"><svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377" /></svg></div>;
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
