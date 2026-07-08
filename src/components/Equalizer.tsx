'use client';

import { usePlayer } from '@/lib/PlayerContext';

const BANDS = [
  { key: 'bass32', label: '32', freq: 'Hz' },
  { key: 'bass64', label: '64', freq: 'Hz' },
  { key: 'bass125', label: '125', freq: 'Hz' },
  { key: 'lowMid250', label: '250', freq: 'Hz' },
  { key: 'mid500', label: '500', freq: 'Hz' },
  { key: 'mid1k', label: '1K', freq: 'Hz' },
  { key: 'mid2k', label: '2K', freq: 'Hz' },
  { key: 'high4k', label: '4K', freq: 'Hz' },
  { key: 'high8k', label: '8K', freq: 'Hz' },
  { key: 'high16k', label: '16K', freq: 'Hz' },
];

const PRESETS = ['Flat', 'Bass Boost', 'Treble Boost', 'Vocal', 'Warm', 'Club', 'Headphone', 'Speaker'];

export default function Equalizer() {
  const { equalizer, setEqualizer } = usePlayer();

  return (
    <div className="glass-panel rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-[family-name:var(--font-serif)] text-white uppercase tracking-wider">Equalizer</h3>
        <div className="flex items-center gap-2">
          {(['normal', 'headphone', 'speaker'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setEqualizer('mode', ['normal', 'headphone', 'speaker'].indexOf(mode))}
              className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider transition-all ${
                equalizer.mode === mode
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                  : 'text-zinc-500 border border-white/5 hover:border-[#D4AF37]/20 hover:text-zinc-300'
              }`}
            >
              {mode === 'normal' ? 'Normal' : mode === 'headphone' ? '🎧 Headphone' : '🔊 Speaker'}
            </button>
          ))}
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(p => (
          <button
            key={p}
            onClick={() => setEqualizer('preset', PRESETS.indexOf(p))}
            className={`px-3 py-1 rounded-full text-[10px] transition-all ${
              equalizer.preset === p
                ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                : 'text-zinc-500 border border-white/5 hover:border-[#D4AF37]/20 hover:text-zinc-300'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* 10-band sliders */}
      <div className="flex items-end gap-2 h-48">
        {BANDS.map((band, i) => {
          const val = (equalizer as any)[band.key] || 0;
          const pct = ((val + 24) / 48) * 100;
          return (
            <div key={band.key} className="flex-1 flex flex-col items-center gap-1 h-full">
              <span className="text-[9px] text-zinc-500 font-mono">{val > 0 ? `+${val}` : val}</span>
              <div className="relative flex-1 w-full bg-white/[0.03] rounded-full overflow-hidden cursor-pointer"
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - r.top;
                  const newVal = Math.round((1 - y / r.height) * 48 - 24);
                  setEqualizer(band.key, Math.max(-24, Math.min(24, newVal)));
                }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-150"
                  style={{
                    height: `${pct}%`,
                    background: val > 0
                      ? 'linear-gradient(to top, #D4AF37, #FFBF00)'
                      : 'linear-gradient(to top, rgba(212,175,55,0.3), rgba(212,175,55,0.1))',
                  }}
                />
                {/* Frequency response curve overlay */}
                {i < BANDS.length - 1 && (() => {
                  const nextVal = (equalizer as any)[BANDS[i + 1].key] || 0;
                  const nextPct = ((nextVal + 24) / 48) * 100;
                  return (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                      <line
                        x1="0%" y1={`${100 - pct}%`}
                        x2="100%" y2={`${100 - nextPct}%`}
                        stroke="rgba(212,175,55,0.2)"
                        strokeWidth="1"
                      />
                    </svg>
                  );
                })()}
              </div>
              <span className="text-[9px] text-zinc-600">{band.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
