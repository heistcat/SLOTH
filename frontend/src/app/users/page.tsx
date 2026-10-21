'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, Trash2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const availableRoles = [
  'ADMIN',
  'DISPATCHER',
  'SAFETY/TELEMATICS',
  'Superadmin',
  'Admin',
  'Manager',
  'Supervisor',
  'Accounting',
  'Maintenance'
];

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'Superadmin' || user?.role === 'Admin';
  const isManager = user?.role === 'Manager';
  const isSupervisor = user?.role === 'Supervisor';

  let allowedRolesToCreate: string[] = [];
  if (isAdmin) {
    allowedRolesToCreate = availableRoles;
  } else if (isManager) {
    allowedRolesToCreate = ['Supervisor', 'DISPATCHER'];
  } else if (isSupervisor) {
    allowedRolesToCreate = ['DISPATCHER'];
  }

  const [role, setRole] = useState(allowedRolesToCreate[0] || 'DISPATCHER');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!isAdmin && !isManager && !isSupervisor) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, isManager, isSupervisor, router]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(setUsers)
      .catch(() => {
        // Fallback default mock
        setUsers([
          { id: '1', username: 'admin', role: 'ADMIN', password: 'password123' },
          { id: '2', username: 'dispatcher_marcus', role: 'DISPATCHER', password: 'password123' },
          { id: '3', username: 'safety_lead', role: 'SAFETY/TELEMATICS', password: 'password123' },
        ]);
      });
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });
      const newUser = await res.json();
      setUsers([...users, newUser]);
    } catch {
      const fallbackUser = { id: Date.now().toString(), username, password, role };
      setUsers([...users, fallbackUser]);
    }

    setUsername('');
    setPassword('');
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
    setUsers(users.filter(u => u.id !== id));
  };

  if (!user || (!isAdmin && !isManager && !isSupervisor)) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Users className="w-5 h-5 text-purple-500" />
            <span>Team & Role-Based Access Control (RBAC)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create dispatchers, safety inspectors, and configure access permissions.
          </p>
        </div>
      </div>
      
      {/* Add User Form */}
      {allowedRolesToCreate.length > 0 && (
        <form onSubmit={handleAdd} className="bg-white dark:bg-slate-900/60 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5 text-blue-500" />
            <span>Create New Fleet User</span>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <input 
              type="text" 
              placeholder="Username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="px-3 py-1.5 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              required 
            />
            <input 
              type="text" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="px-3 py-1.5 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500" 
              required 
            />
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              className="px-3 py-1.5 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {allowedRolesToCreate.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button 
              type="submit" 
              className="px-4 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors shrink-0"
            >
              Add User
            </button>
          </div>
        </form>
      )}

      {/* Users Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400">
              <th className="p-3">ID</th>
              <th className="p-3">Username</th>
              <th className="p-3">Password</th>
              <th className="p-3">Role</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {users.map(u => {
              const isSuper = u.role === 'Superadmin' || u.role === 'ADMIN';
              const canDelete = isAdmin && (!isSuper || user.role === 'Superadmin');
              return (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-slate-800 dark:text-slate-200">
                  <td className="p-3 font-mono text-slate-400">{u.id}</td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{u.username}</td>
                  <td className="p-3 font-mono text-slate-500">{u.password || '••••••'}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    {canDelete ? (
                      <button 
                        onClick={() => handleDelete(u.id)} 
                        className="text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    ) : (
                      <span className="text-slate-400 text-xs">Protected</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
