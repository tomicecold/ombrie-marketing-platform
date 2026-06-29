import { createClient } from '@/lib/supabase/server';
import { fetchInsights } from '@/lib/meta';
import { ConnectForm } from './connect-form';

export const revalidate = 300;

export default async function MetaPage() {
  const supabase = createClient();
  const { data: connection } = await supabase
    .from('ad_connections')
    .select('*')
    .eq('platform', 'meta')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!connection) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-2 text-brand-dark">Meta Ads</h1>
        <p className="text-slate-600 mb-8">Verbinde dein Meta Ad Account um Performance zu sehen.</p>
        <ConnectForm />
      </div>
    );
  }

  let insights: any = null;
  let fetchError: string | null = null;
  try {
    const data = await fetchInsights(connection.account_id, connection.access_token);
    insights = data.data?.[0] || null;
  } catch (e: any) {
    fetchError = e.message;
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Meta Ads</h1>
          <p className="text-sm text-slate-500">{connection.account_name} · {connection.account_id}</p>
        </div>
        <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full">Verbunden</span>
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">Fehler: {fetchError}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Ausgaben 7T" value={insights?.spend ? '€' + parseFloat(insights.spend).toFixed(2) : '—'} />
        <Stat label="Impressions" value={insights?.impressions ? Number(insights.impressions).toLocaleString('de-DE') : '—'} />
        <Stat label="CPM" value={insights?.cpm ? '€' + parseFloat(insights.cpm).toFixed(2) : '—'} />
        <Stat label="Klicks" value={insights?.clicks ? Number(insights.clicks).toLocaleString('de-DE') : '—'} />
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <h3 className="font-semibold mb-2">Phase 2 aktiv ✔</h3>
        <p className="text-sm text-slate-600">Meta Ad Account verbunden. Token läuft {new Date(connection.expires_at).toLocaleDateString('de-DE')} ab.</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200">
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-brand-dark">{value}</p>
    </div>
  );
}
