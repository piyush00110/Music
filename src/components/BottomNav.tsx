'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/search', label: 'Search', icon: 'search' },
  { href: '/library', label: 'Library', icon: 'library' },
  { href: '/player', label: 'Player', icon: 'player' },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl border-t border-white/[0.05] safe-area-bottom">
      <div className="flex items-center justify-around py-3">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 transition-colors ${
                active ? 'text-[#D4AF37]' : 'text-zinc-500'
              }`}
            >
              {icon === 'home' && (
                <svg className="w-5 h-5" fill={active ? '#D4AF37' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              )}
              {icon === 'search' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              )}
              {icon === 'library' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                </svg>
              )}
              {icon === 'player' && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377" />
                </svg>
              )}
              <span className="text-[10px] uppercase tracking-widest">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
