'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/search', label: 'Search', icon: 'search' },
  { href: '/library', label: 'Library', icon: 'library_music' },
  { href: '/player', label: 'Player', icon: 'music_note' },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl border-t border-white/[0.05] safe-area-bottom">
      <div className="flex items-center justify-around py-2.5">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 transition-colors ${
                active ? 'text-primary' : 'text-zinc-500'
              }`}
            >
              <span className={`material-symbols-outlined text-2xl ${active ? '' : ''}`}
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                {icon}
              </span>
              <span className="text-[9px] uppercase tracking-widest">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
