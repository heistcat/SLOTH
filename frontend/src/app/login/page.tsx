'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { roles } from '@/lib/mockData';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState(roles[0]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(username, role);
    if (role === 'Accounting') {
      router.push('/accounting');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded shadow text-black">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Logistics CRM Login</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input 
          type="text" 
          placeholder="Username" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 rounded text-black bg-white" 
          required 
        />
        <select 
          value={role} 
          onChange={(e) => setRole(e.target.value)} 
          className="border p-2 rounded text-black bg-white"
        >
          {roles.map(r => <option key={r} value={r}>Simulate Login As: {r}</option>)}
        </select>
        <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 mt-2">Login</button>
      </form>
    </div>
  );
}
