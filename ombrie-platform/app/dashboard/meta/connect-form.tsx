'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ConnectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ app_id: '', app_secret: '', short_token: '', account_id: '' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/meta/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Fehler'); return; }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl p-6 border border-slate-200 max-w-xl space-y-4">
      <Field label="Meta App ID" value={form.app_id} onChange={(v: string)=>setForm({...form,app_id:v})} placeholder="123456789012345" />
      <Field label="Meta App Secret" value={form.app_secret} onChange={(v: string)=>setForm({...form,app_secret:v})} type="password" placeholder="32-char secret" />
      <Field label="Short-Lived Token (aus Graph API Explorer)" value={form.short_token} onChange={(v: string)=>setForm({...form,short_token:v})} type="password" placeholder="EAA..." />
      <Field label="Ad Account ID (mit act_ Prefix)" value={form.account_id} onChange={(v: string)=>setForm({...form,account_id:v})} placeholder="act_123456789" />
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
      <button type="submit" disabled={loading} className="w-full bg-brand text-white py-2.5 rounded-lg font-semibold hover:bg-brand-dark disabled:opacity-50 transition">
        {loading ? 'Verbinde…' : 'Meta verbinden'}
      </button>
      <p className="text-xs text-slate-500 mt-2">Wir tauschen den Token gegen einen 60-Tage Long-Lived Token. App Secret wird nicht gespeichert.</p>
    </form>
  );
}

function Field({ label, value, onChange, type='text', placeholder='' }: { label: string; value: string; onChange: (v: string)=>void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e: any)=>onChange(e.target.value)} required placeholder={placeholder}
        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none font-mono text-sm" />
    </div>
  );
}
