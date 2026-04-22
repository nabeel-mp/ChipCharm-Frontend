import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { PRODUCT_TYPES } from './StockPage';

const today = () => new Date().toISOString().split('T')[0];

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

const PRODUCT_COLORS = {
  'Salted Banana Chips': '#f4c430',
  'Spicy Banana Chips':  '#f87171',
  'Sweet Banana Chips':  '#fb923c',
  'Banana 4 Cut':        '#52b788',
  'Jaggery':             '#c084fc',
};

const emptyForm = {
  date: today(),
  product_type: PRODUCT_TYPES[0],
  boxes_packed: '',
  units_per_box: 18,
  weight_per_unit_grams: 500,
  notes: ''
};

export default function BoxesPage() {
  const { user } = useAuth();
  const toast    = useToast();
  const [boxes,      setBoxes]     = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [showForm,   setShowForm]  = useState(false);
  const [form,       setForm]      = useState(emptyForm);
  const [saving,     setSaving]    = useState(false);
  const [stockInfo,  setStockInfo] = useState([]);
  const [filterType, setFilterType] = useState('');

  const canManage = user?.role === 'manager' || user?.role === 'owner';

  const fetchBoxes = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.append('product_type', filterType);
    api.get(`/boxes?${params}`)
      .then(r => setBoxes(r.data))
      .catch(() => toast.error('Fetch failed', 'Could not load boxes.'))
      .finally(() => setLoading(false));
  };

  const fetchStock = () => {
    api.get('/packed/available-stock')
      .then(r => setStockInfo(r.data))
      .catch(() => {});
  };

  useEffect(() => { fetchBoxes(); fetchStock(); }, [filterType]);

  const getAvailable = (pt) =>
    stockInfo.find(s => s.product_type === pt)?.available_kg ?? 0;

  const calcKg = () => {
    if (!form.boxes_packed || !form.units_per_box || !form.weight_per_unit_grams) return 0;
    return (Number(form.boxes_packed) * Number(form.units_per_box) * Number(form.weight_per_unit_grams)) / 1000;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/boxes', form);
      setShowForm(false);
      setForm(emptyForm);
      fetchBoxes();
      fetchStock();
      toast.success(
        'Boxes packed!',
        `${form.boxes_packed} boxes × ${form.units_per_box} units — ${res.data.total_weight_kg?.toFixed(2)} kg deducted from stock.`
      );
    } catch (err) {
      toast.error('Pack failed', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this box entry? Stock will be restored.')) return;
    try {
      const res = await api.delete(`/boxes/${id}`);
      fetchBoxes();
      fetchStock();
      toast.warning('Box deleted', `${res.data.stock_restored_kg?.toFixed(3)} kg restored to stock.`);
    } catch {
      toast.error('Delete failed');
    }
  };

  const totalBoxes  = boxes.reduce((s, b) => s + b.boxes_packed, 0);
  const totalUnits  = boxes.reduce((s, b) => s + b.total_units, 0);
  const totalWeightKg = boxes.reduce((s, b) => s + b.total_weight_kg, 0);

  return (
    <div className="flex min-h-screen" style={{ background: '#0a1e14' }}>
      <Sidebar />
      <main className="flex-1 min-w-0 md:ml-64 p-4 sm:p-6 md:p-8 pb-28 md:pb-8 w-full max-w-full overflow-x-hidden">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 fade-up">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-6 rounded-full" style={{ background: '#fb923c' }} />
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#e8f5ef', letterSpacing: '-0.02em' }}>
                  Box Packing
                </h1>
              </div>
              <p style={{ color: '#52b788', fontSize: 13, paddingLeft: 14 }}>Each box = {form.units_per_box} × {form.weight_per_unit_grams}g packs · Stock auto-deducted</p>
            </div>
            {canManage && (
              <button onClick={() => setShowForm(!showForm)}
                className="cc-btn-primary w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  {showForm ? (<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>) : (<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>)}
                </svg>
                {showForm ? 'Cancel' : 'Pack Boxes'}
              </button>
            )}
          </div>

          {/* Stock overview cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {stockInfo.map(s => {
              const color = PRODUCT_COLORS[s.product_type] || '#52b788';
              const low = s.available_kg < 5;
              return (
                <div key={s.product_type} className="rounded-xl p-3 relative overflow-hidden"
                  style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: `1px solid ${low ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                  <div className="text-[11px] mb-2 leading-tight" style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>
                    {s.product_type.replace(' Banana Chips', '').replace(' Chips', '')}
                  </div>
                  <div style={{ color: low ? '#f87171' : color, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18 }}>
                    {s.available_kg.toFixed(1)}
                  </div>
                  <div style={{ color: '#52b788', fontSize: 11 }}>kg available</div>
                  {low && <div className="text-[10px] mt-1 font-semibold" style={{ color: '#f87171' }}>⚠ Low stock</div>}
                </div>
              );
            })}
          </div>

          {/* Summary stats */}
          {boxes.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Boxes', value: totalBoxes,             unit: 'boxes', color: '#f4c430' },
                { label: 'Total Units', value: totalUnits,             unit: 'packs', color: '#52b788' },
                { label: 'Total Weight', value: totalWeightKg.toFixed(1), unit: 'kg',    color: '#60a5fa' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-4"
                  style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ color: '#52b788', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span style={{ color: s.color, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24 }}>{s.value}</span>
                    <span style={{ color: '#52b788', fontSize: 12 }}>{s.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form */}
          {showForm && canManage && (
            <div className="rounded-2xl p-5 sm:p-6 mb-8 fade-up"
              style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(251,146,60,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#e8f5ef', marginBottom: 20 }}>
                New Box Packing Entry
              </h2>

              {/* Available stock for selected product */}
              <div className="rounded-xl px-4 py-3 mb-5 flex items-center justify-between flex-wrap gap-2"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#52b788', fontSize: 13 }}>
                  Available stock for <strong style={{ color: '#e8f5ef' }}>{form.product_type}</strong>:
                </span>
                <span style={{ color: getAvailable(form.product_type) < calcKg() ? '#f87171' : '#52b788', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>
                  {getAvailable(form.product_type).toFixed(2)} kg
                  {getAvailable(form.product_type) < calcKg() && calcKg() > 0 && (
                    <span style={{ color: '#f87171', fontSize: 12, fontWeight: 400, marginLeft: 8 }}>⚠ Insufficient!</span>
                  )}
                </span>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Date</label>
                    <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="cc-input" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Product Type</label>
                    <select value={form.product_type} onChange={e => setForm({ ...form, product_type: e.target.value })} className="cc-input" style={{ ...inputStyle, appearance: 'none' }}>
                      {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Number of Boxes</label>
                    <input type="number" required min="1" value={form.boxes_packed} placeholder="e.g. 5"
                      onChange={e => setForm({ ...form, boxes_packed: e.target.value })} className="cc-input" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Units Per Box</label>
                    <input type="number" required min="1" value={form.units_per_box}
                      onChange={e => setForm({ ...form, units_per_box: Number(e.target.value) })} className="cc-input" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Weight/Unit (g)</label>
                    <input type="number" required min="1" value={form.weight_per_unit_grams}
                      onChange={e => setForm({ ...form, weight_per_unit_grams: Number(e.target.value) })} className="cc-input" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Notes</label>
                    <input type="text" value={form.notes} placeholder="Optional notes..."
                      onChange={e => setForm({ ...form, notes: e.target.value })} className="cc-input" style={inputStyle} />
                  </div>
                </div>

                {/* Preview */}
                {form.boxes_packed > 0 && (
                  <div className="rounded-xl px-4 py-3 mb-5 grid grid-cols-3 gap-4"
                    style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}>
                    {[
                      { label: 'Total Units', value: `${Number(form.boxes_packed) * Number(form.units_per_box)} packs` },
                      { label: 'Total Weight', value: `${calcKg().toFixed(3)} kg` },
                      { label: 'Stock After', value: `${Math.max(0, getAvailable(form.product_type) - calcKg()).toFixed(2)} kg` },
                    ].map(p => (
                      <div key={p.label} className="text-center">
                        <div style={{ color: '#52b788', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>{p.label}</div>
                        <div style={{ color: '#fb923c', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, marginTop: 2 }}>{p.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-6 py-3 rounded-xl text-sm font-medium w-full sm:w-auto text-center"
                    style={{ color: '#52b788', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'DM Sans, sans-serif' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving || calcKg() > getAvailable(form.product_type)}
                    className="cc-btn-primary flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-medium w-full sm:w-auto">
                    {saving ? (<><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Saving…</>) : 'Pack Boxes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filter pills */}
          <div className="flex overflow-x-auto gap-2 pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
            {[{ label: 'All Products', value: '' }, ...PRODUCT_TYPES.map(p => ({ label: p, value: p }))].map(opt => {
              const isActive = filterType === opt.value;
              const col = opt.value ? PRODUCT_COLORS[opt.value] : null;
              return (
                <button key={opt.value} onClick={() => setFilterType(opt.value)}
                  className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border shrink-0"
                  style={isActive && col
                    ? { background: `${col}15`, color: col, borderColor: `${col}40`, fontFamily: 'DM Sans, sans-serif' }
                    : isActive
                      ? { background: '#f4c430', color: '#0a1e14', borderColor: '#f4c430', fontFamily: 'DM Sans, sans-serif' }
                      : { background: 'rgba(255,255,255,0.03)', color: '#7fb89a', borderColor: 'rgba(255,255,255,0.08)', fontFamily: 'DM Sans, sans-serif' }
                  }>
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="rounded-2xl overflow-x-auto custom-scroll"
            style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Date','Product','Boxes','Units/Box','Wt/Unit','Total Units','Total kg','Notes',''].map((h, i) => (
                    <th key={i}
                      className={`py-4 px-4 text-xs font-semibold uppercase tracking-widest whitespace-nowrap ${[2,4,5,6].includes(i) ? 'text-right' : 'text-left'}`}
                      style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', background: 'rgba(0,0,0,0.15)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-16">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                      <span style={{ color: '#52b788' }}>Loading…</span>
                    </div>
                  </td></tr>
                ) : boxes.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-20">
                    <div className="flex flex-col items-center">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#52b788" strokeWidth="1.5" className="mb-4 opacity-60">
                        <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
                      </svg>
                      <p style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>No box entries yet</p>
                      <p style={{ color: '#2d6a4f', fontSize: 13, marginTop: 4 }}>Record your daily box packing above.</p>
                    </div>
                  </td></tr>
                ) : boxes.map((box, idx) => {
                  const color = PRODUCT_COLORS[box.product_type] || '#52b788';
                  return (
                    <tr key={box._id} className="table-row"
                      style={{ borderBottom: idx < boxes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td className="px-4 py-4 whitespace-nowrap" style={{ color: '#e8f5ef', fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 13 }}>
                        {new Date(box.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: `${color}18`, color, border: `1px solid ${color}40`, fontFamily: 'Syne, sans-serif' }}>
                          {box.product_type}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right" style={{ color: '#fb923c', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20 }}>
                        {box.boxes_packed}
                      </td>
                      <td className="px-4 py-4 text-left" style={{ color: '#7fb89a', fontSize: 13 }}>{box.units_per_box}</td>
                      <td className="px-4 py-4 text-right" style={{ color: '#7fb89a', fontSize: 13 }}>{box.weight_per_unit_grams}g</td>
                      <td className="px-4 py-4 text-right font-bold" style={{ color: '#e8f5ef', fontFamily: 'Syne, sans-serif' }}>{box.total_units}</td>
                      <td className="px-4 py-4 text-right font-bold" style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif' }}>{box.total_weight_kg?.toFixed(3)}</td>
                      <td className="px-4 py-4" style={{ color: '#2d6a4f', fontSize: 12 }}>{box.notes || '—'}</td>
                      <td className="px-4 py-4 text-right">
                        {canManage && (
                          <button onClick={() => handleDelete(box._id)}
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
      </main>
    </div>
  );
}