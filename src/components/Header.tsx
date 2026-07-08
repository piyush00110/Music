'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const path = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/[0.05]">
      <div className="flex items-center justify-between px-6 md:px-16 h-18">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFBF00] flex items-center justify-center shadow-lg shadow-[#D4AF37]/30 group-hover:shadow-[#D4AF37]/50 transition-all">
            <span className="text-black text-xs font-bold">A</span>
          </div>
          <span className="text-lg font-[family-name:var(--font-serif)] text-white tracking-wide hidden sm:block">
            AURELIA
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className={`text-xs tracking-widest uppercase transition-colors ${path === '/' ? 'text-[#D4AF37]' : 'text-zinc-400 hover:text-white'}`}>Home</Link>
          <Link href="/search" className={`text-xs tracking-widest uppercase transition-colors ${path === '/search' ? 'text-[#D4AF37]' : 'text-zinc-400 hover:text-white'}`}>Search</Link>
          <Link href="/player" className={`text-xs tracking-widest uppercase transition-colors ${path === '/player' ? 'text-[#D4AF37]' : 'text-zinc-400 hover:text-white'}`}>Player</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/search" className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/20 transition-all md:hidden">
            <svg className="w-4 h-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37]/40 to-[#FFBF00]/20 flex items-center justify-center overflow-hidden border border-[#D4AF37]/30">
            <svg className="w-4 h-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}
