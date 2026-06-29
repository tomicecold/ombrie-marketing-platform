'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark mb-1">Anmelden</h1>
          <p className="text-sm text-slate-500">Ombrie Marketing Platform</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Passwort</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none" />
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-brand text-white py-2.5 rounded-lg font-semibold hover:bg-brand-dark disabled:opacity-50 transition">{loading ? 'Einen Moment…' : 'Anmelden'}</button>
      </form>
    </main>
  );
}
