import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-brand-dark mb-3">Ombrie Marketing</h1>
        <p className="text-slate-600 mb-8">Internes Dashboard für Ads, Leads & Performance.</p>
        <Link href="/login" className="inline-block bg-brand text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-dark transition">Anmelden</Link>
      </div>
    </main>
  );
}
