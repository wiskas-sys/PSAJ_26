import { Analytics } from '@vercel/analytics/next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';
const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });
export const metadata = { title: { default: 'DIAN MOTOR', template: '%s | DIAN MOTOR' }, description: 'Sistem manajemen bengkel, persediaan, servis, dan kasir DIAN MOTOR.', applicationName: 'DIAN MOTOR' };
export const viewport = { themeColor: '#09090b', colorScheme: 'dark', width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false };
export default function RootLayout({ children }) { return <html lang="id" className="dark:bg-background" suppressHydrationWarning><body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}><ThemeProvider>{children}<Toaster richColors position="top-right"/>{process.env.NODE_ENV === 'production' && <Analytics />}</ThemeProvider></body></html>; }