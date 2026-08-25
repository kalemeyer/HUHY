import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://huhyproject.org'),
  title: 'HUHY — Airman Builder Community',
  description: 'An independent, unofficial community where Airmen raise public problems, find useful tools, and build maintainable solutions together.',
  openGraph: {
    title: 'HUHY — Airman Builder Community',
    description: 'Raise a problem. Find a tool. Help build what is missing.',
    images: [{ url: '/og.png', width: 1536, height: 804, alt: 'HUHY independent and unofficial Airman builder community' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HUHY — Airman Builder Community',
    description: 'Raise a problem. Find a tool. Help build what is missing.',
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0b1f35',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
