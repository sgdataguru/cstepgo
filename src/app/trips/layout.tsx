import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Trips - StepperGO | Group Travel & Ride Sharing',
  description: 'Discover affordable group trips across Kazakhstan and Kyrgyzstan. Browse shared rides, join fellow travelers, and book your adventure without registration.',
  keywords: 'group travel, ride sharing, Kazakhstan trips, Kyrgyzstan travel, shared transport, affordable travel',
  openGraph: {
    title: 'Browse Trips - StepperGO',
    description: 'Discover affordable group trips across Kazakhstan and Kyrgyzstan',
    type: 'website',
    url: 'https://steppergo.com/trips',
    images: [
      {
        url: '/og-trips.jpg',
        width: 1200,
        height: 630,
        alt: 'StepperGO - Browse Group Trips',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Trips - StepperGO',
    description: 'Discover affordable group trips across Kazakhstan and Kyrgyzstan',
    images: ['/og-trips.jpg'],
  },
  alternates: {
    canonical: 'https://steppergo.com/trips',
  },
};

export default function TripsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
