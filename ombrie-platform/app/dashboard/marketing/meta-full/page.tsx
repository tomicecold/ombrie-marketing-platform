import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { fetchAllCampaignsFull, fetchCampaignStatuses, extractAction } from '@/lib/meta';
import { rangeToMetaParams, RANGE_LABELS, type DateRange } from '@/lib/marketing';
import { FullTable } from './full-table';

export const revalidate = 900;

const RANGES: DateRange[] = ['all','30d','7d','3d','yesterday','today','24h'];

export default async function MetaFullDashboard({ searchParams }: { searchParams: { range?: string } }) {
  const range: DateRange = (RANGES.includes(searchParams.range as DateRange) ? searchParams.range : '7d') as DateRange;
  const supabase = createClient();
  const { data: conn } = await supabase.from('ad_connections').select('*').eq('platform','meta').order('created_at',{ascending:false}).limit(1).maybeSingle();

  let rows: any[] = []; let err: string | null = null;
  if (conn) {
    try {
      const params = rangeToMetaParams(range);
      const [campaigns, statuses] = await Promise.all([
        fetchAllCampaignsFull(conn.account_id, conn.access_token, params),
        fetchCampaignStatuses(conn.account_id, conn.access_token)
      ]);
      const statusMap = new Map<string, string>(statuses.map((s: any) => [s.id, s.effective_status]));
      rows = campaigns.map((c: any) => {
        const actions = c.actions || [];
        const actionValues = c.action_values || [];
        const costPerAction = c.cost_per_action_type || [];
        return {
          id: c.campaign_id,
          name: c.campaign_name,
          status: statusMap.get(c.campaign_id) || 'UNKNOWN',
          spend: parseFloat(c.spend || '0'),
          impressions: parseInt(c.impressions || '0'),
          reach: parseInt(c.reach || '0'),
          frequency: parseFloat(c.frequency || '0'),
          cpm: parseFloat(c.cpm || '0'),
          cpc: parseFloat(c.cpc || '0'),
          ctr: parseFloat(c.ctr || '0'),
          cpp: parseFloat(c.cpp || '0'),
          clicks: parseInt(c.clicks || '0'),
          link_clicks: parseInt(c.inline_link_clicks || '0'),
          unique_clicks: parseInt(c.unique_clicks || '0'),
          unique_ctr: parseFloat(c.unique_link_clicks_ctr || '0'),
          outbound_ctr: parseFloat(c.outbound_clicks_ctr || '0'),
          cpc_link: parseFloat(c.cost_per_inline_link_click || '0'),
          cpc_unique: parseFloat(c.cost_per_unique_click || '0'),
          leads: extractAction(actions, 'lead'),
          purchases: extractAction(actions, 'purchase'),
          add_to_cart: extractAction(actions, 'add_to_cart'),
          landing_page_view: extractAction(actions, 'landing_page_view'),
          link_click_actions: extractAction(actions, 'link_click'),
          post_engagement: extractAction(actions, 'post_engagement'),
          page_engagement: extractAction(actions, 'page_engagement'),
          video_views: extractAction(actions, 'video_view'),
          thruplays: extractAction(c.video_thruplay_watched_actions, 'video_view'),
          video_p25: extractAction(c.video_p25_watched_actions, 'video_view'),
          video_p50: extractAction(c.video_p50_watched_actions, 'video_view'),
          video_p75: extractAction(c.video_p75_watched_actions, 'video_view'),
          video_p100: extractAction(c.video_p100_watched_actions, 'video_view'),
          cost_per_thruplay: parseFloat(c.cost_per_thruplay?.[0]?.value || '0'),
          purchase_value: extractAction(actionValues, 'purchase'),
          cost_per_lead: parseFloat(costPerAction.find((x:any)=>x.action_type==='lead')?.value || '0'),
          cost_per_purchase: parseFloat(costPerAction.find((x:any)=>x.action_type==='purchase')?.value || '0')
        };
      });
    } catch (e: any) { err = e.message; }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Meta Full Dashboard</h1>
          <p className="text-sm text-slate-500">{rows.length} Kampagnen · {RANGE_LABELS[range]} · Spiegelt Meta Ads Manager</p>
        </div>
        <Link href="/dashboard/marketing" className="text-sm text-slate-500 hover:text-brand">← Zurück zum Überblick</Link>
      </div>

      <div className="flex flex-wrap gap-1 mb-4 bg-slate-100 p-1.5 rounded-xl inline-flex">
        {RANGES.map(r => (
          <Link key={r} href={'/dashboard/marketing/meta-full?range='+r}
            className={'px-4 py-2 rounded-lg text-sm font-medium transition ' + (range === r ? 'bg-white text-brand-dark shadow-sm' : 'text-slate-600 hover:bg-white/60')}>
            {RANGE_LABELS[r]}
          </Link>
        ))}
      </div>

      {err && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">Meta API Error: {err}</div>}
      {!conn && <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-700">Meta nicht verbunden. <Link href="/dashboard/meta" className="underline">Hier verbinden</Link></div>}

      <FullTable rows={rows} />
    </div>
  );
}
