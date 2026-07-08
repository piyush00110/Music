'use client';

import { useEffect, useRef } from 'react';

interface Props {
  isPlaying: boolean;
  barCount?: number;
}

export default function Visualizer({ isPlaying, barCount = 48 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bars = Array.from({ length: barCount }, () => Math.random() * 0.5 + 0.1);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / barCount;
      const gap = 1;

      for (let i = 0; i < barCount; i++) {
        if (isPlaying) {
          bars[i] += (Math.random() - 0.5) * 0.15;
          bars[i] = Math.max(0.05, Math.min(1, bars[i]));
        }

        const h = bars[i] * canvas.height * 0.7;
        const x = i * barWidth + gap / 2;
        const w = barWidth - gap;

        const gradient = ctx.createLinearGradient(x, canvas.height - h, x, canvas.height);
        gradient.addColorStop(0, '#D4AF37');
        gradient.addColorStop(0.5, '#FFBF00');
        gradient.addColorStop(1, '#D4AF37');

        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.4 + bars[i] * 0.6;
        ctx.fillRect(x, canvas.height - h, w, h);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={80}
      className="w-full h-20 opacity-60"
    />
  );
}
