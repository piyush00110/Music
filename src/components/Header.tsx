'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const path = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 frosted-obsidian">
      <div className="flex items-center justify-between px-5 md:px-8 h-16">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#FFBF00] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 group-hover:shadow-[#D4AF37]/40 transition-all duration-300 group-hover:scale-105">
            <span className="material-symbols-outlined text-black text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>graphic_eq</span>
          </div>
          <span className="text-base font-[family-name:var(--font-serif)] text-[var(--text-primary)] tracking-wide hidden sm:block">
            AURELIA
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: '/', label: 'Home' },
            { href: '/search', label: 'Explore' },
            { href: '/player', label: 'Player' },
          ].map(item => {
            const active = path === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`relative px-4 py-2 rounded-full text-xs font-medium tracking-wider uppercase transition-all duration-300 ${
                  active
                    ? 'text-[#D4AF37] bg-[#D4AF37]/10'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
                }`}>
                {item.label}
                {active && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#D4AF37]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/search"
            className="md:hidden w-9 h-9 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] flex items-center justify-center transition-all active:scale-90 border border-[var(--border-subtle)]">
            <span className="material-symbols-outlined text-[20px] text-[#D4AF37]">search</span>
          </Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#FFBF00]/10 flex items-center justify-center border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-[16px] text-[#D4AF37]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          </div>
        </div>
      </div>
    </header>
  );
}
