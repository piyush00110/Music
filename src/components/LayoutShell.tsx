'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import NowPlayingBar from '@/components/NowPlayingBar';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isPlayer = path === '/player';

  return (
    <>
      {!isPlayer && <Header />}
      <main className={`flex-1 ${isPlayer ? '' : 'pt-16 pb-40 md:pb-24'}`}>
        {children}
      </main>
      {!isPlayer && (
        <>
          <NowPlayingBar />
          <BottomNav />
        </>
      )}
    </>
  );
}
