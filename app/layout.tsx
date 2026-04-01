import type { Metadata, Viewport } from 'next';
import { Inter, Lexend, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegistration } from './sw-register';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body'
});

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-headline'
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-label'
});

export const metadata: Metadata = {
  title: 'PumpMe Dashboard - Today',
  description: 'Athletic performance dashboard for daily training readiness.',
  applicationName: 'PumpMe',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
    shortcut: '/icons/icon-192.png'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PumpMe'
  }
};

export const viewport: Viewport = {
  themeColor: '#0c0e11'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${lexend.variable} ${spaceGrotesk.variable} bg-background text-on-surface antialiased`}
      >
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
