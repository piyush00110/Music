'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const path = usePathname();
  const isHome = path === '/';
  const isSearch = path === '/search';
  const isLibrary = path === '/library';

  const title = isHome ? 'Listen Now' : isSearch ? 'Browse' : isLibrary ? 'Library' : '';

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="glass-panel">
        <div className="flex items-center justify-between px-5 md:px-8 h-12">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-[var(--text-primary)] tracking-tight">
                {title}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/search"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
