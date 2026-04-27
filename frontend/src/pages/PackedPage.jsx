import { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { PRODUCT_TYPES } from './StockPage';

const today = () => new Date().toISOString().split('T')[0];

export const PACKING_TYPES = [
  { value: 'normal_500g', label: 'Normal 500g' },
  { value: 'normal_1kg',  label: 'Normal 1Kg' },
  { value: 'jar_small',   label: 'Jar Small' },
  { value: 'jar_medium',  label: 'Jar Medium' },
  { value: 'bottle',      label: 'Bottle' },
];

const DEFAULT_WEIGHTS = {
  normal_500g: 500, 
  normal_1kg: 1000,
  jar_small: 200, 
  jar_medium: 400, 
  bottle: 1000,
};

const PRODUCT_COLORS = {
  'Salted Banana Chips': '#f4c430',
  'Spicy Banana Chips':  '#f87171',
  'Sweet Banana Chips':  '#fb923c',
  '4 Cut Banana Chips':  '#52b788', // Updated Name Match
  'Jaggery':             '#c084fc',
};

const typeStyle = {
  normal_500g: { bg: 'rgba(244,196,48,0.1)',  color: '#f4c430',  border: 'rgba(244,196,48,0.2)'  },
  normal_1kg:  { bg: 'rgba(251,146,60,0.1)',  color: '#fb923c',  border: 'rgba(251,146,60,0.2)'  },
  jar_small:   { bg: 'rgba(59,130,246,0.1)',  color: '#60a5fa',  border: 'rgba(59,130,246,0.2)'  },
  jar_medium:  { bg: 'rgba(82,183,136,0.1)',  color: '#52b788',  border: 'rgba(82,183,136,0.2)'  },
  bottle:      { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8',  border: 'rgba(148,163,184,0.15)'},
};

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#e8f5ef',
  fontFamily: 'DM Sans, sans-serif',
  borderRadius: 12,
  padding: '12px 14px', 
  fontSize: 15, 
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.2s ease',
};

const emptyForm = {
  date: today(),
  product_type: PRODUCT_TYPES[0],
  packing_type: 'normal_500g', // Updated Default
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
    <div className="rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xl"
      style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: `1px solid ${color}25` }}>
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none"
        style={{ background: `${color}15`, filter: 'blur(20px)', transform: 'translate(30%,-30%)' }} />
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e8f5ef', fontSize: 15, lineHeight: 1.3 }}>
          {productType}
        </h3>
      </div>
      <div style={{ color, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, lineHeight: 1 }}>
        {totalUnits}
      </div>
      <div style={{ color: '#52b788', fontSize: 12, marginBottom: 14, marginTop: 4 }}>packets available</div>
      {Object.entries(byType).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(byType).map(([type, qty]) => {
            const ts = typeStyle[type];
            const label = PACKING_TYPES.find(t => t.value === type)?.label || type;
            return (
              <span key={type} className="px-2.5 py-1.5 rounded-lg text-xs"
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
  const [items, setItems] = useState([]);
  const [stockInfo, setStockInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterProduct, setFilterProduct] = useState('');
  const [viewMode, setViewMode] = useState('summary'); 

  const canManage = user?.role === 'manager' || user?.role === 'owner';

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      // Only fetches 'in_shop' items to display available inventory. 
      // Repacked items will be returned to bulk stock when handled via Supplier Return UI.
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-6 fade-up">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-6 md:h-8 rounded-full shrink-0" style={{ background: '#f4c430' }} />
                <h1 className="font-syne font-extrabold text-[24px] md:text-[28px] text-[#e8f5ef] tracking-tight">
                  Packed Items
                </h1>
              </div>
              <p className="text-[#52b788] text-[13px] pl-3.5 mt-1">
                Current packet inventory · Bulk stock deducted automatically
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {/* View toggle */}
              <div className="flex gap-1 p-1 rounded-xl w-full sm:w-auto bg-white/5 border border-white/10">
                {[{ id: 'summary', label: 'Summary' }, { id: 'daily', label: 'Daily Log' }].map(v => (
                  <button key={v.id} onClick={() => setViewMode(v.id)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95"
                    style={viewMode === v.id
                      ? { background: '#f4c430', color: '#0a1e14', fontFamily: 'Syne, sans-serif', fontWeight: 700 }
                      : { color: '#7fb89a', fontFamily: 'DM Sans, sans-serif' }}>
                    {v.label}
                  </button>
                ))}
              </div>
              {canManage && (
                <button onClick={() => setShowForm(!showForm)}
                  className="bg-[#f4c430] text-[#0a1e14] flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl text-sm font-bold shrink-0 active:scale-95 transition-transform font-syne shadow-lg">
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
            <div className="rounded-2xl p-4 sm:px-6 sm:py-5 mb-6 flex items-start sm:items-center justify-between flex-col md:flex-row gap-4 shadow-lg"
              style={{ background: 'linear-gradient(135deg, rgba(244,196,48,0.1), rgba(82,183,136,0.06))', border: '1px solid rgba(244,196,48,0.2)' }}>
              <div className="w-full md:w-auto border-b border-white/10 md:border-none pb-4 md:pb-0">
                <div style={{ color: '#52b788', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Available Packets</div>
                <div style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, lineHeight: 1.1, marginTop: 4 }}>{totalPackets}</div>
                <div style={{ color: '#52b788', fontSize: 13, marginTop: 2 }}>units across all products</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2 sm:gap-3 w-full md:w-auto">
                {PRODUCT_TYPES.map(pt => {
                  const count = items.filter(i => i.product_type === pt).reduce((s, i) => s + i.quantity, 0);
                  if (!count) return null;
                  const color = PRODUCT_COLORS[pt] || '#52b788';
                  return (
                    <div key={pt} className="text-center px-3 py-2.5 rounded-xl"
                      style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                      <div style={{ color, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18 }}>{count}</div>
                      <div style={{ color: '#7fb89a', fontSize: 10, marginTop: 2, whiteSpace: 'nowrap' }}>{pt.replace(' Banana Chips', '').replace(' Chips', '')}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Packed Form */}
          {showForm && canManage && (
            <div className="rounded-2xl p-4 sm:p-6 mb-6 fade-up shadow-2xl"
              style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(244,196,48,0.15)' }}>
              <h2 className="font-syne font-bold text-lg text-[#e8f5ef] mb-4">
                New Packing Entry
              </h2>

              {/* Stock check for selected product */}
              <div className="rounded-xl px-4 py-3.5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
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
                    <span className="block sm:inline mt-1 sm:mt-0 text-[#f87171] text-xs font-normal sm:ml-2">⚠ Insufficient!</span>
                  )}
                </span>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-[#52b788] mb-1.5 font-bold uppercase tracking-wider font-syne">Date</label>
                    <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#52b788] mb-1.5 font-bold uppercase tracking-wider font-syne">Product Type</label>
                    <select value={form.product_type} onChange={e => setForm({ ...form, product_type: e.target.value })} style={{ ...inputStyle, appearance: 'none' }}>
                      {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#52b788] mb-1.5 font-bold uppercase tracking-wider font-syne">Packing Type</label>
                    <select value={form.packing_type} onChange={e => handlePackingTypeChange(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
                      {PACKING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#52b788] mb-1.5 font-bold uppercase tracking-wider font-syne">Weight/Unit (g)</label>
                    <input type="number" required min="1" value={form.weight_per_unit_grams} placeholder="e.g. 500"
                      onChange={e => setForm({ ...form, weight_per_unit_grams: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#52b788] mb-1.5 font-bold uppercase tracking-wider font-syne">Quantity (units)</label>
                    <input type="number" required min="1" value={form.quantity} placeholder="e.g. 20"
                      onChange={e => setForm({ ...form, quantity: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#52b788] mb-1.5 font-bold uppercase tracking-wider font-syne">Label (optional)</label>
                    <input type="text" value={form.label} placeholder="e.g. 500g Masala"
                      onChange={e => setForm({ ...form, label: e.target.value })} style={inputStyle} />
                  </div>
                </div>

                {/* Preview */}
                {calcKgNeeded() > 0 && (
                  <div className="rounded-xl px-4 py-3 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    style={{
                      background: hasEnoughStock() ? 'rgba(82,183,136,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${hasEnoughStock() ? 'rgba(82,183,136,0.2)' : 'rgba(239,68,68,0.3)'}`
                    }}>
                    <div className="flex justify-between sm:block">
                      <span style={{ color: '#52b788', fontSize: 13 }}>Bulk stock needed: </span>
                      <span style={{ color: hasEnoughStock() ? '#52b788' : '#f87171', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>
                        {calcKgNeeded().toFixed(3)} kg
                      </span>
                    </div>
                    <div className="flex justify-between sm:block border-t border-white/5 pt-2 sm:pt-0 sm:border-none">
                      <span style={{ color: '#52b788', fontSize: 13 }}>Remaining After: </span>
                      <span style={{ color: hasEnoughStock() ? '#f4c430' : '#f87171', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>
                        {Math.max(0, getAvailableKg(form.product_type) - calcKgNeeded()).toFixed(3)} kg
                      </span>
                    </div>
                    {!hasEnoughStock() && (
                      <div className="mt-2 sm:mt-0 text-[#f87171] text-xs w-full sm:w-auto bg-red-500/10 p-2 rounded">
                        ⚠ Cannot proceed — insufficient bulk stock.
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button type="submit"
                    disabled={saving || !hasEnoughStock() || !form.quantity}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 sm:py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
                    style={{ background: '#f4c430', color: '#0a1e14', fontFamily: 'Syne, sans-serif' }}>
                    {saving
                      ? <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Saving…</>
                      : !hasEnoughStock() && form.quantity
                        ? '⚠ Insufficient Stock'
                        : 'Save Entry'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="w-full sm:w-auto px-6 py-3.5 sm:py-3 rounded-xl text-sm text-center border border-white/10 text-[#52b788] active:scale-95 transition-transform">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── SUMMARY VIEW ── */}
          {viewMode === 'summary' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-20 gap-3 bg-[#132d20]/50 rounded-2xl border border-white/5">
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                  <span style={{ color: '#52b788' }}>Loading summary…</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PRODUCT_TYPES.map(pt => {
                    const color = PRODUCT_COLORS[pt] || '#52b788';
                    const ptItems = byProduct[pt] || [];
                    const total = ptItems.reduce((s, i) => s + i.quantity, 0);
                    if (total === 0) return (
                      <div key={pt} className="rounded-2xl p-5"
                        style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.05)', opacity: 0.7 }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                          <span style={{ color: '#7fb89a', fontSize: 14, fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>{pt}</span>
                        </div>
                        <div style={{ color: '#2d6a4f', fontSize: 13 }}>0 packets in stock</div>
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
              {/* Product filter optimized for mobile swiping */}
              <div className="relative w-full mb-4 -mx-4 px-4 md:mx-0 md:px-0">
                <style>{`.filter-scroll::-webkit-scrollbar { display: none; } .filter-scroll { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
                <div className="flex overflow-x-auto gap-2 pb-2 w-full snap-x filter-scroll">
                  {[{ label: 'All', value: '' }, ...PRODUCT_TYPES.map(p => ({ label: p.replace(' Banana Chips', '').replace(' Chips', ''), value: p }))].map(opt => (
                    <button key={opt.value} onClick={() => setFilterProduct(opt.value)}
                      className="snap-start whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-medium transition-all border shrink-0 active:scale-95"
                      style={filterProduct === opt.value
                        ? { background: `${PRODUCT_COLORS[opt.value] || '#f4c430'}20`, color: PRODUCT_COLORS[opt.value] || '#f4c430', borderColor: `${PRODUCT_COLORS[opt.value] || '#f4c430'}40`, fontFamily: 'DM Sans, sans-serif' }
                        : { background: 'rgba(255,255,255,0.03)', color: '#7fb89a', borderColor: 'rgba(255,255,255,0.08)', fontFamily: 'DM Sans, sans-serif' }
                      }>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-20 flex items-center justify-center gap-3 bg-[#132d20]/50 rounded-2xl border border-white/5">
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                  <span className="text-[#52b788] text-sm">Loading logs...</span>
                </div>
              ) : dailyItems.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center bg-[#132d20]/50 rounded-2xl border border-white/5">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#52b788" strokeWidth="1.5" className="mb-4 opacity-50">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                  </svg>
                  <p className="text-[#52b788] font-syne font-semibold text-lg">No packed items found</p>
                  <p className="text-[#2d6a4f] text-sm mt-1">Add a packed entry above.</p>
                </div>
              ) : (
                <>
                  {/* --- DESKTOP TABLE VIEW --- */}
                  <div className="hidden md:block rounded-2xl overflow-hidden border border-white/5 shadow-xl" style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)' }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-black/20">
                          {['Date', 'Product', 'Label', 'Type', 'Wt/Unit', 'Qty', 'Total kg', ''].map((h, i) => (
                            <th key={i} className={`py-4 px-4 text-xs font-semibold uppercase tracking-widest ${[4,5,6].includes(i) ? 'text-right' : 'text-left'}`} style={{ color: '#52b788', fontFamily: 'Syne, sans-serif' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dailyItems.map((item, idx) => {
                          const ts = typeStyle[item.packing_type] || typeStyle.normal_500g;
                          const color = PRODUCT_COLORS[item.product_type] || '#52b788';
                          return (
                            <tr key={item._id} className="hover:bg-white/[0.03] transition-colors" style={{ borderBottom: idx < dailyItems.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                              <td className="px-4 py-4 whitespace-nowrap text-[#7fb89a] text-sm">
                                {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                                  <span className="text-[#e8f5ef] font-syne font-medium">{item.product_type}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-[#7fb89a] text-sm">{item.label || '—'}</td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="px-2.5 py-1.5 rounded-lg text-xs font-semibold font-syne" style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}>
                                  {PACKING_TYPES.find(t => t.value === item.packing_type)?.label || item.packing_type}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right text-[#7fb89a] text-sm">{item.weight_per_unit_grams}g</td>
                              <td className="px-4 py-4 text-right font-bold text-[#e8f5ef] font-syne text-[15px]">{item.quantity}</td>
                              <td className="px-4 py-4 text-right font-bold text-[#f4c430] font-syne">{item.total_weight_kg?.toFixed(3)}</td>
                              <td className="px-4 py-4 text-right">
                                {canManage && (
                                  <button onClick={() => handleDelete(item._id)} className="px-3 py-1.5 rounded-lg text-xs font-dm hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all border border-white/10 text-[#7fb89a]">
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

                  {/* --- MOBILE CARD VIEW --- */}
                  <div className="md:hidden flex flex-col gap-3">
                    {dailyItems.map(item => {
                      const ts = typeStyle[item.packing_type] || typeStyle.normal_500g;
                      const color = PRODUCT_COLORS[item.product_type] || '#52b788';
                      return (
                        <div key={item._id} className="rounded-xl p-4 border border-white/5 relative shadow-lg" style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)' }}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="font-syne font-bold text-[#e8f5ef] text-[15px] mb-2">
                                {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="flex flex-wrap gap-2 items-center">
                                <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/20 border border-white/5 text-xs text-[#e8f5ef] font-syne">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                                  {item.product_type.replace(' Banana Chips', '').replace(' Chips', '')}
                                </span>
                                <span className="px-2 py-1 rounded text-[11px] font-bold font-syne" style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}>
                                  {PACKING_TYPES.find(t => t.value === item.packing_type)?.label || item.packing_type}
                                </span>
                              </div>
                            </div>
                            {canManage && (
                              <button onClick={() => handleDelete(item._id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 active:scale-95 transition-transform shrink-0">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2 bg-black/20 rounded-xl p-3 mb-2 border border-white/5">
                            <div className="text-center">
                              <span className="block text-[10px] text-[#52b788] uppercase font-syne mb-1">Wt/Unit</span>
                              <span className="text-[#7fb89a] text-[13px] font-dm">{item.weight_per_unit_grams}g</span>
                            </div>
                            <div className="text-center border-l border-r border-white/5">
                              <span className="block text-[10px] text-[#52b788] uppercase font-syne mb-1">Quantity</span>
                              <span className="text-[#e8f5ef] text-sm font-bold font-syne">{item.quantity}</span>
                            </div>
                            <div className="text-center">
                              <span className="block text-[10px] text-[#f4c430] uppercase font-syne mb-1">Total (kg)</span>
                              <span className="text-[#f4c430] text-sm font-bold font-syne">{item.total_weight_kg?.toFixed(3)}</span>
                            </div>
                          </div>
                          
                          {item.label && (
                            <div className="mt-2 text-[13px] text-[#52b788] px-3 py-2 bg-[#0a1e14]/50 rounded-lg border border-white/5 flex items-center gap-2">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                              {item.label}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}