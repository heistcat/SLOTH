'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navigation() {
  const { user, logout } = useAuth();
  
  if (!user) return null; // Don't show nav on login page if not logged in

  const canSeeUsers = ['Superadmin', 'Admin', 'Manager', 'Supervisor'].includes(user.role);
  const canSeeAccounting = ['Superadmin', 'Admin', 'Accounting'].includes(user.role);
  const canSeeDashboard = user.role !== 'Accounting'; // Accounting uses their own screen

  return (
    <nav className="bg-blue-800 text-white p-4 flex gap-4 items-center">
      <div className="font-bold mr-4">Logistics CRM</div>
      {canSeeDashboard && <Link href="/dashboard" className="hover:underline">Dashboard</Link>}
      {canSeeAccounting && <Link href="/accounting" className="hover:underline">Accounting</Link>}
      {canSeeUsers && <Link href="/users" className="hover:underline">Users</Link>}
      
      <div className="ml-auto flex items-center gap-4">
        <span className="text-sm bg-blue-700 px-2 py-1 rounded">
          {user.username} ({user.role})
        </span>
        <Link href="/login" onClick={logout} className="hover:underline">Logout</Link>
      </div>
    </nav>
  );
}
