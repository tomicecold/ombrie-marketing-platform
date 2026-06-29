'use client';
import { useState, useEffect, useMemo } from 'react';

type ColDef = { key: string; label: string; group: string; fmt?: (v: any) => string; align?: 'left'|'right' };

const fmtEur = (v: any) => { const n = parseFloat(v||'0'); if (!n) return '—'; return '€' + (n >= 100 ? Math.round(n).toLocaleString('de-DE') : n.toFixed(2).replace('.',',')); };
const fmtNum = (v: any) => { const n = parseFloat(v||'0'); if (!n) return '—'; return Math.round(n).toLocaleString('de-DE'); };
const fmtPct = (v: any) => { const n = parseFloat(v||'0'); if (!n) return '—'; return n.toFixed(2).replace('.',',') + '%'; };
const fmtDec = (v: any) => { const n = parseFloat(v||'0'); if (!n) return '—'; return n.toFixed(2).replace('.',','); };

const ALL_COLUMNS: ColDef[] = [
  { key: 'name', label: 'Kampagne', group: 'Info', align: 'left' },
  { key: 'status', label: 'Status', group: 'Info', align: 'left' },
  { key: 'spend', label: 'Spend', group: 'Performance', fmt: fmtEur, align: 'right' },
  { key: 'impressions', label: 'Impressions', group: 'Performance', fmt: fmtNum, align: 'right' },
  { key: 'reach', label: 'Reach', group: 'Performance', fmt: fmtNum, align: 'right' },
  { key: 'frequency', label: 'Frequency', group: 'Performance', fmt: fmtDec, align: 'right' },
  { key: 'cpm', label: 'CPM', group: 'Performance', fmt: fmtEur, align: 'right' },
  { key: 'cpc', label: 'CPC', group: 'Performance', fmt: fmtEur, align: 'right' },
  { key: 'ctr', label: 'CTR', group: 'Performance', fmt: fmtPct, align: 'right' },
  { key: 'cpp', label: 'CPP', group: 'Performance', fmt: fmtEur, align: 'right' },
  { key: 'clicks', label: 'Klicks (all)', group: 'Clicks', fmt: fmtNum, align: 'right' },
  { key: 'link_clicks', label: 'Link-Klicks', group: 'Clicks', fmt: fmtNum, align: 'right' },
  { key: 'unique_clicks', label: 'Unique Klicks', group: 'Clicks', fmt: fmtNum, align: 'right' },
  { key: 'unique_ctr', label: 'Unique CTR', group: 'Clicks', fmt: fmtPct, align: 'right' },
  { key: 'cpc_link', label: 'CPC (Link)', group: 'Clicks', fmt: fmtEur, align: 'right' },
  { key: 'cpc_unique', label: 'CPC (Unique)', group: 'Clicks', fmt: fmtEur, align: 'right' },
  { key: 'leads', label: 'Leads', group: 'Conversions', fmt: fmtNum, align: 'right' },
  { key: 'cost_per_lead', label: 'CPL', group: 'Conversions', fmt: fmtEur, align: 'right' },
  { key: 'purchases', label: 'Käufe', group: 'Conversions', fmt: fmtNum, align: 'right' },
  { key: 'cost_per_purchase', label: 'CPP (Kauf)', group: 'Conversions', fmt: fmtEur, align: 'right' },
  { key: 'purchase_value', label: 'Kauf-Wert', group: 'Conversions', fmt: fmtEur, align: 'right' },
  { key: 'add_to_cart', label: 'Add-to-Cart', group: 'Conversions', fmt: fmtNum, align: 'right' },
  { key: 'landing_page_view', label: 'LP Views', group: 'Conversions', fmt: fmtNum, align: 'right' },
  { key: 'page_engagement', label: 'Page Eng.', group: 'Engagement', fmt: fmtNum, align: 'right' },
  { key: 'post_engagement', label: 'Post Eng.', group: 'Engagement', fmt: fmtNum, align: 'right' },
  { key: 'video_views', label: 'Video Views', group: 'Video', fmt: fmtNum, align: 'right' },
  { key: 'thruplays', label: 'ThruPlays', group: 'Video', fmt: fmtNum, align: 'right' },
  { key: 'cost_per_thruplay', label: 'CP ThruPlay', group: 'Video', fmt: fmtEur, align: 'right' },
  { key: 'video_p25', label: 'Video 25%', group: 'Video', fmt: fmtNum, align: 'right' },
  { key: 'video_p50', label: 'Video 50%', group: 'Video', fmt: fmtNum, align: 'right' },
  { key: 'video_p75', label: 'Video 75%', group: 'Video', fmt: fmtNum, align: 'right' },
  { key: 'video_p100', label: 'Video 100%', group: 'Video', fmt: fmtNum, align: 'right' }
];

const DEFAULT_VISIBLE = ['name','status','spend','impressions','cpm','ctr','link_clicks','cpc_link','leads','cost_per_lead'];

type View = { name: string; columns: string[] };
const PRESET_VIEWS: View[] = [
  { name: 'Performance', columns: ['name','status','spend','impressions','reach','frequency','cpm','cpc','ctr','clicks'] },
  { name: 'Conversions', columns: ['name','status','spend','leads','cost_per_lead','purchases','cost_per_purchase','purchase_value','add_to_cart'] },
  { name: 'Video', columns: ['name','status','spend','video_views','thruplays','cost_per_thruplay','video_p25','video_p50','video_p75','video_p100'] },
  { name: 'Engagement', columns: ['name','status','spend','page_engagement','post_engagement','reach','frequency'] }
];

export function FullTable({ rows }: { rows: any[] }) {
  const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_VISIBLE);
  const [savedViews, setSavedViews] = useState<View[]>([]);
  const [showCols, setShowCols] = useState(false);
  const [showViews, setShowViews] = useState(false);
  const [sortKey, setSortKey] = useState<string>('spend');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showRename, setShowRename] = useState(false);
  const [renameMode, setRenameMode] = useState<'prefix'|'suffix'|'replace'|'set'>('prefix');
  const [renameValue, setRenameValue] = useState('');
  const [renameFrom, setRenameFrom] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [editing, setEditing] = useState<string|null>(null);
  const [editValue, setEditValue] = useState('');
  const [dragCol, setDragCol] = useState<string|null>(null);

  useEffect(() => {
    const vis = localStorage.getItem('mf_visible_cols');
    if (vis) try { setVisibleCols(JSON.parse(vis)); } catch {}
    const v = localStorage.getItem('mf_saved_views');
    if (v) try { setSavedViews(JSON.parse(v)); } catch {}
  }, []);

  useEffect(() => { localStorage.setItem('mf_visible_cols', JSON.stringify(visibleCols)); }, [visibleCols]);
  useEffect(() => { localStorage.setItem('mf_saved_views', JSON.stringify(savedViews)); }, [savedViews]);

  const visibleColDefs = useMemo(() => visibleCols.map(k => ALL_COLUMNS.find(c => c.key === k)).filter(Boolean) as ColDef[], [visibleCols]);

  const sortedRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return sorted;
  }, [rows, sortKey, sortDir]);

  function toggleCol(key: string) {
    setVisibleCols(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }
  function applyView(v: View) { setVisibleCols(v.columns); setShowViews(false); }
  function saveCurrentView() {
    const n = prompt('View-Name?'); if (!n) return;
    setSavedViews(prev => [...prev.filter(v => v.name !== n), { name: n, columns: visibleCols }]);
  }
  function delView(name: string) { setSavedViews(prev => prev.filter(v => v.name !== name)); }

  function onSort(key: string) { if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDir('desc'); } }

  function onDragStart(key: string) { setDragCol(key); }
  function onDragOver(e: React.DragEvent, key: string) { e.preventDefault(); }
  function onDrop(key: string) {
    if (!dragCol || dragCol === key) return;
    setVisibleCols(prev => {
      const a = [...prev]; const fi = a.indexOf(dragCol); const ti = a.indexOf(key);
      if (fi < 0 || ti < 0) return prev;
      a.splice(fi, 1); a.splice(ti, 0, dragCol);
      return a;
    });
    setDragCol(null);
  }

  function toggleSelect(id: string) { setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }
  function selectAll() { setSelected(new Set(sortedRows.map(r => r.id))); }
  function clearSel() { setSelected(new Set()); }

  async function startInlineEdit(row: any) { setEditing(row.id); setEditValue(row.name); }
  async function saveInlineEdit() {
    if (!editing) return;
    const res = await fetch('/api/meta/rename', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ id: editing, name: editValue }] }) });
    if (res.ok) { const row = rows.find(r => r.id === editing); if (row) row.name = editValue; setEditing(null); }
    else alert('Rename fehlgeschlagen: ' + (await res.text()));
  }

  async function bulkRename() {
    setRenaming(true);
    const items = Array.from(selected).map(id => {
      const r = rows.find(row => row.id === id); if (!r) return null;
      let newName = r.name;
      if (renameMode === 'prefix') newName = renameValue + r.name;
      else if (renameMode === 'suffix') newName = r.name + renameValue;
      else if (renameMode === 'replace') newName = r.name.split(renameFrom).join(renameValue);
      else if (renameMode === 'set') newName = renameValue;
      return { id, name: newName };
    }).filter(Boolean);
    const res = await fetch('/api/meta/rename', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
    setRenaming(false);
    if (res.ok) { items.forEach((it: any) => { const r = rows.find(row => row.id === it.id); if (r) r.name = it.name; }); setShowRename(false); setSelected(new Set()); }
    else alert('Bulk-Rename fehlgeschlagen: ' + (await res.text()));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <button onClick={()=>setShowCols(!showCols)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50">≡ Spalten ({visibleCols.length})</button>
          {showCols && (
            <div className="absolute z-10 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg p-3 max-h-96 overflow-auto">
              {Array.from(new Set(ALL_COLUMNS.map(c=>c.group))).map(g => (
                <div key={g} className="mb-3">
                  <div className="text-xs uppercase text-slate-500 mb-1 font-semibold">{g}</div>
                  {ALL_COLUMNS.filter(c=>c.group===g).map(c => (
                    <label key={c.key} className="flex items-center gap-2 py-1 text-sm hover:bg-slate-50 px-1 rounded cursor-pointer">
                      <input type="checkbox" checked={visibleCols.includes(c.key)} onChange={()=>toggleCol(c.key)} />
                      {c.label}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button onClick={()=>setShowViews(!showViews)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50">★ Views</button>
          {showViews && (
            <div className="absolute z-10 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-lg p-3">
              <div className="text-xs uppercase text-slate-500 mb-1 font-semibold">Presets</div>
              {PRESET_VIEWS.map(v => <button key={v.name} onClick={()=>applyView(v)} className="block w-full text-left py-1 px-2 text-sm hover:bg-slate-50 rounded">{v.name} · {v.columns.length}</button>)}
              <div className="text-xs uppercase text-slate-500 mt-3 mb-1 font-semibold">Meine</div>
              {savedViews.length === 0 && <div className="text-xs text-slate-400 py-1">Keine gespeichert</div>}
              {savedViews.map(v => (
                <div key={v.name} className="flex items-center justify-between py-1">
                  <button onClick={()=>applyView(v)} className="text-left text-sm hover:underline flex-1">{v.name} · {v.columns.length}</button>
                  <button onClick={()=>delView(v.name)} className="text-xs text-red-500 hover:text-red-700">✕</button>
                </div>
              ))}
              <button onClick={saveCurrentView} className="w-full mt-2 py-1.5 px-2 bg-brand text-white rounded text-sm">+ Aktuelle View speichern</button>
            </div>
          )}
        </div>
        {selected.size > 0 && (
          <>
            <span className="text-sm text-slate-600">{selected.size} ausgewählt</span>
            <button onClick={()=>setShowRename(true)} className="px-3 py-2 bg-brand text-white rounded-lg text-sm font-medium">Bulk Rename</button>
            <button onClick={clearSel} className="text-sm text-slate-500">✕ Auswahl</button>
          </>
        )}
        <span className="ml-auto text-xs text-slate-500">Tipp: Spalten-Header ziehen zum Sortieren der Reihenfolge · Klick auf Namen zum Editieren</span>
      </div>

      {showRename && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={()=>setShowRename(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-3">Bulk Rename ({selected.size} Kampagnen)</h3>
            <select value={renameMode} onChange={e=>setRenameMode(e.target.value as any)} className="w-full px-3 py-2 border border-slate-200 rounded mb-2 text-sm">
              <option value="prefix">Präfix voranstellen</option>
              <option value="suffix">Suffix anhängen</option>
              <option value="replace">Suchen &amp; Ersetzen</option>
              <option value="set">Komplett neu setzen</option>
            </select>
            {renameMode === 'replace' && <input value={renameFrom} onChange={e=>setRenameFrom(e.target.value)} placeholder="Suchen nach…" className="w-full px-3 py-2 border border-slate-200 rounded mb-2 text-sm font-mono" />}
            <input value={renameValue} onChange={e=>setRenameValue(e.target.value)} placeholder={renameMode === 'replace' ? 'Ersetzen mit…' : renameMode === 'set' ? 'Neuer Name (überschreibt alle)' : renameMode === 'prefix' ? 'z.B. "Clipper_"' : 'z.B. "_v2"'} className="w-full px-3 py-2 border border-slate-200 rounded mb-3 text-sm font-mono" />
            <div className="text-xs text-slate-500 mb-3">Vorschau erste: <span className="font-mono">{(() => { const f = sortedRows.find(r => selected.has(r.id)); if (!f) return ''; if (renameMode==='prefix') return renameValue+f.name; if (renameMode==='suffix') return f.name+renameValue; if (renameMode==='replace') return f.name.split(renameFrom).join(renameValue); return renameValue; })()}</span></div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setShowRename(false)} className="px-4 py-2 text-sm text-slate-600">Abbrechen</button>
              <button onClick={bulkRename} disabled={renaming || !renameValue} className="px-4 py-2 bg-brand text-white rounded text-sm font-medium disabled:opacity-50">{renaming ? 'Umbenennen…' : 'Anwenden via Meta API'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
            <tr>
              <th className="px-3 py-3"><input type="checkbox" checked={selected.size === sortedRows.length && sortedRows.length > 0} onChange={()=>selected.size === sortedRows.length ? clearSel() : selectAll()} /></th>
              {visibleColDefs.map(col => (
                <th key={col.key} draggable onDragStart={()=>onDragStart(col.key)} onDragOver={(e)=>onDragOver(e, col.key)} onDrop={()=>onDrop(col.key)}
                  onClick={()=>onSort(col.key)}
                  className={'px-3 py-3 font-medium cursor-pointer select-none hover:bg-slate-50 ' + (col.align === 'right' ? 'text-right' : 'text-left')}>
                  {col.label} {sortKey === col.key && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map(row => (
              <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-3 py-2"><input type="checkbox" checked={selected.has(row.id)} onChange={()=>toggleSelect(row.id)} /></td>
                {visibleColDefs.map(col => {
                  const v = row[col.key];
                  if (col.key === 'name') {
                    return <td key={col.key} className="px-3 py-2 max-w-xs">
                      {editing === row.id ? (
                        <div className="flex gap-1">
                          <input value={editValue} onChange={e=>setEditValue(e.target.value)} className="flex-1 px-2 py-1 border border-blue-400 rounded text-xs font-mono" autoFocus />
                          <button onClick={saveInlineEdit} className="text-xs bg-brand text-white px-2 rounded">✓</button>
                          <button onClick={()=>setEditing(null)} className="text-xs text-slate-500 px-1">✕</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 group">
                          <span className="truncate cursor-pointer flex-1" title={v} onClick={()=>startInlineEdit(row)}>{v}</span>
                          <button onClick={()=>startInlineEdit(row)} className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-xs">✎</button>
                        </div>
                      )}
                    </td>;
                  }
                  if (col.key === 'status') {
                    const map: any = { ACTIVE: ['bg-emerald-500','Live'], PAUSED: ['bg-red-500','Pausiert'], IN_PROCESS: ['bg-amber-500','In Process'], DELETED: ['bg-slate-400','Gelöscht'], ARCHIVED: ['bg-slate-300','Archiviert'] };
                    const [color, label] = map[v] || ['bg-slate-400', String(v).toLowerCase()];
                    return <td key={col.key} className="px-3 py-2"><span className="inline-flex items-center gap-1.5 text-xs"><span className={'w-1.5 h-1.5 rounded-full ' + color}></span>{label}</span></td>;
                  }
                  return <td key={col.key} className={'px-3 py-2 ' + (col.align === 'right' ? 'text-right' : 'text-left')}>{col.fmt ? col.fmt(v) : v}</td>;
                })}
              </tr>
            ))}
            {sortedRows.length === 0 && <tr><td colSpan={visibleColDefs.length + 1} className="px-3 py-8 text-center text-slate-400">Keine Daten</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
