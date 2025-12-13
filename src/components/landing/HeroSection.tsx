'use client';

import { ReactNode } from 'react';

interface HeroSectionProps {
  children: ReactNode;
}

export function HeroSection({ children }: HeroSectionProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* 🎮 Gaming Dark Theme Gradient Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a]">
        {/* Animated neon gradient overlay */}
        <div className="absolute inset-0 opacity-60 bg-gradient-to-br from-[#00f0ff]/20 via-transparent to-[#cc00ff]/20 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }}></div>
        
        {/* Animated grid pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwZjBmZiIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]"></div>
        </div>
        
        {/* Floating neon orbs for gaming atmosphere */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#00f0ff]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-48 h-48 bg-[#cc00ff]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#00ff88]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-[#cc00ff]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Subtle overlay for better text readability */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/20 via-transparent to-black/40" />

      {/* Content */}
      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
}
