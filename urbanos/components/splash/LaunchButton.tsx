'use client';

import Link from 'next/link';
import { ReactNode, MouseEventHandler } from 'react';

interface LaunchButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export default function LaunchButton({ href, children, className, onClick }: LaunchButtonProps) {
  const handleClick: MouseEventHandler<HTMLAnchorElement> = (e) => {
    // Reset splash screen flag so it shows on navigation
    sessionStorage.removeItem('openos-splash-shown');
    
    // Call custom onClick if provided
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}

