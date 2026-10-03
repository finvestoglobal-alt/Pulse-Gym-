import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/ToastContext';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Mukund Singhal Gym — Gym Management Dashboard',
  description: 'Staff-only management system for Mukund Singhal Gym. Strength • Health • Community',
  openGraph: {
    title: 'Mukund Singhal Gym — Gym Dashboard',
    description: 'Staff-only management system for Mukund Singhal Gym',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="antialiased">
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
