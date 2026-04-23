import { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { PRODUCT_TYPES } from './StockPage';

const today = () => new Date().toISOString().split('T')[0];

export const PACKING_TYPES = [
  { value: 'normal_half_kg', label: 'Normal 500g' },
  { value: 'normal_1kg',     label: 'Normal 1 kg' },
  { value: 'jar_small',      label: 'Jar Small'   },
  { value: 'jar_medium',     label: 'Jar Medium'  },
  { value: 'jar_large',      label: 'Jar Large'   },
  { value: 'big_bottle',     label: 'Big Bottle'  },
];

const DEFAULT_WEIGHTS = {
  normal_half_kg: 500, normal_1kg: 1000,
  jar_small: 200, jar_medium: 400, jar_large: 750, big_bottle: 1500,
};

const PRODUCT_COLORS = {
  'Salted Banana Chips': '#f4c430',
  'Spicy Banana Chips':  '#f87171',
  'Sweet Banana Chips':  '#fb923c',
  'Banana 4 Cut':        '#52b788',
  'Jaggery':             '#c084fc',
};

const typeStyle = {
  normal_half_kg: { bg: 'rgba(244,196,48,0.1)',  color: '#f4c430',  border: 'rgba(244,196,48,0.2)'  },
  normal_1kg:     { bg: 'rgba(251,146,60,0.1)',  color: '#fb923c',  border: 'rgba(251,146,60,0.2)'  },
  jar_small:      { bg: 'rgba(59,130,246,0.1)',  color: '#60a5fa',  border: 'rgba(59,130,246,0.2)'  },
  jar_medium:     { bg: 'rgba(82,183,136,0.1)',  color: '#52b788',  border: 'rgba(82,183,136,0.2)'  },
  jar_large:      { bg: 'rgba(168,85,247,0.1)',  color: '#c084fc',  border: 'rgba(168,85,247,0.2)'  },
  big_bottle:     { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8',  border: 'rgba(148,163,184,0.15)'},
};

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#e8f5ef',
  fontFamily: 'DM Sans, sans-serif',
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 14,
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.2s ease',
};

const emptyForm = {
  date: today(),
  product_type: PRODUCT_TYPES[0],
  packing_type: 'normal_half_kg',
  weight_per_unit_grams: 500,
  quantity: '',
  label: '',
};

// ── Current Packet Summary Card ───────────────────────────────────────────────
function PacketSummaryCard({ productType, items, color }) {
  const activeItems = items.filter(i => i.status === 'in_shop');
  const totalUnits  = activeItems.reduce((s, i) => s + i.quantity, 0);
  if (totalUnits === 0 && activeItems.length === 0) return null;

  const byType = activeItems.reduce((acc, item) => {
    const key = item.packing_type;
    if (!acc[key]) acc[key] = 0;
    acc[key] += item.quantity;
    return acc;
  }, {});

  return (
    <div className="rounded-2xl p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: `1px solid ${color}25`, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
      <div className="absolute top-0 right-0 w-16 h-16 rounded-full pointer-events-none"
        style={{ background: `${color}15`, filter: 'blur(16px)', transform: 'translate(30%,-30%)' }} />
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e8f5ef', fontSize: 13, lineHeight: 1.3 }}>
          {productType}
        </h3>
      </div>
      <div style={{ color, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, lineHeight: 1 }}>
        {totalUnits}
      </div>
      <div style={{ color: '#52b788', fontSize: 11, marginBottom: 12 }}>packets available</div>
      {Object.entries(byType).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(byType).map(([type, qty]) => {
            const ts = typeStyle[type];
            const label = PACKING_TYPES.find(t => t.value === type)?.label || type;
            return (
              <span key={type} className="px-2 py-1 rounded-lg text-xs"
                style={{ background: ts?.bg || 'rgba(255,255,255,0.05)', color: ts?.color || '#7fb89a', border: `1px solid ${ts?.border || 'rgba(255,255,255,0.1)'}`, fontFamily: 'DM Sans, sans-serif' }}>
                {label}: <strong>{qty}</strong>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Packed Page ──────────────────────────────────────────────────────────
export default function PackedPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [items,       setItems]       = useState([]);
  const [stockInfo,   setStockInfo]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState(emptyForm);
  const [saving,      setSaving]      = useState(false);
  const [filterProduct, setFilterProduct] = useState('');
  const [viewMode,    setViewMode]    = useState('summary'); // 'summary' | 'daily'

  const canManage = user?.role === 'manager' || user?.role === 'owner';

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/packed?status=in_shop'),
      api.get('/packed/available-stock'),
    ])
      .then(([packedRes, stockRes]) => {
        setItems(packedRes.data);
        setStockInfo(stockRes.data);
      })
      .catch(() => toast.error('Fetch failed', 'Could not load packed items.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getAvailableKg = (pt) => stockInfo.find(s => s.product_type === pt)?.available_kg ?? 0;

  const calcKgNeeded = () => {
    if (!form.weight_per_unit_grams || !form.quantity) return 0;
    return (Number(form.weight_per_unit_grams) * Number(form.quantity)) / 1000;
  };

  const hasEnoughStock = () => calcKgNeeded() <= getAvailableKg(form.product_type);

  const handlePackingTypeChange = (val) => {
    setForm(f => ({ ...f, packing_type: val, weight_per_unit_grams: DEFAULT_WEIGHTS[val] || f.weight_per_unit_grams }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasEnoughStock()) {
      toast.error('Insufficient stock!', `Need ${calcKgNeeded().toFixed(3)} kg, only ${getAvailableKg(form.product_type).toFixed(3)} kg available.`);
      return;
    }
    setSaving(true);
    try {
      await api.post('/packed', { ...form, status: 'in_shop' });
      setShowForm(false);
      setForm(emptyForm);
      fetchAll();
      toast.success('Packed entry added!', `${form.quantity} units × ${form.weight_per_unit_grams}g recorded.`);
    } catch (err) {
      toast.error('Save failed', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this packed entry? Stock will be restored.')) return;
    try {
      const res = await api.delete(`/packed/${id}`);
      fetchAll();
      toast.warning('Entry deleted', `${res.data.stock_restored_kg?.toFixed(3) || 0} kg restored to bulk stock.`);
    } catch {
      toast.error('Delete failed');
    }
  };

  // Group items by product for summary view
  const byProduct = PRODUCT_TYPES.reduce((acc, pt) => {
    acc[pt] = items.filter(i => i.product_type === pt);
    return acc;
  }, {});

  const totalPackets = items.reduce((s, i) => s + i.quantity, 0);

  // Daily entries sorted
  const dailyItems = filterProduct
    ? items.filter(i => i.product_type === filterProduct)
    : items;

  return (
    <div className="flex min-h-screen" style={{ background: '#0a1e14' }}>
      <Sidebar />

      <main className="flex-1 min-w-0 md:ml-64 p-4 sm:p-6 md:p-8 pb-28 md:pb-8 w-full max-w-full overflow-x-hidden">
        <div className="max-w-6xl mx-auto w-full">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 fade-up">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-6 rounded-full shrink-0" style={{ background: '#f4c430' }} />
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(20px, 4vw, 26px)', color: '#e8f5ef', letterSpacing: '-0.02em' }}>
                  Packed Items
                </h1>
              </div>
              <p style={{ color: '#52b788', fontSize: 13, paddingLeft: 14 }}>
                Current packet inventory · Bulk stock deducted automatically
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* View toggle */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {[{ id: 'summary', label: 'Summary' }, { id: 'daily', label: 'Daily Log' }].map(v => (
                  <button key={v.id} onClick={() => setViewMode(v.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={viewMode === v.id
                      ? { background: '#f4c430', color: '#0a1e14', fontFamily: 'Syne, sans-serif', fontWeight: 700 }
                      : { color: '#7fb89a', fontFamily: 'DM Sans, sans-serif' }}>
                    {v.label}
                  </button>
                ))}
              </div>
              {canManage && (
                <button onClick={() => setShowForm(!showForm)}
                  className="cc-btn-primary flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    {showForm ? (<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>) : (<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>)}
                  </svg>
                  {showForm ? 'Cancel' : 'Add Packed'}
                </button>
              )}
            </div>
          </div>

          {/* Total packets banner */}
          {!loading && totalPackets > 0 && (
            <div className="rounded-2xl px-5 py-4 mb-6 flex items-center justify-between flex-wrap gap-3"
              style={{ background: 'linear-gradient(135deg, rgba(244,196,48,0.1), rgba(82,183,136,0.06))', border: '1px solid rgba(244,196,48,0.2)' }}>
              <div>
                <div style={{ color: '#52b788', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Available Packets</div>
                <div style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, lineHeight: 1.1 }}>{totalPackets}</div>
                <div style={{ color: '#52b788', fontSize: 12 }}>units across all products</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PRODUCT_TYPES.map(pt => {
                  const count = items.filter(i => i.product_type === pt).reduce((s, i) => s + i.quantity, 0);
                  if (!count) return null;
                  const color = PRODUCT_COLORS[pt] || '#52b788';
                  return (
                    <div key={pt} className="text-center px-3 py-2 rounded-xl"
                      style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                      <div style={{ color, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18 }}>{count}</div>
                      <div style={{ color: '#7fb89a', fontSize: 10 }}>{pt.replace(' Banana Chips', '').replace(' Chips', '')}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Packed Form */}
          {showForm && canManage && (
            <div className="rounded-2xl p-5 sm:p-6 mb-6 fade-up"
              style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(244,196,48,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#e8f5ef', marginBottom: 16 }}>
                New Packing Entry
              </h2>

              {/* Stock check for selected product */}
              <div className="rounded-xl px-4 py-3 mb-5 flex items-center justify-between flex-wrap gap-2"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#52b788', fontSize: 13 }}>
                  Bulk stock for <strong style={{ color: '#e8f5ef' }}>{form.product_type}</strong>:
                </span>
                <span style={{
                  color: calcKgNeeded() > getAvailableKg(form.product_type) && calcKgNeeded() > 0 ? '#f87171' : '#52b788',
                  fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15
                }}>
                  {getAvailableKg(form.product_type).toFixed(3)} kg available
                  {calcKgNeeded() > 0 && calcKgNeeded() > getAvailableKg(form.product_type) && (
                    <span style={{ color: '#f87171', fontSize: 12, fontWeight: 400, marginLeft: 8 }}>⚠ Insufficient!</span>
                  )}
                </span>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Date</label>
                    <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                      className="cc-input" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Product Type</label>
                    <select value={form.product_type} onChange={e => setForm({ ...form, product_type: e.target.value })}
                      className="cc-input" style={{ ...inputStyle, appearance: 'none' }}>
                      {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Packing Type</label>
                    <select value={form.packing_type} onChange={e => handlePackingTypeChange(e.target.value)}
                      className="cc-input" style={{ ...inputStyle, appearance: 'none' }}>
                      {PACKING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Weight/Unit (g)</label>
                    <input type="number" required min="1" value={form.weight_per_unit_grams} placeholder="e.g. 500"
                      onChange={e => setForm({ ...form, weight_per_unit_grams: e.target.value })}
                      className="cc-input" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Quantity (units)</label>
                    <input type="number" required min="1" value={form.quantity} placeholder="e.g. 20"
                      onChange={e => setForm({ ...form, quantity: e.target.value })}
                      className="cc-input" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Label (optional)</label>
                    <input type="text" value={form.label} placeholder="e.g. 500g Masala"
                      onChange={e => setForm({ ...form, label: e.target.value })}
                      className="cc-input" style={inputStyle} />
                  </div>
                </div>

                {/* Preview */}
                {calcKgNeeded() > 0 && (
                  <div className="rounded-xl px-4 py-3 mb-5 flex items-center justify-between flex-wrap gap-3"
                    style={{
                      background: hasEnoughStock() ? 'rgba(82,183,136,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${hasEnoughStock() ? 'rgba(82,183,136,0.2)' : 'rgba(239,68,68,0.3)'}`
                    }}>
                    <div>
                      <span style={{ color: '#52b788', fontSize: 13 }}>Bulk stock needed: </span>
                      <span style={{ color: hasEnoughStock() ? '#52b788' : '#f87171', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>
                        {calcKgNeeded().toFixed(3)} kg
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#52b788', fontSize: 13 }}>After packing: </span>
                      <span style={{ color: hasEnoughStock() ? '#f4c430' : '#f87171', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>
                        {Math.max(0, getAvailableKg(form.product_type) - calcKgNeeded()).toFixed(3)} kg
                      </span>
                    </div>
                    {!hasEnoughStock() && (
                      <div style={{ color: '#f87171', fontSize: 12, width: '100%' }}>
                        ⚠ Cannot proceed — insufficient bulk stock. Add more production first.
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-6 py-3 rounded-xl text-sm w-full sm:w-auto text-center"
                    style={{ color: '#52b788', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'DM Sans, sans-serif' }}>
                    Cancel
                  </button>
                  <button type="submit"
                    disabled={saving || !hasEnoughStock() || !form.quantity}
                    className="cc-btn-primary flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm w-full sm:w-auto"
                    title={!hasEnoughStock() ? 'Insufficient bulk stock' : ''}>
                    {saving
                      ? <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Saving…</>
                      : !hasEnoughStock() && form.quantity
                        ? '⚠ Insufficient Stock'
                        : 'Save Entry'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── SUMMARY VIEW ── */}
          {viewMode === 'summary' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-20 gap-2">
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                  <span style={{ color: '#52b788' }}>Loading…</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PRODUCT_TYPES.map(pt => {
                    const color = PRODUCT_COLORS[pt] || '#52b788';
                    const ptItems = byProduct[pt] || [];
                    const total = ptItems.reduce((s, i) => s + i.quantity, 0);
                    if (total === 0) return (
                      <div key={pt} className="rounded-2xl p-4"
                        style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.05)', opacity: 0.6 }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                          <span style={{ color: '#7fb89a', fontSize: 13, fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>{pt}</span>
                        </div>
                        <div style={{ color: '#2d6a4f', fontSize: 12 }}>0 packets in stock</div>
                      </div>
                    );
                    return <PacketSummaryCard key={pt} productType={pt} items={ptItems} color={color} />;
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── DAILY LOG VIEW ── */}
          {viewMode === 'daily' && (
            <div>
              {/* Product filter */}
              <div className="flex overflow-x-auto gap-2 pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
                {[{ label: 'All', value: '' }, ...PRODUCT_TYPES.map(p => ({ label: p.replace(' Banana Chips', '').replace(' Chips', ''), value: p }))].map(opt => (
                  <button key={opt.value} onClick={() => setFilterProduct(opt.value)}
                    className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border shrink-0"
                    style={filterProduct === opt.value
                      ? { background: `${PRODUCT_COLORS[opt.value] || '#f4c430'}20`, color: PRODUCT_COLORS[opt.value] || '#f4c430', borderColor: `${PRODUCT_COLORS[opt.value] || '#f4c430'}40`, fontFamily: 'DM Sans, sans-serif' }
                      : { background: 'rgba(255,255,255,0.03)', color: '#7fb89a', borderColor: 'rgba(255,255,255,0.08)', fontFamily: 'DM Sans, sans-serif' }
                    }>
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl overflow-x-auto custom-scroll"
                style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['Date', 'Product', 'Label', 'Type', 'Wt/Unit', 'Qty', 'Total kg', ''].map((h, i) => (
                        <th key={i}
                          className={`py-4 px-4 text-xs font-semibold uppercase tracking-widest whitespace-nowrap ${[4,5,6].includes(i) ? 'text-right' : 'text-left'}`}
                          style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', background: 'rgba(0,0,0,0.15)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} className="text-center py-16">
                        <div className="flex items-center justify-center gap-2">
                          <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                          <span style={{ color: '#52b788' }}>Loading…</span>
                        </div>
                      </td></tr>
                    ) : dailyItems.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-20">
                        <div className="flex flex-col items-center">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#52b788" strokeWidth="1.5" className="mb-4 opacity-60">
                            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                          </svg>
                          <p style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>No packed items in shop</p>
                          <p style={{ color: '#2d6a4f', fontSize: 13, marginTop: 4 }}>Add a packed entry above.</p>
                        </div>
                      </td></tr>
                    ) : dailyItems.map((item, idx) => {
                      const ts = typeStyle[item.packing_type] || typeStyle.normal_half_kg;
                      const color = PRODUCT_COLORS[item.product_type] || '#52b788';
                      return (
                        <tr key={item._id} className="table-row"
                          style={{ borderBottom: idx < dailyItems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          <td className="px-4 py-4 whitespace-nowrap" style={{ color: '#7fb89a', fontSize: 12 }}>
                            {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                              <span style={{ color: '#e8f5ef', fontSize: 12 }}>{item.product_type}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap" style={{ color: '#7fb89a', fontSize: 12 }}>
                            {item.label || '—'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                              style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}`, fontFamily: 'Syne, sans-serif' }}>
                              {PACKING_TYPES.find(t => t.value === item.packing_type)?.label || item.packing_type}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap" style={{ color: '#7fb89a', fontSize: 12 }}>
                            {item.weight_per_unit_grams}g
                          </td>
                          <td className="px-4 py-4 text-right font-bold whitespace-nowrap" style={{ color: '#e8f5ef', fontFamily: 'Syne, sans-serif', fontSize: 15 }}>
                            {item.quantity}
                          </td>
                          <td className="px-4 py-4 text-right font-bold whitespace-nowrap" style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif' }}>
                            {item.total_weight_kg?.toFixed(3)}
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap">
                            {canManage && (
                              <button onClick={() => handleDelete(item._id)}
                                className="px-3 py-1.5 rounded-lg text-xs transition-all"
                                style={{ color: '#7fb89a', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Sans, sans-serif' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7fb89a'; }}>
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
          )}

        </div>
      </main>
    </div>
  );
}