'use client';

import { OSProvider } from '@/lib/os-context';
import Desktop from '@/components/os/Desktop';
import OSLoader from '@/components/splash/OSLoader';
import { Suspense } from 'react';

export default function OSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OSProvider>
      <Suspense fallback={null}>
        <OSLoader>
          <div className="relative w-full h-screen overflow-hidden">
            <Desktop />
            {children}
          </div>
        </OSLoader>
      </Suspense>
    </OSProvider>
  );
}

