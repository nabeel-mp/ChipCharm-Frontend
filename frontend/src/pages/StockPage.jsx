import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api     from '../api/axios';
import { useToast } from '../components/Toast';
import { useAuth }  from '../context/AuthContext';
import logo    from '../assets/ChipcharmLogo.png';

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
  padding: '10px 14px',
  fontSize: 14,
  width: '100%',
  transition: 'all 0.2s',
  outline: 'none',
};

const PRODUCT_COLORS = {
  'Salted Banana Chips':  { bg: 'rgba(244,196,48,0.1)',  color: '#f4c430',  border: 'rgba(244,196,48,0.25)'  },
  'Spicy Banana Chips':   { bg: 'rgba(239,68,68,0.1)',   color: '#f87171',  border: 'rgba(239,68,68,0.25)'   },
  'Sweet Banana Chips':   { bg: 'rgba(251,146,60,0.1)',  color: '#fb923c',  border: 'rgba(251,146,60,0.25)'  },
  'Banana 4 Cut':         { bg: 'rgba(82,183,136,0.1)',  color: '#52b788',  border: 'rgba(82,183,136,0.25)'  },
  'Jaggery':              { bg: 'rgba(168,85,247,0.1)',  color: '#c084fc',  border: 'rgba(168,85,247,0.25)'  },
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
  const url  = URL.createObjectURL(blob);
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
  const [samples, setSamples]   = useState(loadSamples);
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState({ product_type: PRODUCT_TYPES[0], amount_kg: '', notes: '' });

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

  const activeSamples   = samples.filter(s => s.status === 'reserved');
  const completedSamples = samples.filter(s => s.status === 'completed').slice(-3);

  const totalReservedKg = activeSamples.reduce((s, x) => s + x.amount_kg, 0);

  return (
    <div className="rounded-2xl p-5 mb-6"
      style={{ background: 'linear-gradient(145deg, #1a1a0f, #16160a)', border: '1px solid rgba(244,196,48,0.2)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(244,196,48,0.15)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
          </div>
          <div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e8f5ef', fontSize: 15 }}>Sampling Reserve</h3>
            {totalReservedKg > 0 && (
              <p style={{ color: '#f4c430', fontSize: 11, fontFamily: 'DM Sans, sans-serif' }}>
                {totalReservedKg.toFixed(2)} kg reserved across {activeSamples.length} sample{activeSamples.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: showAdd ? 'rgba(244,196,48,0.2)' : 'rgba(244,196,48,0.1)', color: '#f4c430', border: '1px solid rgba(244,196,48,0.25)', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {showAdd ? (<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>) : (<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>)}
          </svg>
          {showAdd ? 'Cancel' : 'Reserve Sample'}
        </button>
      </div>

      {/* Add sample form */}
      {showAdd && (
        <div className="rounded-xl p-4 mb-4 fade-up"
          style={{ background: 'rgba(244,196,48,0.05)', border: '1px solid rgba(244,196,48,0.15)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#f4c430', marginBottom: 6, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Product</label>
              <select value={form.product_type} onChange={e => setForm({ ...form, product_type: e.target.value })}
                style={{ ...inputStyle, appearance: 'none', padding: '8px 12px', fontSize: 13 }}>
                {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#f4c430', marginBottom: 6, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>
                Reserve Amount (kg)
              </label>
              <input type="number" step="0.01" min="0.01" placeholder="e.g. 0.5"
                value={form.amount_kg} onChange={e => setForm({ ...form, amount_kg: e.target.value })}
                style={{ ...inputStyle, padding: '8px 12px', fontSize: 13 }} className="cc-input" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#f4c430', marginBottom: 6, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Notes</label>
              <input type="text" placeholder="e.g. Market demo, Shop tasting..."
                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                style={{ ...inputStyle, padding: '8px 12px', fontSize: 13 }} className="cc-input" />
            </div>
          </div>
          {/* Available check */}
          {form.product_type && (
            <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(0,0,0,0.2)' }}>
              <span style={{ color: '#52b788', fontSize: 12 }}>Available: <strong style={{ color: '#e8f5ef' }}>
                {(availableStock.find(s => s.product_type === form.product_type)?.available_kg ?? 0).toFixed(2)} kg
              </strong></span>
              {form.amount_kg > 0 && (
                <span style={{ color: '#f4c430', fontSize: 12 }}>After: <strong>
                  {Math.max(0, (availableStock.find(s => s.product_type === form.product_type)?.available_kg ?? 0) - Number(form.amount_kg)).toFixed(2)} kg
                </strong></span>
              )}
            </div>
          )}
          <button onClick={handleReserve}
            className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: '#f4c430', color: '#0a1e14', fontFamily: 'Syne, sans-serif' }}>
            Reserve for Sampling
          </button>
        </div>
      )}

      {/* Active samples */}
      {activeSamples.length > 0 && (
        <div className="space-y-2 mb-3">
          {activeSamples.map(s => {
            const col = PRODUCT_COLORS[s.product_type]?.color || '#f4c430';
            return (
              <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl flex-wrap"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${col}25` }}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: col }} />
                  <div>
                    <div style={{ color: '#e8f5ef', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
                      <strong style={{ color: col }}>{s.amount_kg} kg</strong> — {s.product_type}
                    </div>
                    {s.notes && <div style={{ color: '#7fb89a', fontSize: 11 }}>{s.notes}</div>}
                    <div style={{ color: '#52b788', fontSize: 10, marginTop: 1 }}>
                      Reserved {new Date(s.reserved_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleComplete(s.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background: 'rgba(82,183,136,0.12)', color: '#52b788', border: '1px solid rgba(82,183,136,0.25)', fontFamily: 'Syne, sans-serif' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Sample Complete
                  </button>
                  <button onClick={() => handleRemove(s.id)}
                    className="px-2 py-1.5 rounded-lg text-xs"
                    style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeSamples.length === 0 && !showAdd && (
        <p style={{ color: '#2d6a4f', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
          No active samples reserved. Reserve a small batch to set aside for tasting/demos.
        </p>
      )}

      {/* Completed samples (recent) */}
      {completedSamples.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: '#2d6a4f', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Recently Completed</p>
          <div className="flex flex-wrap gap-2">
            {completedSamples.map(s => (
              <span key={s.id} className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
                style={{ background: 'rgba(82,183,136,0.08)', color: '#52b788', border: '1px solid rgba(82,183,136,0.15)', fontFamily: 'DM Sans, sans-serif' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                {s.amount_kg} kg {s.product_type.replace(' Banana Chips', '').replace(' Chips', '')}
                <button onClick={() => handleRemove(s.id)} style={{ marginLeft: 2, opacity: 0.6 }}>✕</button>
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
  const [entries,     setEntries]     = useState([]);
  const [availStock,  setAvailStock]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState({ date: today(), product_type: PRODUCT_TYPES[0], produced_kg: '', notes: '' });
  const [saving,      setSaving]      = useState(false);
  const [filterType,  setFilterType]  = useState('');
  const [exporting,   setExporting]   = useState(false);

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
    <div className="flex" style={{ minHeight: '100vh', background: '#0a1e14' }}>
      <Sidebar />
      <main className="md:ml-64 flex-1 p-5 md:p-8 pb-28 md:pb-8 w-full max-w-[100vw] overflow-x-hidden">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-6 md:mb-8 fade-up">
            <div className="flex justify-between items-start md:items-center mb-5 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-6 rounded-full" style={{ background: '#f4c430' }} />
                  <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#e8f5ef', letterSpacing: '-0.02em' }}>
                    Daily Stock
                  </h1>
                </div>
                <p style={{ color: '#52b788', fontSize: 13, paddingLeft: 14 }}>Track daily chip production batches</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="md:hidden w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 bg-white p-1 overflow-hidden"
                  style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.35)' }}>
                  <img src={logo} alt="ChipCharm Logo" className="w-full h-full object-contain" />
                </div>

                {/* Export CSV */}
                <button onClick={handleExportCSV} disabled={exporting || entries.length === 0}
                  className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: 'rgba(82,183,136,0.1)', color: '#52b788', border: '1px solid rgba(82,183,136,0.2)', fontFamily: 'DM Sans, sans-serif' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(82,183,136,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(82,183,136,0.1)'}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Export CSV
                </button>

                {canManage && (
                  <button onClick={() => setShowForm(!showForm)}
                    className="hidden md:flex cc-btn-primary items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm whitespace-nowrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      {showForm ? (<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>) : (<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>)}
                    </svg>
                    {showForm ? 'Close' : 'Add Entry'}
                  </button>
                )}
              </div>
            </div>

            {/* Mobile buttons */}
            <div className="md:hidden flex gap-3 mb-5">
              {canManage && (
                <button onClick={() => setShowForm(!showForm)}
                  className="cc-btn-primary flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm shadow-lg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    {showForm ? (<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>) : (<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>)}
                  </svg>
                  {showForm ? 'Close Form' : 'Add Entry'}
                </button>
              )}
              <button onClick={handleExportCSV} disabled={entries.length === 0}
                className="flex items-center gap-2 px-4 py-3.5 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(82,183,136,0.1)', color: '#52b788', border: '1px solid rgba(82,183,136,0.2)', fontFamily: 'DM Sans, sans-serif' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                CSV
              </button>
            </div>

            {/* Product Filter Pills */}
            <div className="relative w-full mt-2">
              <style>{`.filter-scroll::-webkit-scrollbar { display: none; }`}</style>
              <div className="flex overflow-x-auto gap-2.5 pb-2 w-full snap-x filter-scroll"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {[{ label: 'All Products', value: '' }, ...PRODUCT_TYPES.map(p => ({ label: p, value: p }))].map((opt) => {
                  const isActive = filterType === opt.value;
                  const col = opt.value ? PRODUCT_COLORS[opt.value] : null;
                  return (
                    <button key={opt.label} onClick={() => setFilterType(opt.value)}
                      className="snap-start whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border"
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

          {/* Sampling Panel */}
          <SamplingPanel availableStock={availStock} toast={toast} />

          {/* Production Entry Form */}
          {showForm && canManage && (
            <div className="rounded-2xl p-5 md:p-6 mb-6 fade-up"
              style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(244,196,48,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#e8f5ef', marginBottom: 20 }}>
                New Production Entry
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</label>
                    <input type="date" required value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                      className="cc-input" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Product Type</label>
                    <select value={form.product_type} onChange={e => setForm({ ...form, product_type: e.target.value })}
                      className="cc-input" style={{ ...inputStyle, appearance: 'none' }}>
                      {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Produced (kg)</label>
                    <input type="number" step="0.1" min="0" required value={form.produced_kg}
                      onChange={e => setForm({ ...form, produced_kg: e.target.value })}
                      className="cc-input" style={inputStyle} placeholder="e.g. 50" />
                  </div>
                </div>
                <div className="mb-6">
                  <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notes (optional)</label>
                  <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="cc-input" style={inputStyle} placeholder="Any notes for today…" />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button type="submit" disabled={saving} className="cc-btn-primary flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 rounded-xl text-sm w-full sm:w-auto">
                    {saving ? (<><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Saving…</>) : 'Save Entry'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-5 py-3.5 sm:py-3 rounded-xl text-sm transition-all w-full sm:w-auto text-center"
                    style={{ color: '#52b788', fontFamily: 'DM Sans, sans-serif', border: '1px solid rgba(255,255,255,0.08)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table */}
          <div className="rounded-2xl overflow-x-auto w-full custom-scroll"
            style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
              <span style={{ color: '#52b788', fontSize: 12, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {entries.length} {filterType ? filterType : 'Total'} Entries
              </span>
              {entries.length > 0 && (
                <button onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                  style={{ color: '#52b788', border: '1px solid rgba(82,183,136,0.2)', fontFamily: 'DM Sans, sans-serif' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(82,183,136,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Export CSV
                </button>
              )}
            </div>
            <table className="w-full text-sm min-w-[750px]">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Date', 'Product', 'Opening kg', 'Produced kg', 'Closing kg', 'Notes', ''].map((h, i) => (
                    <th key={i}
                      className={`py-4 px-5 text-xs font-semibold uppercase tracking-widest whitespace-nowrap ${[2, 3, 4].includes(i) ? 'text-right' : 'text-left'}`}
                      style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', background: 'rgba(0,0,0,0.1)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-16">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                      <span style={{ color: '#52b788' }}>Loading entries…</span>
                    </div>
                  </td></tr>
                ) : entries.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#52b788" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-70">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                        <path d="M9 14h6"/><path d="M9 10h6"/>
                      </svg>
                      <p style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>No entries yet</p>
                      <p style={{ color: '#2d6a4f', fontSize: 13, marginTop: 4 }}>
                        {filterType ? `No entries for ${filterType}` : 'Add your first production entry above'}
                      </p>
                    </div>
                  </td></tr>
                ) : entries.map((e, idx) => {
                  const col = PRODUCT_COLORS[e.product_type];
                  return (
                    <tr key={e._id} className="table-row hover:bg-white/[0.02] transition-colors"
                      style={{ borderBottom: idx < entries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td className="px-5 py-4 whitespace-nowrap" style={{ color: '#e8f5ef', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>
                        {new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: col?.bg, color: col?.color, border: `1px solid ${col?.border}`, fontFamily: 'Syne, sans-serif' }}>
                          {e.product_type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap" style={{ color: '#7fb89a' }}>{e.opening_stock_kg?.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right font-bold whitespace-nowrap" style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif' }}>{e.produced_kg?.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right font-bold whitespace-nowrap" style={{ color: '#52b788', fontFamily: 'Syne, sans-serif' }}>{e.closing_stock_kg?.toFixed(2)}</td>
                      <td className="px-5 py-4 whitespace-nowrap truncate max-w-[150px]" style={{ color: '#2d6a4f', fontSize: 12 }}>{e.notes || '—'}</td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {canManage && (
                          <button onClick={() => handleDelete(e._id)}
                            className="px-3 py-1.5 rounded-lg text-xs transition-all"
                            style={{ color: '#7fb89a', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Sans, sans-serif' }}
                            onMouseEnter={ev => { ev.currentTarget.style.background = 'rgba(239,68,68,0.1)'; ev.currentTarget.style.color = '#f87171'; ev.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                            onMouseLeave={ev => { ev.currentTarget.style.background = 'transparent'; ev.currentTarget.style.color = '#7fb89a'; ev.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
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
        </div>
      </main>
    </div>
  );
}