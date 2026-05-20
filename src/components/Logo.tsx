'use client';

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  href?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
}

export default function Logo({
  href = '/',
  className = '',
  size = 'md',
  withText = false
}: LogoProps) {
  const sizeMap = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
  };

  const LogoImage = (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.svg"
        alt="indian.rent"
        style={{
          width: sizeMap[size].width,
          height: sizeMap[size].height,
          objectFit: 'contain',
        }}
      />
      {withText && (
        <span className="font-display text-lg md:text-xl text-primary font-black tracking-tighter">
          indian.rent
        </span>
      )}
    </div>
  );

  return (
    <Link href={href} className="inline-flex items-center hover:opacity-80 transition-opacity">
      {LogoImage}
    </Link>
  );
}
