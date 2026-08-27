'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        throw new Error('Invalid username or password');
      }

      const user = await res.json();
      login(user.username, user.role);

      if (user.role === 'Accounting') {
        router.push('/accounting');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded shadow text-black">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Logistics CRM Login</h1>
      
      {error && <div className="mb-4 text-red-600 text-sm font-semibold text-center">{error}</div>}
      
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input 
          type="text" 
          placeholder="Username" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 rounded text-black bg-white" 
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded text-black bg-white" 
          required 
        />
        
        <button disabled={loading} type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 mt-2 disabled:bg-blue-400">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
