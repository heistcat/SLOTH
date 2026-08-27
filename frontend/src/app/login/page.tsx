'use client';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Logistics CRM Login</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input type="text" placeholder="Username" className="border p-2 rounded text-black bg-white" required />
        <input type="password" placeholder="Password" className="border p-2 rounded text-black bg-white" required />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Login</button>
      </form>
    </div>
  );
}
