import { Analytics } from '@vercel/analytics/next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';
const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });
export const metadata = { title: { default: 'DIAN MOTOR', template: '%s | DIAN MOTOR' }, description: 'Sistem manajemen bengkel, persediaan, servis, dan kasir DIAN MOTOR.', applicationName: 'DIAN MOTOR' };
export const viewport = { themeColor: '#D92323', colorScheme: 'light', width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false };
export default function RootLayout({ children }) { return <html lang="id" className="bg-background"><body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>{children}<Toaster richColors position="top-right"/>{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>; }
