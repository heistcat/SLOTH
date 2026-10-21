import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/context/AuthContext';
import { TelemetryProvider } from '@/context/TelemetryContext';
import Navigation from '@/components/Navigation';

export const metadata = {
  title: 'SLOTH — Dispatch Operating System & Logistics CRM',
  description: 'Next-generation high-density dispatch workspace with live ELD telemetry and Telegram integration.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 min-h-screen flex flex-col font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <TelemetryProvider>
              <Navigation />
              <main className="flex-1 p-3 sm:p-4 max-w-[1920px] w-full mx-auto">
                {children}
              </main>
            </TelemetryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
