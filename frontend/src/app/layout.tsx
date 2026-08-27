import './globals.css';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900">
        <nav className="bg-blue-800 text-white p-4 flex gap-4">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/accounting" className="hover:underline">Accounting</Link>
          <Link href="/users" className="hover:underline">Users</Link>
          <Link href="/login" className="hover:underline ml-auto">Logout</Link>
        </nav>
        <main className="p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
