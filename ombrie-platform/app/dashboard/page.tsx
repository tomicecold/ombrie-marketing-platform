import { createClient } from '@/lib/supabase/server';

export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 text-brand-dark">Willkommen, {profile?.full_name || user?.email}</h1>
      <p className="text-slate-600 mb-8">Rolle: <span className="font-semibold">{profile?.role || 'viewer'}</span></p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Meta Ad-Spend (heute)" value="—" />
        <Stat label="TikTok Ad-Spend (heute)" value="—" />
        <Stat label="Google Ad-Spend (heute)" value="—" />
      </div>
      <div className="mt-12 bg-white rounded-2xl p-6 border border-slate-200">
        <h3 className="font-semibold mb-2">Phase 1: Foundation aktiv ✔</h3>
        <p className="text-sm text-slate-600">Login + Rollen-System läuft.</p>
      </div>
    </div>
  );
}

function Stat({label,value}:{label:string,value:string}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200">
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-brand-dark">{value}</p>
    </div>
  );
}
