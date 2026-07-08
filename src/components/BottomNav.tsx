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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 frosted-obsidian safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = path === href;
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-300 ${
                active
                  ? 'text-[#D4AF37]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}>
              <span className={`material-symbols-outlined text-[22px] transition-all duration-300 ${active ? 'scale-110' : ''}`}
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                {icon}
              </span>
              <span className={`text-[9px] font-medium uppercase tracking-widest transition-all ${active ? 'opacity-100' : 'opacity-60'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
