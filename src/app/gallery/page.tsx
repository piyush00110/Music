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
  const [filter, setFilter] = useState<'all' | 'square' | 'wide'>('all');
  const [selectedImg, setSelectedImg] = useState<GalleryImage | null>(null);
  const { play } = usePlayer();

  useEffect(() => {
    async function load() {
      try {
        const allImages: GalleryImage[] = [];

        // Get trending tracks
        const trending = await getTrending();
        for (const t of trending) {
          const src = t.album.cover_medium || (t.youtubeId ? `https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg` : null);
          if (src) {
            allImages.push({ track: t, src, title: t.title, artist: t.artist.name });
          }
        }

        // Search various categories
        const searches = await Promise.all(
          GALLERY_QUERIES.slice(0, 6).map(q =>
            searchMusic(q).catch(() => [])
          )
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

  const groupedImages = useMemo(() => {
    const groups: Record<string, GalleryImage[]> = {};
    for (const img of images) {
      const key = img.artist || 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(img);
    }
    return groups;
  }, [images]);

  const artists = useMemo(() => Object.keys(groupedImages).slice(0, 12), [groupedImages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] pt-20">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border border-[#D4AF37]/10" />
            <div className="absolute inset-1 rounded-full border border-transparent border-t-[#D4AF37] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#D4AF37]/40 text-xl">photo_library</span>
            </div>
          </div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.25em]">Loading Gallery</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 py-5 max-w-screen-xl mx-auto slide-up">
      {/* Header */}
      <section className="relative mb-8 md:mb-10 rounded-2xl md:rounded-3xl overflow-hidden min-h-[160px] md:min-h-[220px] flex items-end glass-card">
        <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-[#D4AF37]/[0.06] blur-[80px] rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="relative z-10 p-6 md:p-8 w-full">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]/80 font-medium">Gallery</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-[family-name:var(--font-serif)] text-white leading-[0.95] mb-2">
            All <span className="gold-gradient-text">Images</span>
          </h1>
          <p className="text-zinc-400 text-sm md:text-base">
            {images.length} album covers and artist photos
          </p>
        </div>
      </section>

      {/* Filter chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 hide-scrollbar">
        {[
          { id: 'all', label: 'All', icon: 'grid_view' },
          { id: 'square', label: 'Square', icon: 'crop_square' },
          { id: 'wide', label: 'Artists', icon: 'person' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as typeof filter)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 active:scale-95 ${
              filter === f.id
                ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{f.icon}</span>
            {f.label}
          </button>
        ))}
      </div>

      {/* Artists horizontal scroll */}
      {filter === 'wide' && artists.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg md:text-xl font-[family-name:var(--font-serif)] text-white mb-4">Artists</h2>
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 hide-scrollbar">
            {artists.map(artist => {
              const artistImages = groupedImages[artist];
              const mainImg = artistImages[0];
              return (
                <button
                  key={artist}
                  onClick={() => artistImages[0] && play(artistImages[0].track, artistImages.map(i => i.track))}
                  className="flex-shrink-0 w-32 md:w-40 group"
                >
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-3 border-2 border-white/[0.06] group-hover:border-[#D4AF37]/40 transition-all duration-300 group-active:scale-95 relative">
                    {mainImg?.src ? (
                      <img src={mainImg.src} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-800/50">
                        <span className="material-symbols-outlined text-3xl text-zinc-600">person</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                      <span className="material-symbols-outlined text-white text-xl">play_arrow</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-white truncate text-center">{artist}</p>
                  <p className="text-[11px] text-zinc-500 text-center">{artistImages.length} tracks</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Grid view */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-[family-name:var(--font-serif)] text-white">
            {filter === 'wide' ? 'All Covers' : 'Album Art'}
          </h2>
          <span className="text-[10px] text-zinc-600">{images.length} images</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3 fade-in">
          {images.map((img, i) => (
            <div
              key={`${img.track.id}-${i}`}
              onClick={() => setSelectedImg(img)}
              className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-white/[0.04] hover:border-[#D4AF37]/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] album-hover"
            >
              {img.src ? (
                <img src={img.src} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800/50">
                  <span className="material-symbols-outlined text-3xl text-zinc-600">music_note</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <p className="text-[11px] md:text-xs font-medium text-white truncate">{img.title}</p>
                <p className="text-[10px] text-zinc-400 truncate">{img.artist}</p>
              </div>
              {/* Play overlay */}
              <div className="play-overlay absolute inset-0 flex items-center justify-center">
                <div
                  onClick={(e) => { e.stopPropagation(); play(img.track, images.map(i => i.track)); }}
                  className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#D4AF37]/40 active:scale-90 transition-all"
                >
                  <span className="material-symbols-outlined text-black text-xl">play_arrow</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Empty state */}
      {!loading && images.length === 0 && (
        <div className="text-center py-20 glass-card rounded-2xl max-w-lg mx-auto">
          <span className="material-symbols-outlined text-5xl text-zinc-700 mb-4 block">photo_library</span>
          <p className="text-zinc-300 mb-2 text-lg font-[family-name:var(--font-serif)]">No images found</p>
          <p className="text-sm text-zinc-500">Search for music to populate the gallery</p>
        </div>
      )}

      {/* Lightbox */}
      {selectedImg && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 fade-in"
          onClick={() => setSelectedImg(null)}
        >
          <button
            onClick={() => setSelectedImg(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90 z-10"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>

          <div className="max-w-lg w-full scale-in" onClick={e => e.stopPropagation()}>
            <div className="rounded-2xl overflow-hidden mb-4 shadow-2xl border border-white/[0.06]">
              {selectedImg.src && (
                <img src={selectedImg.src} alt="" className="w-full aspect-square object-cover" />
              )}
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-1">{selectedImg.title}</h3>
              <p className="text-sm text-zinc-400 mb-4">{selectedImg.artist}</p>
              <button
                onClick={() => { play(selectedImg.track, images.map(i => i.track)); setSelectedImg(null); }}
                className="px-8 py-3 bg-gradient-to-r from-[#D4AF37] to-[#FFBF00] text-black rounded-full text-sm font-semibold hover:shadow-xl hover:shadow-[#D4AF37]/30 transition-all duration-300 inline-flex items-center gap-2 gold-glow-btn active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">play_arrow</span>
                Play Track
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
