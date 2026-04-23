import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/ChipcharmLogo.png';

const today = () => new Date().toISOString().split('T')[0];

export const PRODUCT_TYPES = [
  'Salted Banana Chips',
  'Spicy Banana Chips',
  'Sweet Banana Chips',
  'Banana 4 Cut',
  'Jaggery'
];

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#e8f5ef',
  fontFamily: 'DM Sans, sans-serif',
  borderRadius: 12,
  padding: '12px 14px', // Increased padding for better mobile touch target
  fontSize: 15, // Slightly larger for mobile readability
  width: '100%',
  transition: 'all 0.2s',
  outline: 'none',
};

const PRODUCT_COLORS = {
  'Salted Banana Chips': { bg: 'rgba(244,196,48,0.1)', color: '#f4c430', border: 'rgba(244,196,48,0.25)' },
  'Spicy Banana Chips': { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.25)' },
  'Sweet Banana Chips': { bg: 'rgba(251,146,60,0.1)', color: '#fb923c', border: 'rgba(251,146,60,0.25)' },
  'Banana 4 Cut': { bg: 'rgba(82,183,136,0.1)', color: '#52b788', border: 'rgba(82,183,136,0.25)' },
  'Jaggery': { bg: 'rgba(168,85,247,0.1)', color: '#c084fc', border: 'rgba(168,85,247,0.25)' },
};

// ── CSV Export helper ─────────────────────────────────────────────────────────
function exportToCSV(entries) {
  const headers = ['Date', 'Product Type', 'Opening Stock (kg)', 'Produced (kg)', 'Closing Stock (kg)', 'Notes'];
  const rows = entries.map(e => [
    new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    e.product_type,
    e.opening_stock_kg?.toFixed(2) ?? '0.00',
    e.produced_kg?.toFixed(2) ?? '0.00',
    e.closing_stock_kg?.toFixed(2) ?? '0.00',
    (e.notes || '').replace(/,/g, ';'),
  ]);

  const csvContent = [headers, ...rows]
    .map(r => r.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chipcharm-stock-${today()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Sampling Panel ────────────────────────────────────────────────────────────
const SAMPLE_KEY = 'chipcharm_samples';
function loadSamples() {
  try { return JSON.parse(localStorage.getItem(SAMPLE_KEY) || '[]'); } catch { return []; }
}
function saveSamples(s) { localStorage.setItem(SAMPLE_KEY, JSON.stringify(s)); }

function SamplingPanel({ availableStock, toast }) {
  const [samples, setSamples] = useState(loadSamples);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ product_type: PRODUCT_TYPES[0], amount_kg: '', notes: '' });

  const persist = (next) => { setSamples(next); saveSamples(next); };

  const handleReserve = () => {
    if (!form.amount_kg || Number(form.amount_kg) <= 0) { toast.error('Invalid amount', 'Enter a positive kg value.'); return; }
    const available = availableStock.find(s => s.product_type === form.product_type)?.available_kg ?? 0;
    if (Number(form.amount_kg) > available) { toast.error('Insufficient stock', `Only ${available.toFixed(2)} kg available.`); return; }
    const next = [...samples, {
      id: Date.now(),
      product_type: form.product_type,
      amount_kg: Number(form.amount_kg),
      notes: form.notes,
      status: 'reserved',
      reserved_at: new Date().toISOString(),
    }];
    persist(next);
    setShowAdd(false);
    setForm({ product_type: PRODUCT_TYPES[0], amount_kg: '', notes: '' });
    toast.success('Sample reserved!', `${form.amount_kg} kg of ${form.product_type} set aside.`);
  };

  const handleComplete = (id) => {
    const next = samples.map(s => s.id === id ? { ...s, status: 'completed', completed_at: new Date().toISOString() } : s);
    persist(next);
    toast.success('Sample completed!', 'You can now add a new sample for this product.');
  };

  const handleRemove = (id) => {
    persist(samples.filter(s => s.id !== id));
  };

  const activeSamples = samples.filter(s => s.status === 'reserved');
  const completedSamples = samples.filter(s => s.status === 'completed').slice(-3);
  const totalReservedKg = activeSamples.reduce((s, x) => s + x.amount_kg, 0);

  return (
    <div className="rounded-2xl p-4 sm:p-5 mb-6 shadow-xl"
      style={{ background: 'linear-gradient(145deg, #1a1a0f, #16160a)', border: '1px solid rgba(244,196,48,0.2)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(244,196,48,0.15)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" />
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e8f5ef', fontSize: 16 }}>Sampling Reserve</h3>
            {totalReservedKg > 0 && (
              <p style={{ color: '#f4c430', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>
                {totalReservedKg.toFixed(2)} kg reserved across {activeSamples.length} sample{activeSamples.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center justify-center w-full sm:w-auto gap-2 px-4 py-3 sm:py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
          style={{ background: showAdd ? 'rgba(244,196,48,0.2)' : 'rgba(244,196,48,0.1)', color: '#f4c430', border: '1px solid rgba(244,196,48,0.25)', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {showAdd ? (<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>) : (<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>)}
          </svg>
          {showAdd ? 'Cancel' : 'Reserve Sample'}
        </button>
      </div>

      {showAdd && (
        <div className="rounded-xl p-4 mb-4 fade-up" style={{ background: 'rgba(244,196,48,0.05)', border: '1px solid rgba(244,196,48,0.15)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-[#f4c430] mb-1.5 font-bold uppercase tracking-wider font-syne">Product</label>
              <select value={form.product_type} onChange={e => setForm({ ...form, product_type: e.target.value })} style={inputStyle}>
                {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#f4c430] mb-1.5 font-bold uppercase tracking-wider font-syne">Reserve (kg)</label>
              <input type="number" step="0.01" min="0.01" placeholder="e.g. 0.5"
                value={form.amount_kg} onChange={e => setForm({ ...form, amount_kg: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs text-[#f4c430] mb-1.5 font-bold uppercase tracking-wider font-syne">Notes</label>
              <input type="text" placeholder="e.g. Market demo..."
                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={inputStyle} />
            </div>
          </div>
          {form.product_type && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 px-4 py-3 rounded-xl gap-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <span style={{ color: '#52b788', fontSize: 13 }}>Available: <strong style={{ color: '#e8f5ef' }}>
                {(availableStock.find(s => s.product_type === form.product_type)?.available_kg ?? 0).toFixed(2)} kg
              </strong></span>
              {form.amount_kg > 0 && (
                <span style={{ color: '#f4c430', fontSize: 13 }}>Remaining After: <strong>
                  {Math.max(0, (availableStock.find(s => s.product_type === form.product_type)?.available_kg ?? 0) - Number(form.amount_kg)).toFixed(2)} kg
                </strong></span>
              )}
            </div>
          )}
          <button onClick={handleReserve} className="w-full sm:w-auto px-6 py-3.5 sm:py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-transform"
            style={{ background: '#f4c430', color: '#0a1e14', fontFamily: 'Syne, sans-serif' }}>
            Reserve for Sampling
          </button>
        </div>
      )}

      {activeSamples.length > 0 && (
        <div className="space-y-3 mb-3">
          {activeSamples.map(s => {
            const col = PRODUCT_COLORS[s.product_type]?.color || '#f4c430';
            return (
              <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${col}25` }}>
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1 sm:mt-0" style={{ background: col }} />
                  <div>
                    <div style={{ color: '#e8f5ef', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>
                      <strong style={{ color: col }}>{s.amount_kg} kg</strong> — {s.product_type}
                    </div>
                    {s.notes && <div className="mt-0.5" style={{ color: '#7fb89a', fontSize: 12 }}>{s.notes}</div>}
                    <div style={{ color: '#52b788', fontSize: 11, marginTop: 4 }}>
                      Reserved {new Date(s.reserved_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button onClick={() => handleComplete(s.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                    style={{ background: 'rgba(82,183,136,0.12)', color: '#52b788', border: '1px solid rgba(82,183,136,0.25)', fontFamily: 'Syne, sans-serif' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Complete
                  </button>
                  <button onClick={() => handleRemove(s.id)}
                    className="p-2.5 sm:p-2 rounded-xl text-xs flex items-center justify-center active:scale-95 transition-transform shrink-0"
                    style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeSamples.length === 0 && !showAdd && (
        <p style={{ color: '#2d6a4f', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
          No active samples reserved. Reserve a small batch to set aside for tasting/demos.
        </p>
      )}

      {completedSamples.length > 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: '#2d6a4f', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', marginBottom: 10 }}>Recently Completed</p>
          <div className="flex flex-wrap gap-2.5">
            {completedSamples.map(s => (
              <span key={s.id} className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
                style={{ background: 'rgba(82,183,136,0.08)', color: '#52b788', border: '1px solid rgba(82,183,136,0.15)', fontFamily: 'DM Sans, sans-serif' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                {s.amount_kg} kg {s.product_type.replace(' Banana Chips', '').replace(' Chips', '')}
                <button onClick={() => handleRemove(s.id)} className="ml-1 opacity-60 hover:opacity-100 p-1">✕</button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Stock Page ───────────────────────────────────────────────────────────
export default function StockPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [entries, setEntries] = useState([]);
  const [availStock, setAvailStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: today(), product_type: PRODUCT_TYPES[0], produced_kg: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [exporting, setExporting] = useState(false);

  const canManage = user?.role === 'manager' || user?.role === 'owner';

  const fetchEntries = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.append('product_type', filterType);
    Promise.all([
      api.get(`/stock?${params}`),
      api.get('/packed/available-stock'),
    ])
      .then(([stockRes, availRes]) => {
        setEntries(stockRes.data);
        setAvailStock(availRes.data);
      })
      .catch(() => toast.error('Fetch failed', 'Could not load stock entries.'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchEntries, [filterType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/stock', form);
      setShowForm(false);
      setForm({ date: today(), product_type: PRODUCT_TYPES[0], produced_kg: '', notes: '' });
      fetchEntries();
      toast.success('Entry saved!', `${form.produced_kg} kg of ${form.product_type} recorded.`);
    } catch (err) {
      toast.error('Save failed', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await api.delete(`/stock/${id}`);
      fetchEntries();
      toast.warning('Entry deleted', 'Stock entry has been removed.');
    } catch {
      toast.error('Delete failed', 'Could not delete this entry.');
    }
  };

  const handleExportCSV = () => {
    setExporting(true);
    try {
      exportToCSV(entries);
      toast.success('Exported!', `${entries.length} entries downloaded as CSV.`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex bg-[#0a1e14] min-h-screen">
      <Sidebar />
      <main className="md:ml-64 flex-1 p-4 md:p-8 pb-28 md:pb-8 w-full max-w-[100vw] overflow-x-hidden">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-6 fade-up">
            <div className="flex justify-between items-start md:items-center mb-5 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-6 md:h-8 rounded-full" style={{ background: '#f4c430' }} />
                  <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24 }} className="md:text-[28px] text-[#e8f5ef] tracking-tight">
                    Daily Stock
                  </h1>
                </div>
                <p style={{ color: '#52b788', fontSize: 13, paddingLeft: 14 }}>Track daily chip production batches</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="md:hidden w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-white p-1 overflow-hidden shadow-lg border border-[#f4c430]/30">
                  <img src={logo} alt="ChipCharm Logo" className="w-full h-full object-contain" />
                </div>

                <button onClick={handleExportCSV} disabled={exporting || entries.length === 0}
                  className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
                  style={{ background: 'rgba(82,183,136,0.1)', color: '#52b788', border: '1px solid rgba(82,183,136,0.2)', fontFamily: 'DM Sans, sans-serif' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export CSV
                </button>

                {canManage && (
                  <button onClick={() => setShowForm(!showForm)}
                    className="hidden md:flex bg-[#f4c430] text-[#0a1e14] items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-transform whitespace-nowrap font-syne">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      {showForm ? (<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>) : (<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>)}
                    </svg>
                    {showForm ? 'Close' : 'Add Entry'}
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Action Buttons */}
            <div className="md:hidden flex gap-3 mb-5">
              {canManage && (
                <button onClick={() => setShowForm(!showForm)}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold shadow-lg active:scale-95 transition-transform"
                  style={{ background: '#f4c430', color: '#0a1e14', fontFamily: 'Syne, sans-serif' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    {showForm ? (<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>) : (<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>)}
                  </svg>
                  {showForm ? 'Close Form' : 'Add Entry'}
                </button>
              )}
              <button onClick={handleExportCSV} disabled={entries.length === 0}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-medium active:scale-95 transition-transform shrink-0"
                style={{ background: 'rgba(82,183,136,0.1)', color: '#52b788', border: '1px solid rgba(82,183,136,0.2)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            </div>

            {/* Product Filter Pills - optimized for mobile swipe */}
            <div className="relative w-full mt-2 -mx-4 px-4 md:mx-0 md:px-0">
              <style>{`.filter-scroll::-webkit-scrollbar { display: none; } .filter-scroll { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
              <div className="flex overflow-x-auto gap-2.5 pb-3 w-full snap-x filter-scroll">
                {[{ label: 'All Products', value: '' }, ...PRODUCT_TYPES.map(p => ({ label: p, value: p }))].map((opt) => {
                  const isActive = filterType === opt.value;
                  const col = opt.value ? PRODUCT_COLORS[opt.value] : null;
                  return (
                    <button key={opt.label} onClick={() => setFilterType(opt.value)}
                      className="snap-start whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border active:scale-95"
                      style={isActive && col
                        ? { background: col.bg, color: col.color, borderColor: col.border, fontFamily: 'DM Sans, sans-serif' }
                        : isActive
                          ? { background: '#f4c430', color: '#0a1e14', borderColor: '#f4c430', fontFamily: 'DM Sans, sans-serif' }
                          : { background: 'rgba(255,255,255,0.03)', color: '#7fb89a', borderColor: 'rgba(255,255,255,0.08)', fontFamily: 'DM Sans, sans-serif' }
                      }>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <SamplingPanel availableStock={availStock} toast={toast} />

          {/* Production Entry Form */}
          {showForm && canManage && (
            <div className="rounded-2xl p-4 sm:p-6 mb-6 shadow-2xl fade-up border border-[#f4c430]/20"
              style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)' }}>
              <h2 className="font-syne font-bold text-lg text-[#e8f5ef] mb-5">New Production Entry</h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  <div>
                    <label className="block text-xs text-[#52b788] mb-2 font-semibold uppercase tracking-wider font-syne">Date</label>
                    <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#52b788] mb-2 font-semibold uppercase tracking-wider font-syne">Product Type</label>
                    <select value={form.product_type} onChange={e => setForm({ ...form, product_type: e.target.value })} style={inputStyle}>
                      {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#52b788] mb-2 font-semibold uppercase tracking-wider font-syne">Produced (kg)</label>
                    <input type="number" step="0.1" min="0" required value={form.produced_kg} onChange={e => setForm({ ...form, produced_kg: e.target.value })} style={inputStyle} placeholder="e.g. 50" />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-xs text-[#52b788] mb-2 font-semibold uppercase tracking-wider font-syne">Notes (optional)</label>
                  <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={inputStyle} placeholder="Any notes for today…" />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button type="submit" disabled={saving} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 sm:py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform" style={{ background: '#f4c430', color: '#0a1e14', fontFamily: 'Syne, sans-serif' }}>
                    {saving ? (<><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg> Saving…</>) : 'Save Entry'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="w-full sm:w-auto px-6 py-3.5 sm:py-3 rounded-xl text-sm text-center active:scale-95 transition-transform border border-white/10 text-[#52b788]">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Desktop Table / Mobile Card List Wrapper */}
          <div className="mb-4 flex items-center justify-between px-1">
            <span style={{ color: '#52b788', fontSize: 13, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {entries.length} {filterType ? filterType : 'Total'} Entries
            </span>
          </div>

          {loading ? (
            <div className="text-center py-20 flex items-center justify-center gap-3 bg-[#132d20]/50 rounded-2xl border border-white/5">
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
              <span className="text-[#52b788] text-sm">Loading stock data...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center bg-[#132d20]/50 rounded-2xl border border-white/5">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#52b788" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M9 14h6" /><path d="M9 10h6" />
              </svg>
              <p className="text-[#52b788] font-syne font-semibold text-lg">No entries yet</p>
              <p className="text-[#2d6a4f] text-sm mt-1">{filterType ? `No entries for ${filterType}` : 'Add your first production entry above'}</p>
            </div>
          ) : (
            <>
              {/* --- DESKTOP VIEW (TABLE) --- */}
              <div className="hidden md:block rounded-2xl overflow-hidden border border-white/5 shadow-xl" style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/20">
                      {['Date', 'Product', 'Opening kg', 'Produced kg', 'Closing kg', 'Notes', ''].map((h, i) => (
                        <th key={i} className={`py-4 px-5 text-xs font-semibold uppercase tracking-widest ${[2, 3, 4].includes(i) ? 'text-right' : 'text-left'}`} style={{ color: '#52b788', fontFamily: 'Syne, sans-serif' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e, idx) => {
                      const col = PRODUCT_COLORS[e.product_type];
                      return (
                        <tr key={e._id} className="hover:bg-white/[0.03] transition-colors" style={{ borderBottom: idx < entries.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                          <td className="px-5 py-4 whitespace-nowrap font-syne font-semibold text-[#e8f5ef]">
                            {new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold font-syne" style={{ background: col?.bg, color: col?.color, border: `1px solid ${col?.border}` }}>
                              {e.product_type}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right text-[#7fb89a]">{e.opening_stock_kg?.toFixed(2)}</td>
                          <td className="px-5 py-4 text-right font-bold font-syne text-[#f4c430]">{e.produced_kg?.toFixed(2)}</td>
                          <td className="px-5 py-4 text-right font-bold font-syne text-[#52b788]">{e.closing_stock_kg?.toFixed(2)}</td>
                          <td className="px-5 py-4 text-[#2d6a4f] text-xs truncate max-w-[200px]">{e.notes || '—'}</td>
                          <td className="px-5 py-4 text-right">
                            {canManage && (
                              <button onClick={() => handleDelete(e._id)} className="px-3 py-1.5 rounded-lg text-xs font-dm hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all border border-white/10 text-[#7fb89a]">
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* --- MOBILE VIEW (CARDS) --- */}
              <div className="md:hidden flex flex-col gap-3">
                {entries.map(e => {
                  const col = PRODUCT_COLORS[e.product_type];
                  return (
                    <div key={e._id} className="rounded-xl p-4 border border-white/5 relative" style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)' }}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-syne font-bold text-[#e8f5ef] text-base mb-1">
                            {new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold font-syne inline-block" style={{ background: col?.bg, color: col?.color, border: `1px solid ${col?.border}` }}>
                            {e.product_type}
                          </span>
                        </div>
                        {canManage && (
                          <button onClick={() => handleDelete(e._id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 active:scale-95 transition-transform">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-black/20 rounded-xl p-3 mb-2 border border-white/5">
                        <div className="text-center">
                          <span className="block text-[10px] text-[#52b788] uppercase font-syne mb-1">Opening</span>
                          <span className="text-[#7fb89a] text-sm font-dm">{e.opening_stock_kg?.toFixed(2)}</span>
                        </div>
                        <div className="text-center border-l border-r border-white/5">
                          <span className="block text-[10px] text-[#f4c430] uppercase font-syne mb-1">Produced</span>
                          <span className="text-[#f4c430] text-sm font-bold font-syne">{e.produced_kg?.toFixed(2)}</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-[10px] text-[#52b788] uppercase font-syne mb-1">Closing</span>
                          <span className="text-[#52b788] text-sm font-bold font-syne">{e.closing_stock_kg?.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      {e.notes && (
                        <div className="mt-2 text-xs text-[#2d6a4f] px-1 bg-[#0a1e14]/50 rounded p-2 italic">
                          "{e.notes}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}