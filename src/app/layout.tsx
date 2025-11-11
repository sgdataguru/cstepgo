import type { Metadata } from 'next';
// Temporarily disable Google Fonts due to network restrictions
// import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

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
    <html lang="en" className="font-sans">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
