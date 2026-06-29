const FB_API = 'https://graph.facebook.com/v22.0';

export async function exchangeForLongLivedToken(shortToken: string, appId: string, appSecret: string) {
  const url = new URL(FB_API + '/oauth/access_token');
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('client_secret', appSecret);
  url.searchParams.set('fb_exchange_token', shortToken);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Meta token exchange failed: ' + (await res.text()));
  return res.json() as Promise<{ access_token: string; token_type: string; expires_in: number }>;
}

export async function fetchAccountInfo(accountId: string, token: string) {
  const url = new URL(FB_API + '/' + accountId);
  url.searchParams.set('fields', 'name,account_id,currency,timezone_name,account_status');
  url.searchParams.set('access_token', token);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Meta account fetch failed: ' + (await res.text()));
  return res.json();
}

export async function fetchInsights(accountId: string, token: string, datePreset = 'last_7d') {
  const url = new URL(FB_API + '/' + accountId + '/insights');
  url.searchParams.set('fields', 'spend,impressions,cpm,cpc,clicks,reach');
  url.searchParams.set('date_preset', datePreset);
  url.searchParams.set('access_token', token);
  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) throw new Error('Meta insights fetch failed: ' + (await res.text()));
  return res.json();
}

export async function fetchInsightsAggregated(accountId: string, token: string, params: Record<string,string>) {
  const url = new URL(FB_API + '/' + accountId + '/insights');
  url.searchParams.set('fields', 'spend,impressions,cpm,cpc,clicks,reach,frequency');
  url.searchParams.set('level', 'account');
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  url.searchParams.set('access_token', token);
  const res = await fetch(url.toString(), { next: { revalidate: 900 } });
  if (!res.ok) throw new Error('Meta agg insights failed: ' + (await res.text()));
  const data = await res.json();
  return data.data?.[0] || null;
}

export async function fetchCampaignInsights(accountId: string, token: string, params: Record<string,string>) {
  const url = new URL(FB_API + '/' + accountId + '/insights');
  url.searchParams.set('fields', 'spend,impressions,cpm,clicks,reach,campaign_id,campaign_name');
  url.searchParams.set('level', 'campaign');
  url.searchParams.set('limit', '50');
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  url.searchParams.set('access_token', token);
  const res = await fetch(url.toString(), { next: { revalidate: 900 } });
  if (!res.ok) throw new Error('Meta campaign insights failed: ' + (await res.text()));
  const data = await res.json();
  return data.data || [];
}

export async function fetchCampaignStatuses(accountId: string, token: string) {
  const url = new URL(FB_API + '/' + accountId + '/campaigns');
  url.searchParams.set('fields', 'id,name,effective_status');
  url.searchParams.set('limit', '500');
  url.searchParams.set('access_token', token);
  const res = await fetch(url.toString(), { next: { revalidate: 900 } });
  if (!res.ok) throw new Error('Meta campaigns list failed: ' + (await res.text()));
  const data = await res.json();
  return data.data || [];
}

// Extended insights with all 20+ KPIs
export const FULL_INSIGHT_FIELDS = [
  'spend','impressions','reach','frequency',
  'cpm','cpc','ctr','cpp',
  'clicks','inline_link_clicks','unique_clicks','unique_link_clicks_ctr','outbound_clicks_ctr',
  'cost_per_inline_link_click','cost_per_unique_click',
  'actions','action_values','cost_per_action_type',
  'video_p25_watched_actions','video_p50_watched_actions','video_p75_watched_actions','video_p100_watched_actions',
  'video_thruplay_watched_actions','video_play_actions','cost_per_thruplay',
  'campaign_id','campaign_name','date_start','date_stop'
].join(',');

export async function fetchAllCampaignsFull(accountId: string, token: string, params: Record<string,string>) {
  const allRows: any[] = [];
  let after: string | null = null;
  let pages = 0;
  while (pages < 10) { // safety cap: max 500 campaigns
    const url = new URL(FB_API + '/' + accountId + '/insights');
    url.searchParams.set('fields', FULL_INSIGHT_FIELDS);
    url.searchParams.set('level', 'campaign');
    url.searchParams.set('limit', '50');
    Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
    if (after) url.searchParams.set('after', after);
    url.searchParams.set('access_token', token);
    const res = await fetch(url.toString(), { next: { revalidate: 900 } });
    if (!res.ok) throw new Error('Meta full insights failed: ' + (await res.text()));
    const data = await res.json();
    allRows.push(...(data.data || []));
    after = data.paging?.cursors?.after || null;
    if (!after || !data.paging?.next) break;
    pages++;
  }
  return allRows;
}

export async function renameMetaObject(objectId: string, newName: string, token: string) {
  const url = new URL(FB_API + '/' + objectId);
  const body = new URLSearchParams();
  body.set('name', newName);
  body.set('access_token', token);
  const res = await fetch(url.toString(), { method: 'POST', body });
  if (!res.ok) throw new Error('Meta rename failed: ' + (await res.text()));
  return res.json();
}

// Helper: extract action value by type (e.g., 'lead', 'purchase', 'link_click')
export function extractAction(actions: any[] | undefined, type: string): number {
  if (!actions) return 0;
  const found = actions.find((a: any) => a.action_type === type);
  return found ? parseFloat(found.value || '0') : 0;
}
