import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-brand-dark text-white p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-8">Ombrie</h2>
        <nav className="space-y-1 text-sm flex-1">
          <Link href="/dashboard" className="block px-3 py-2 rounded hover:bg-white/10">Dashboard</Link>
          <Link href="/dashboard/meta" className="block px-3 py-2 rounded hover:bg-white/10">Meta Ads</Link>
          <Link href="/dashboard/tiktok" className="block px-3 py-2 rounded hover:bg-white/10 opacity-60">TikTok Ads</Link>
          <Link href="/dashboard/google" className="block px-3 py-2 rounded hover:bg-white/10 opacity-60">Google Ads</Link>
          <Link href="/dashboard/users" className="block px-3 py-2 rounded hover:bg-white/10 opacity-60">Users</Link>
        </nav>
        <div className="text-xs text-white/60 border-t border-white/10 pt-4">
          <p>{user.email}</p>
          <form action="/auth/signout" method="post"><button className="text-white/80 hover:text-white mt-1" type="submit">Abmelden</button></form>
        </div>
      </aside>
      <main className="flex-1 p-10 overflow-auto">{children}</main>
    </div>
  );
}
