import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renameMetaObject } from '@/lib/meta';

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'marketing') return NextResponse.json({ error: 'Admin/Marketing only' }, { status: 403 });

  const { items } = await req.json() as { items: { id: string; name: string }[] };
  if (!items?.length) return NextResponse.json({ error: 'No items' }, { status: 400 });

  const { data: conn } = await supabase.from('ad_connections').select('access_token').eq('platform','meta').order('created_at',{ascending:false}).limit(1).maybeSingle();
  if (!conn) return NextResponse.json({ error: 'Meta not connected' }, { status: 400 });

  const results: any[] = [];
  for (const item of items) {
    try {
      await renameMetaObject(item.id, item.name, conn.access_token);
      results.push({ id: item.id, ok: true });
    } catch (e: any) {
      results.push({ id: item.id, ok: false, error: e.message });
    }
  }
  return NextResponse.json({ results });
}
