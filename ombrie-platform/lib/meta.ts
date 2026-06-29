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
