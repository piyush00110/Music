'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Track } from '@/lib/types';
import { getTrending, searchMusic } from '@/lib/music';
import { usePlayer } from '@/lib/PlayerContext';

interface GalleryImage {
  track: Track;
  src: string;
  title: string;
  artist: string;
}

const GALLERY_QUERIES = [
  'popular music 2026', 'top hits', 'best albums', 'classic rock',
  'hip hop hits', 'electronic music', 'jazz classics', 'pop hits',
  'bollywood hits', 'indian music', 'punjabi songs', 'tamil songs',
  'love songs', 'workout music', 'chill vibes', 'party songs',
];

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState<GalleryImage | null>(null);
  const { play } = usePlayer();

  useEffect(() => {
    async function load() {
      try {
        const allImages: GalleryImage[] = [];
        const trending = await getTrending();
        for (const t of trending) {
          const src = t.album.cover_medium || (t.youtubeId ? `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg` : null);
          if (src) {
            allImages.push({ track: t, src, title: t.title, artist: t.artist.name });
          }
        }
        const searches = await Promise.all(
          GALLERY_QUERIES.slice(0, 6).map(q => searchMusic(q).catch(() => []))
        );
        for (const results of searches) {
          for (const t of results) {
            const src = t.album.cover_medium || (t.youtubeId ? `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg` : null);
            if (src && !allImages.some(img => img.track.id === t.id)) {
              allImages.push({ track: t, src, title: t.title, artist: t.artist.name });
            }
          }
        }
        setImages(allImages);
      } catch (err) {
        console.error('Failed to load gallery:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)]/20 border-t-[var(--accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 py-4 max-w-screen-xl mx-auto slide-up">
      {/* Header */}
      <div className="mb-5">
        <p className="text-[11px] text-[var(--accent)] uppercase tracking-widest font-medium mb-1">Gallery</p>
        <h1 className="text-[28px] font-bold text-[var(--text-primary)] leading-tight">
          Album Art
        </h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">
          {images.length} covers and artist photos
        </p>
      </div>

      {/* Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 fade-in">
          {images.map((img, i) => (
            <div
              key={`${img.track.id}-${i}`}
              onClick={() => setSelectedImg(img)}
              className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer active:scale-[0.97] transition-transform"
            >
              {img.src ? (
                <img src={img.src} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                  <span className="material-symbols-outlined text-3xl text-zinc-600">music_note</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-[11px] font-medium text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">{img.title}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && images.length === 0 && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-[var(--text-tertiary)] mb-3 block">photo_library</span>
          <p className="text-[var(--text-secondary)] text-[15px]">No images found</p>
          <p className="text-[var(--text-tertiary)] text-[13px] mt-1">Search for music to see album art</p>
        </div>
      )}

      {/* Lightbox */}
      {selectedImg && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 fade-in"
          onClick={() => setSelectedImg(null)}
        >
          <button
            onClick={() => setSelectedImg(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90 z-10"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>

          <div className="max-w-lg w-full scale-in" onClick={e => e.stopPropagation()}>
            <div className="rounded-xl overflow-hidden mb-4 shadow-2xl">
              {selectedImg.src && (
                <img src={selectedImg.src} alt="" className="w-full aspect-square object-cover" />
              )}
            </div>
            <div className="text-center">
              <h3 className="text-[17px] font-semibold text-white mb-1">{selectedImg.title}</h3>
              <p className="text-[13px] text-[var(--text-secondary)] mb-4">{selectedImg.artist}</p>
              <button
                onClick={() => { play(selectedImg.track, images.map(i => i.track)); setSelectedImg(null); }}
                className="px-8 py-2.5 bg-white text-black rounded-full text-[14px] font-semibold active:scale-95 transition-transform inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">play_arrow</span>
                Play
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
