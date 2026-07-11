'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/ThemeContext';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/search', label: 'Search', icon: 'search' },
  { href: '/gallery', label: 'Gallery', icon: 'photo_library' },
  { href: '/library', label: 'Library', icon: 'library_music' },
];

export default function BottomNav() {
  const path = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [spinning, setSpinning] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleToggle = () => {
    setSpinning(true);
    toggleTheme();
    setTimeout(() => setSpinning(false), 600);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 frosted-obsidian safe-area-bottom">
      <div className="flex items-center justify-around px-4 py-2.5">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = path === href;
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-300 magnetic-btn ${
                active
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}>
              <span className={`material-symbols-outlined text-[24px] transition-all duration-300 ${active ? 'scale-110' : ''}`}
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                {icon}
              </span>
              <span className={`text-[10px] font-semibold transition-all ${active ? 'opacity-100' : 'opacity-60'}`}>
                {label}
              </span>
              {active && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#D4AF37]" />
              )}
            </Link>
          );
        })}
        
        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={handleToggle}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-300 magnetic-btn text-[var(--text-tertiary)] hover:text-[#D4AF37]"
            aria-label="Toggle theme"
          >
            <span className={`material-symbols-outlined text-[24px] transition-all duration-300 ${
              spinning ? 'theme-toggle-spin' : ''
            }`}
              style={{ fontVariationSettings: "'FILL' 1" }}>
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
            <span className="text-[10px] font-semibold opacity-60">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}
