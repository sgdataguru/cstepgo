import type { Metadata } from 'next';
// import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

// Temporarily disabled Google Fonts due to build environment restrictions
// const inter = Inter({
//   subsets: ['latin'],
//   variable: '--font-body',
//   display: 'swap',
// });

// const spaceGrotesk = Space_Grotesk({
//   subsets: ['latin'],
//   variable: '--font-display',
//   display: 'swap',
// });

export const metadata: Metadata = {
  title: 'StepperGO - Group Travel Made Easy',
  description: 'Join shared rides and group trips across Kazakhstan and Kyrgyzstan',
  keywords: ['ride sharing', 'group travel', 'Kazakhstan', 'Kyrgyzstan', 'carpooling'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
