'use client';
import { useState, useEffect } from 'react';
import { roles } from '@/lib/mockData';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState(roles[0]);

  useEffect(() => {
    fetch('/api/users').then(res => res.json()).then(setUsers);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, role })
    });
    const newUser = await res.json();
    setUsers([...users, newUser]);
    setUsername('');
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
    setUsers(users.filter(u => u.id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      
      <form onSubmit={handleAdd} className="mb-8 flex gap-4 bg-white p-4 rounded shadow">
        <input 
          type="text" 
          placeholder="Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          className="border p-2 rounded flex-1 text-black bg-white" 
          required 
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="border p-2 rounded flex-1 text-black bg-white">
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button type="submit" className="bg-green-600 text-white p-2 rounded px-4">Create User</button>
      </form>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-200 border-b">
              <th className="p-3">ID</th>
              <th className="p-3">Username</th>
              <th className="p-3">Role</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{u.id}</td>
                <td className="p-3">{u.username}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">
                  <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
