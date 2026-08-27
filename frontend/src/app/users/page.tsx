'use client';
import { useState, useEffect } from 'react';
import { roles } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Determine allowed roles to create
  let allowedRolesToCreate: string[] = [];
  if (user?.role === 'Superadmin' || user?.role === 'Admin') {
    allowedRolesToCreate = roles;
  } else if (user?.role === 'Manager') {
    allowedRolesToCreate = ['Supervisor'];
  } else if (user?.role === 'Supervisor') {
    allowedRolesToCreate = ['Dispatcher'];
  }

  const [role, setRole] = useState(allowedRolesToCreate[0] || '');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    // Restrict access
    if (!['Superadmin', 'Admin', 'Manager', 'Supervisor'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    fetch('/api/users').then(res => res.json()).then(setUsers);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });
    const newUser = await res.json();
    setUsers([...users, newUser]);
    setUsername('');
    setPassword('');
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
    setUsers(users.filter(u => u.id !== id));
  };

  if (!user || !['Superadmin', 'Admin', 'Manager', 'Supervisor'].includes(user.role)) {
    return null;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">User & Role Management</h1>
      
      {allowedRolesToCreate.length > 0 ? (
        <form onSubmit={handleAdd} className="mb-8 flex gap-4 bg-white p-4 rounded shadow">
          <input 
            type="text" 
            placeholder="New Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            className="border p-2 rounded flex-1 text-black bg-white" 
            required 
          />
          <input 
            type="text" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="border p-2 rounded flex-1 text-black bg-white" 
            required 
          />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="border p-2 rounded flex-1 text-black bg-white">
            {allowedRolesToCreate.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button type="submit" className="bg-green-600 text-white p-2 rounded px-4 hover:bg-green-700">Create User</button>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-yellow-100 text-yellow-800 rounded">
          Your role ({user.role}) does not have permission to create new users.
        </div>
      )}

      <div className="bg-white rounded shadow overflow-x-auto text-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-200 border-b">
              <th className="p-3">ID</th>
              <th className="p-3">Username</th>
              <th className="p-3">Password</th>
              <th className="p-3">Role</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b hover:bg-blue-100 cursor-pointer transition-colors duration-150 text-black">
                <td className="p-3">{u.id}</td>
                <td className="p-3 font-semibold">{u.username}</td>
                <td className="p-3 font-mono text-gray-600">{u.password || '******'}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">
                  {(user.role === 'Superadmin' || (user.role === 'Admin' && u.role !== 'Superadmin' && u.role !== 'Admin')) ? (
                    <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:underline">Delete</button>
                  ) : (
                    <span className="text-gray-400">No access</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
