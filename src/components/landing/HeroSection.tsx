'use client';

import Image from 'next/image';
import { ReactNode } from 'react';

interface HeroSectionProps {
  children: ReactNode;
}

export function HeroSection({ children }: HeroSectionProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Hero Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-car-highway.jpg"
          alt="Low cost travel across Central Asia"
          fill
          priority
          quality={90}
          className="object-cover object-center"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k="
        />
      </div>

      {/* Gradient Overlay - Brand Colors */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#40E0D0]/30 via-[#40E0D0]/20 to-[#FFD700]/20" />

      {/* Content */}
      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
}
