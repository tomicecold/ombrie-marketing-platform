import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { exchangeForLongLivedToken, fetchAccountInfo } from '@/lib/meta';

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const body = await req.json();
  const { app_id, app_secret, short_token, account_id } = body;
  if (!app_id || !app_secret || !short_token || !account_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  try {
    const tokenData = await exchangeForLongLivedToken(short_token, app_id, app_secret);
    const accountInfo = await fetchAccountInfo(account_id, tokenData.access_token);
    const admin = createAdminClient();
    const { error } = await admin.from('ad_connections').upsert({
      platform: 'meta',
      account_id,
      account_name: accountInfo.name,
      access_token: tokenData.access_token,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      connected_by: user.id
    }, { onConflict: 'platform,account_id' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, account: accountInfo });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
