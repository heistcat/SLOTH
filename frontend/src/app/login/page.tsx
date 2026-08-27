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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username === '0000' && password === '0000') {
      login(username, 'Superadmin');
      router.push('/dashboard');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded shadow text-black">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Logistics CRM Login</h1>
      
      {error && <div className="mb-4 text-red-600 text-sm font-semibold">{error}</div>}
      
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
        
        <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 mt-2">Login</button>
      </form>
    </div>
  );
}
