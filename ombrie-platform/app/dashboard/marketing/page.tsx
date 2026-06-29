import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { fetchInsightsAggregated, fetchCampaignInsights, fetchCampaignStatuses } from '@/lib/meta';
import { rangeToMetaParams, rangeToPrevParams, detectAudience, fmtEur, fmtNum, pctChange, RANGE_LABELS, AUDIENCE_LABELS, AUDIENCE_PILL } from '@/lib/marketing';
import type { DateRange, Audience } from '@/lib/marketing';

export const revalidate = 900;

const RANGES: DateRange[] = ['all','30d','7d','3d','yesterday','today','24h'];
const AUDIENCES: Audience[] = ['all','neukunden','clipper','mitarbeiter'];

export default async function MarketingDashboard({ searchParams }: { searchParams: { range?: string; audience?: string } }) {
  const range: DateRange = (RANGES.includes(searchParams.range as DateRange) ? searchParams.range : '7d') as DateRange;
  const audience: Audience = (AUDIENCES.includes(searchParams.audience as Audience) ? searchParams.audience : 'all') as Audience;

  const supabase = createClient();
  const { data: metaConn } = await supabase.from('ad_connections').select('*').eq('platform','meta').order('created_at',{ascending:false}).limit(1).maybeSingle();

  let metaAgg: any = null; let metaPrev: any = null; let metaCampaigns: any[] = []; let metaStatuses: any[] = []; let metaError: string | null = null;

  if (metaConn) {
    try {
      const params = rangeToMetaParams(range);
      const prevParams = rangeToPrevParams(range);
      const [agg, prev, camps, statuses] = await Promise.all([
        fetchInsightsAggregated(metaConn.account_id, metaConn.access_token, params),
        prevParams ? fetchInsightsAggregated(metaConn.account_id, metaConn.access_token, prevParams) : null,
        fetchCampaignInsights(metaConn.account_id, metaConn.access_token, params),
        fetchCampaignStatuses(metaConn.account_id, metaConn.access_token)
      ]);
      metaAgg = agg; metaPrev = prev;
      const statusMap = new Map(statuses.map((s: any) => [s.id, s.effective_status]));
      metaCampaigns = camps.map((c: any) => ({ ...c, audience: detectAudience(c.campaign_name || ''), status: statusMap.get(c.campaign_id) || 'UNKNOWN' }));
    } catch (e: any) { metaError = e.message; }
  }

  const filteredCampaigns = audience === 'all' ? metaCampaigns : metaCampaigns.filter(c => c.audience === audience);

  const accSpend = parseFloat(metaAgg?.spend || '0');
  const accSpendPrev = parseFloat(metaPrev?.spend || '0');
  const accClicks = parseInt(metaAgg?.clicks || '0');
  const accClicksPrev = parseInt(metaPrev?.clicks || '0');

  const audSpend = filteredCampaigns.reduce((s, c) => s + parseFloat(c.spend || '0'), 0);
  const audClicks = filteredCampaigns.reduce((s, c) => s + parseInt(c.clicks || '0'), 0);

  const showSpend = audience === 'all' ? accSpend : audSpend;
  const showClicks = audience === 'all' ? accClicks : audClicks;
  const showSpendPrev = audience === 'all' ? accSpendPrev : null;
  const showClicksPrev = audience === 'all' ? accClicksPrev : null;
  const cpl = showClicks > 0 ? showSpend / showClicks : 0;

  const now = new Date();
  const dateStr = now.toLocaleDateString('de-DE', { weekday:'short', year:'numeric', month:'2-digit', day:'2-digit' });
  const timeStr = now.toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-wider text-brand-dark uppercase">Ombrie · Marketing Live</h1>
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>SYNC · 15 Min Cache
          </span>
        </div>
        <div className="text-sm text-slate-500">{dateStr} · {timeStr}</div>
      </div>

      <div className="flex flex-wrap gap-1 mb-3 bg-slate-100 p-1.5 rounded-xl inline-flex">
        {RANGES.map(r => (
          <Link key={r} href={'/dashboard/marketing?range='+r+'&audience='+audience}
            className={'px-4 py-2 rounded-lg text-sm font-medium transition ' + (range === r ? 'bg-white text-brand-dark shadow-sm' : 'text-slate-600 hover:bg-white/60')}>
            {RANGE_LABELS[r]}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {AUDIENCES.map(a => (
          <Link key={a} href={'/dashboard/marketing?range='+range+'&audience='+a}
            className={'px-5 py-2 rounded-full text-sm font-medium transition ' + AUDIENCE_PILL[a] + (audience === a ? ' ring-2 ring-offset-1 ring-current' : ' opacity-60 hover:opacity-100')}>
            {AUDIENCE_LABELS[a]}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Kpi label={'SPEND · ' + RANGE_LABELS[range]} value={fmtEur(showSpend)} pct={showSpendPrev != null ? pctChange(showSpend, showSpendPrev) : null} pctSuffix="vs. vorher" pctInvert />
        <Kpi label={'LEADS · ' + RANGE_LABELS[range]} value={fmtNum(showClicks)} pct={showClicksPrev != null ? pctChange(showClicks, showClicksPrev) : null} note="= Klicks (CRM-Track folgt)" />
        <Kpi label={'CPL · ' + RANGE_LABELS[range]} value={fmtEur(cpl)} pct={null} note="= Spend/Klicks" />
        <Kpi label="CLOSES · CAC" value="—" pct={null} note="CRM-Integration nötig" />
        <Kpi label={'ROAS · ' + RANGE_LABELS[range]} value="—" pct={null} note="Ziel ≥ 1,8 ×" />
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-baseline mb-3">
          <h3 className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Kanäle · {RANGE_LABELS[range]}</h3>
          <span className="text-xs text-slate-400">Spend → Klicks → CPM</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Channel color="bg-blue-500" name="Meta Ads" spend={accSpend} clicks={accClicks} cpm={parseFloat(metaAgg?.cpm || '0')} status={metaError ? 'error' : metaConn ? 'ok' : 'not_connected'} />
          <Channel color="bg-slate-900" name="TikTok Ads" spend={0} clicks={0} cpm={0} status="not_connected" />
          <Channel color="bg-blue-400" name="Google Ads" spend={0} clicks={0} cpm={0} status="not_connected" />
          <Channel color="bg-purple-500" name="Empfehlungen" spend={0} clicks={0} cpm={0} status="crm_required" />
        </div>
      </div>

      {metaError && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">Meta API Error: {metaError}</div>}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-baseline p-5 pb-3">
          <h3 className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Top Kampagnen · Meta {audience !== 'all' && '· ' + AUDIENCE_LABELS[audience]}</h3>
          <span className="text-xs text-slate-400">Sortiert nach Spend</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 uppercase tracking-wide border-t border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Kampagne</th>
                <th className="text-left px-5 py-3 font-medium">Kanal</th>
                <th className="text-left px-5 py-3 font-medium">Zielgruppe</th>
                <th className="text-right px-5 py-3 font-medium">Spend</th>
                <th className="text-right px-5 py-3 font-medium">Klicks</th>
                <th className="text-right px-5 py-3 font-medium">CPM</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.sort((a:any,b:any) => parseFloat(b.spend||'0') - parseFloat(a.spend||'0')).slice(0, 15).map((c: any) => (
                <tr key={c.campaign_id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-5 py-3 max-w-xs truncate" title={c.campaign_name}>{c.campaign_name}</td>
                  <td className="px-5 py-3 text-blue-600">Meta</td>
                  <td className="px-5 py-3"><span className={'px-2 py-0.5 rounded text-xs ' + AUDIENCE_PILL[c.audience as Audience]}>{AUDIENCE_LABELS[c.audience as Audience]}</span></td>
                  <td className="px-5 py-3 text-right font-medium">{fmtEur(c.spend)}</td>
                  <td className="px-5 py-3 text-right">{fmtNum(c.clicks)}</td>
                  <td className="px-5 py-3 text-right">{fmtEur(c.cpm)}</td>
                  <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                </tr>
              ))}
              {filteredCampaigns.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400 text-sm">Keine Kampagnen für diesen Filter</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, pct, pctSuffix, pctInvert, note }: any) {
  const isPos = pct != null && (pctInvert ? pct < 0 : pct > 0);
  const isNeg = pct != null && (pctInvert ? pct > 0 : pct < 0);
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200">
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-brand-dark mb-1">{value}</p>
      {pct != null && (
        <p className={'text-xs font-medium ' + (isPos ? 'text-emerald-600' : isNeg ? 'text-red-600' : 'text-slate-500')}>
          {pct > 0 ? '+' : ''}{pct}% {pctSuffix}
        </p>
      )}
      {pct == null && note && <p className="text-xs text-slate-400">{note}</p>}
    </div>
  );
}

function Channel({ color, name, spend, clicks, cpm, status }: any) {
  const sl: any = { ok: '', not_connected: 'Nicht verbunden', crm_required: 'CRM nötig', error: 'API Fehler' };
  const dotErr = status === 'error' ? 'bg-red-500' : color;
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2"><span className={'w-2 h-2 rounded-sm ' + dotErr}></span><span className="text-sm font-medium text-slate-700">{name}</span></div>
        {sl[status] && <span className="text-xs text-slate-400">{sl[status]}</span>}
      </div>
      <p className="text-2xl font-bold text-brand-dark mb-1">{fmtEur(spend)}</p>
      <p className="text-xs text-slate-500">{fmtNum(clicks)} Klicks · CPM {fmtEur(cpm)}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: any = { ACTIVE: { color: 'bg-emerald-500', label: 'Live' }, PAUSED: { color: 'bg-red-500', label: 'Paus.' }, IN_PROCESS: { color: 'bg-amber-500', label: 'Test' }, DELETED: { color: 'bg-slate-400', label: '-' } };
  const s = map[status] || { color: 'bg-slate-400', label: status.toLowerCase() };
  return <span className="inline-flex items-center gap-1.5 text-xs"><span className={'w-1.5 h-1.5 rounded-full ' + s.color}></span>{s.label}</span>;
}
