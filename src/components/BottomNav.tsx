'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/search', label: 'Search', icon: 'search' },
  { href: '/gallery', label: 'Gallery', icon: 'photo_library' },
  { href: '/library', label: 'Library', icon: 'library_music' },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 frosted-obsidian safe-area-bottom">
      <div className="flex items-center justify-around px-4 py-2.5">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = path === href;
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-300 ${
                active
                  ? 'text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}>
              <span className={`material-symbols-outlined text-[24px] transition-all duration-300 ${active ? 'scale-110' : ''}`}
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                {icon}
              </span>
              <span className={`text-[10px] font-semibold transition-all ${active ? 'opacity-100' : 'opacity-60'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
