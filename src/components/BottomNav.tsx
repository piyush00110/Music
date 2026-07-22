'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePlayer } from '@/lib/PlayerContext';

const NAV_ITEMS = [
  { href: '/', label: 'Listen Now', icon: 'play_circle' },
  { href: '/search', label: 'Browse', icon: 'explore' },
  { href: '/library', label: 'Library', icon: 'folder' },
];

export default function BottomNav() {
  const path = usePathname();
  const { currentTrack } = usePlayer();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="frosted-obsidian">
        <div className="flex items-center justify-around px-2 py-1.5">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = path === href;
            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 ${
                  active
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--text-tertiary)]'
                }`}>
                <span className={`material-symbols-outlined text-[24px] transition-transform duration-200 ${active ? 'scale-105' : ''}`}
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {icon}
                </span>
                <span className={`text-[10px] font-medium ${active ? 'opacity-100' : 'opacity-70'}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
