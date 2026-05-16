import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic, Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ReviewPilot — ردود ذكية على تقييمات Google',
  description:
    'ReviewPilot يحلّل تقييمات عملائك ويصيغ ردوداً جاهزة بنغمة مطعمك السعودية، خلال ثوانٍ بدلاً من ساعات.',
};

// Arabic is the primary locale; the /en route flips dir on a wrapper div.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${arabic.variable} ${inter.variable}`}>
      <body>
        {children}
        <Toaster
          richColors
          position="top-center"
          dir="rtl"
          toastOptions={{
            style: { fontFamily: 'var(--font-arabic), system-ui, sans-serif' },
          }}
        />
      </body>
    </html>
  );
}
