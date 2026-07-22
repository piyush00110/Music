'use client';

import { useRef, useCallback } from 'react';

interface Props {
  value: number;
  max: number;
  onChange?: (v: number) => void;
  className?: string;
}

export default function ProgressBar({ value, max, onChange, className = '' }: Props) {
  const barRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!barRef.current || !onChange) return;
    const rect = barRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    onChange(pct * max);
  }, [max, onChange]);

  const pct = max > 0 ? (value / max) * 100 : 0;

  return (
    <div
      ref={barRef}
      onClick={handleClick}
      className={`relative h-1.5 rounded-full bg-white/10 cursor-pointer group ${className}`}
    >
      <div
        className="absolute left-0 top-0 h-full rounded-full bg-[var(--accent)] transition-all duration-100"
        style={{ width: `${pct}%` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--accent)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ left: `calc(${pct}% - 6px)` }}
      />
    </div>
  );
}
