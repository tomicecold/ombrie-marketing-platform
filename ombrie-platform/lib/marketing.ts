export type DateRange = 'all' | '30d' | '7d' | '3d' | 'yesterday' | 'today' | '24h';
export type Audience = 'all' | 'neukunden' | 'clipper' | 'mitarbeiter';

export const RANGE_LABELS: Record<DateRange, string> = {
  all: 'Gesamt', '30d': '30 T', '7d': '7 T', '3d': '3 T',
  yesterday: 'Gestern', today: 'Heute', '24h': '24 h'
};

export const AUDIENCE_LABELS: Record<Audience, string> = {
  all: 'Alle', neukunden: 'Neukunden', clipper: 'Clipper', mitarbeiter: 'Mitarbeiter'
};

export const AUDIENCE_PILL: Record<Audience, string> = {
  all: 'bg-white border border-slate-200 text-slate-700',
  neukunden: 'bg-blue-50 text-blue-700',
  clipper: 'bg-emerald-50 text-emerald-700',
  mitarbeiter: 'bg-orange-50 text-orange-700'
};

const ymd = (d: Date) => d.toISOString().slice(0,10);

export function rangeToMetaParams(range: DateRange): Record<string,string> {
  switch (range) {
    case 'all': return { date_preset: 'maximum' };
    case '30d': return { date_preset: 'last_30d' };
    case '7d': return { date_preset: 'last_7d' };
    case '3d': return { date_preset: 'last_3d' };
    case 'yesterday': return { date_preset: 'yesterday' };
    case 'today': return { date_preset: 'today' };
    case '24h': {
      const until = new Date();
      const since = new Date(until.getTime() - 24*3600*1000);
      return { time_range: JSON.stringify({ since: ymd(since), until: ymd(until) }) };
    }
  }
}

export function rangeToPrevParams(range: DateRange): Record<string,string> | null {
  const today = new Date();
  const back = (days: number) => {
    const until = new Date(today.getTime() - days * 86400000 - 86400000);
    const since = new Date(until.getTime() - (days - 1) * 86400000);
    return { time_range: JSON.stringify({ since: ymd(since), until: ymd(until) }) };
  };
  switch (range) {
    case '30d': return back(30);
    case '7d': return back(7);
    case '3d': return back(3);
    case 'yesterday': {
      const d = ymd(new Date(today.getTime() - 2*86400000));
      return { time_range: JSON.stringify({ since: d, until: d }) };
    }
    case 'today':
    case '24h': {
      const d = ymd(new Date(today.getTime() - 86400000));
      return { time_range: JSON.stringify({ since: d, until: d }) };
    }
    default: return null;
  }
}

export function detectAudience(name: string): Audience {
  if (!name) return 'neukunden';
  if (/clipper/i.test(name)) return 'clipper';
  if (/hiring|setter|mitarb|recruit/i.test(name)) return 'mitarbeiter';
  return 'neukunden';
}

export function fmtEur(n: number | string | null | undefined): string {
  if (n == null || n === '') return '—';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return '—';
  if (num === 0) return '€0';
  if (num >= 1000) return '€' + Math.round(num).toLocaleString('de-DE');
  return '€' + num.toFixed(num < 10 ? 2 : 0).replace('.', ',');
}

export function fmtNum(n: number | string | null | undefined): string {
  if (n == null || n === '') return '—';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return '—';
  return Math.round(num).toLocaleString('de-DE');
}

export function pctChange(current: number, previous: number): number | null {
  if (!previous || isNaN(previous) || !isFinite(previous)) return null;
  return Math.round(((current - previous) / previous) * 100);
}
