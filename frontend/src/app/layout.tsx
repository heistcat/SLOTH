import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navigation from '@/components/Navigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-100 text-gray-900 min-h-screen flex flex-col">
        <AuthProvider>
          <Navigation />
          <main className="p-4 flex-1">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
