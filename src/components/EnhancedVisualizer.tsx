'use client';

import { useEffect, useRef } from 'react';

interface Props {
  isPlaying: boolean;
  barCount?: number;
  height?: number;
  color?: string;
  glow?: boolean;
}

export default function EnhancedVisualizer({ isPlaying, barCount = 64, height = 120, color = '#fc3c44', glow = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const barsRef = useRef<number[]>([]);

  if (barsRef.current.length !== barCount) {
    barsRef.current = Array.from({ length: barCount }, () => Math.random() * 0.5 + 0.1);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const bars = barsRef.current;

    const draw = () => {
      ctx.clearRect(0, 0, rect.width, height);

      const barWidth = rect.width / barCount;
      const gap = 1.5;

      for (let i = 0; i < barCount; i++) {
        if (isPlaying) {
          bars[i] += (Math.random() - 0.5) * 0.2;
          bars[i] = Math.max(0.03, Math.min(1, bars[i]));
        } else {
          bars[i] += (0.1 - bars[i]) * 0.05;
        }

        const h = bars[i] * height * 0.75;
        const x = i * barWidth + gap / 2;
        const w = barWidth - gap;

        const gradient = ctx.createLinearGradient(x, height - h, x, height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, '#ff5a5f');
        gradient.addColorStop(1, color);

        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.3 + bars[i] * 0.7;
        ctx.beginPath();
        ctx.roundRect(x, height - h, w, h, [1, 1, 0, 0]);
        ctx.fill();

        if (glow && isPlaying && i % 4 === 0) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.15;
          ctx.fillRect(x, height - h, w, h);
          ctx.shadowBlur = 0;
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, barCount, height, color, glow]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height }}
      className="rounded-lg"
    />
  );
}
