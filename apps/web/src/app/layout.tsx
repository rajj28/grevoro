import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'GREVORO — Traceable Waste Flow Network',
    template: '%s | GREVORO',
  },
  description:
    'Real-time waste traceability for informal recycling networks in India. Track every gram, trust every step.',
  keywords: ['waste management', 'recycling', 'blockchain', 'sustainability', 'India', 'ESG'],
  openGraph: {
    title: 'GREVORO — Traceable Waste Flow Network',
    description: 'Real-time waste traceability for informal recycling networks.',
    type: 'website',
    locale: 'en_IN',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#1F3D2B',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-cream antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{});})}`,
          }}
        />
      </body>
    </html>
  );
}
