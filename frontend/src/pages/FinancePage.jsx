import { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { PRODUCT_TYPES } from './StockPage';
import { PACKING_TYPES } from './PackedPage';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line
} from 'recharts';

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
};

const PAYMENT_MODES = [
  { value: 'cash',   label: 'Cash'  },
  { value: 'upi',    label: 'UPI'   },
  { value: 'card',   label: 'Card'  },
  { value: 'credit', label: 'Credit'},
];

const PAYMENT_COLORS = { cash: '#f4c430', upi: '#60a5fa', card: '#c084fc', credit: '#fb923c' };
const PRODUCT_COLORS = {
  'Salted Banana Chips': '#f4c430',
  'Spicy Banana Chips':  '#f87171',
  'Sweet Banana Chips':  '#fb923c',
  'Banana 4 Cut':        '#52b788',
  'Jaggery':             '#c084fc',
};

const emptySaleItem = () => ({
  product_type: PRODUCT_TYPES[0],
  packing_type: 'normal_half_kg',
  weight_per_unit_grams: 500,
  quantity: 1,
  unit_price: ''
});

const DEFAULT_WEIGHTS = {
  normal_half_kg: 500, normal_1kg: 1000,
  jar_small: 200, jar_medium: 400, jar_large: 750, big_bottle: 1500,
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0d2b1e', border: '1px solid rgba(244,196,48,0.2)', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
      <p style={{ color: '#52b788', fontSize: 11, marginBottom: 4, fontFamily: 'Syne, sans-serif' }}>{label}</p>
      <p style={{ color: '#f4c430', fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>
        ₹{Number(payload[0].value).toFixed(0)}
      </p>
    </div>
  );
};

export default function FinancePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [summary, setSummary]       = useState(null);
  const [sales, setSales]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [dateRange, setDateRange]   = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to:   today()
  });

  const [saleForm, setSaleForm] = useState({
    date: today(),
    sale_type: 'shop',
    items: [emptySaleItem()],
    discount: '',
    payment_mode: 'cash',
    customer_name: '',
    notes: ''
  });

  const canManage = user?.role === 'manager' || user?.role === 'owner';

  const fetchSummary = useCallback(() => {
    api.get(`/sales/summary?from=${dateRange.from}&to=${dateRange.to}`)
      .then(r => setSummary(r.data))
      .catch(() => toast.error('Failed to load summary'));
  }, [dateRange]);

  const fetchSales = useCallback(() => {
    setLoading(true);
    api.get(`/sales?from=${dateRange.from}&to=${dateRange.to}`)
      .then(r => setSales(r.data))
      .catch(() => toast.error('Failed to load sales'))
      .finally(() => setLoading(false));
  }, [dateRange]);

  useEffect(() => { fetchSummary(); fetchSales(); }, [fetchSummary, fetchSales]);

  // Item helpers
  const addItem    = () => setSaleForm(f => ({ ...f, items: [...f.items, emptySaleItem()] }));
  const removeItem = (i) => setSaleForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, val) => {
    setSaleForm(f => {
      const items = [...f.items];
      items[i] = { ...items[i], [field]: val };
      if (field === 'packing_type') items[i].weight_per_unit_grams = DEFAULT_WEIGHTS[val] || 500;
      return { ...f, items };
    });
  };

  const calcSubtotal = () =>
    saleForm.items.reduce((s, item) => s + (Number(item.quantity) * Number(item.unit_price || 0)), 0);

  const calcTotal = () => Math.max(0, calcSubtotal() - Number(saleForm.discount || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = saleForm.items.filter(i => i.quantity > 0 && i.unit_price > 0);
    if (!validItems.length) { toast.error('Add at least one item with price'); return; }
    setSaving(true);
    try {
      await api.post('/sales', { ...saleForm, items: validItems });
      setShowSaleForm(false);
      setSaleForm({ date: today(), sale_type: 'shop', items: [emptySaleItem()], discount: '', payment_mode: 'cash', customer_name: '', notes: '' });
      fetchSummary();
      fetchSales();
      toast.success('Sale recorded!', `₹${calcTotal().toFixed(2)} sale saved.`);
    } catch (err) {
      toast.error('Save failed', err.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sale?')) return;
    try {
      await api.delete(`/sales/${id}`);
      fetchSummary();
      fetchSales();
      toast.warning('Sale deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#0a1e14' }}>
      <Sidebar />

      <main className="flex-1 min-w-0 md:ml-64 p-4 sm:p-6 md:p-8 pb-28 md:pb-8 w-full max-w-full overflow-x-hidden">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 fade-up">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-6 rounded-full" style={{ background: '#f4c430' }} />
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#e8f5ef', letterSpacing: '-0.02em' }}>
                  Finance
                </h1>
              </div>
              <p style={{ color: '#52b788', fontSize: 13, paddingLeft: 14 }}>Shop sales & revenue tracking</p>
            </div>
            {canManage && (
              <button onClick={() => setShowSaleForm(!showSaleForm)}
                className="cc-btn-primary w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  {showSaleForm ? (<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>) : (<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>)}
                </svg>
                {showSaleForm ? 'Cancel' : 'Record Sale'}
              </button>
            )}
          </div>

          {/* Date range filter */}
          <div className="flex flex-wrap gap-3 mb-6 items-center">
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ color: '#52b788', fontSize: 13 }}>From</span>
              <input type="date" value={dateRange.from} onChange={e => setDateRange(d => ({ ...d, from: e.target.value }))}
                style={{ ...inputStyle, width: 'auto', padding: '8px 12px', fontSize: 13 }} />
              <span style={{ color: '#52b788', fontSize: 13 }}>To</span>
              <input type="date" value={dateRange.to} onChange={e => setDateRange(d => ({ ...d, to: e.target.value }))}
                style={{ ...inputStyle, width: 'auto', padding: '8px 12px', fontSize: 13 }} />
            </div>
            <div className="flex gap-2">
              {[
                { label: 'Today',    fn: () => setDateRange({ from: today(), to: today() }) },
                { label: 'This Week', fn: () => {
                  const d = new Date(); const day = d.getDay();
                  const mon = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
                  setDateRange({ from: mon.toISOString().split('T')[0], to: today() });
                }},
                { label: 'This Month', fn: () => setDateRange({
                  from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                  to: today()
                })},
              ].map(btn => (
                <button key={btn.label} onClick={btn.fn}
                  className="px-3 py-2 rounded-lg text-xs font-medium"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#7fb89a', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'DM Sans, sans-serif' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,196,48,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Today's Revenue", value: `₹${(summary?.today_revenue || 0).toFixed(0)}`, sub: `${summary?.today_sales || 0} sales`, color: '#f4c430', accent: 'rgba(244,196,48,0.1)' },
              { label: 'Period Revenue',  value: `₹${(summary?.total_revenue || 0).toFixed(0)}`, sub: `${summary?.total_sales || 0} sales total`, color: '#52b788', accent: 'rgba(82,183,136,0.1)' },
              { label: 'Avg Sale Value',  value: summary?.total_sales ? `₹${((summary.total_revenue || 0) / summary.total_sales).toFixed(0)}` : '₹0', sub: 'per transaction', color: '#60a5fa', accent: 'rgba(96,165,250,0.1)' },
              { label: 'Top Product',     value: summary?.by_product?.[0]?._id?.split(' ')[0] || '—', sub: summary?.by_product?.[0] ? `₹${summary.by_product[0].total_revenue?.toFixed(0)}` : '', color: '#c084fc', accent: 'rgba(192,132,252,0.1)' },
            ].map(card => (
              <div key={card.label} className="rounded-2xl p-4 relative overflow-hidden"
                style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full pointer-events-none"
                  style={{ background: card.accent, filter: 'blur(20px)', transform: 'translate(30%,-30%)' }} />
                <div style={{ color: '#52b788', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  {card.label}
                </div>
                <div style={{ color: card.color, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22 }}>{card.value}</div>
                {card.sub && <div style={{ color: '#52b788', fontSize: 12, marginTop: 3 }}>{card.sub}</div>}
              </div>
            ))}
          </div>

          {/* Sale Form */}
          {showSaleForm && canManage && (
            <div className="rounded-2xl p-5 sm:p-6 mb-8 fade-up"
              style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(244,196,48,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#e8f5ef', marginBottom: 20 }}>
                New Sale Entry
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Date</label>
                    <input type="date" required value={saleForm.date} onChange={e => setSaleForm({ ...saleForm, date: e.target.value })} style={inputStyle} className="cc-input" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Payment</label>
                    <select value={saleForm.payment_mode} onChange={e => setSaleForm({ ...saleForm, payment_mode: e.target.value })}
                      style={{ ...inputStyle, appearance: 'none', color: PAYMENT_COLORS[saleForm.payment_mode] || '#e8f5ef' }}>
                      {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Customer</label>
                    <input type="text" placeholder="Walk-in / Name" value={saleForm.customer_name}
                      onChange={e => setSaleForm({ ...saleForm, customer_name: e.target.value })} style={inputStyle} className="cc-input" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Discount (₹)</label>
                    <input type="number" min="0" step="0.01" placeholder="0" value={saleForm.discount}
                      onChange={e => setSaleForm({ ...saleForm, discount: e.target.value })} style={inputStyle} className="cc-input" />
                  </div>
                </div>

                {/* Sale items */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <p style={{ color: '#52b788', fontSize: 12, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Items Sold</p>
                    <button type="button" onClick={addItem}
                      className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                      style={{ background: 'rgba(244,196,48,0.1)', color: '#f4c430', border: '1px solid rgba(244,196,48,0.2)' }}>
                      + Add Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {saleForm.items.map((item, i) => (
                      <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <select value={item.product_type} onChange={e => updateItem(i, 'product_type', e.target.value)}
                            style={{ ...inputStyle, padding: '8px 10px', fontSize: 13, appearance: 'none' }}>
                            {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <select value={item.packing_type} onChange={e => updateItem(i, 'packing_type', e.target.value)}
                            style={{ ...inputStyle, padding: '8px 10px', fontSize: 13, appearance: 'none' }}>
                            {PACKING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          <input type="number" min="1" placeholder="Qty" value={item.quantity}
                            onChange={e => updateItem(i, 'quantity', e.target.value)}
                            style={{ ...inputStyle, padding: '8px 10px', fontSize: 13 }} />
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#52b788' }}>₹</span>
                            <input type="number" min="0" step="0.01" placeholder="Price/unit" value={item.unit_price}
                              onChange={e => updateItem(i, 'unit_price', e.target.value)}
                              style={{ ...inputStyle, padding: '8px 10px', paddingLeft: 24, fontSize: 13 }} />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
                              = ₹{(Number(item.quantity) * Number(item.unit_price || 0)).toFixed(0)}
                            </span>
                            {saleForm.items.length > 1 && (
                              <button type="button" onClick={() => removeItem(i)}
                                className="px-2 py-1.5 rounded-lg text-xs shrink-0"
                                style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total preview */}
                <div className="rounded-xl px-5 py-4 mb-5 flex items-center justify-between"
                  style={{ background: 'rgba(244,196,48,0.08)', border: '1px solid rgba(244,196,48,0.2)' }}>
                  <div>
                    <div className="flex gap-4 text-sm" style={{ color: '#52b788' }}>
                      <span>Subtotal: <strong style={{ color: '#e8f5ef' }}>₹{calcSubtotal().toFixed(2)}</strong></span>
                      {saleForm.discount > 0 && <span>Discount: <strong style={{ color: '#f87171' }}>-₹{Number(saleForm.discount).toFixed(2)}</strong></span>}
                    </div>
                  </div>
                  <div style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24 }}>
                    ₹{calcTotal().toFixed(2)}
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button type="button" onClick={() => setShowSaleForm(false)}
                    className="px-6 py-3 rounded-xl text-sm w-full sm:w-auto"
                    style={{ color: '#52b788', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'DM Sans, sans-serif' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="cc-btn-primary flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm w-full sm:w-auto">
                    {saving ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> : null}
                    Save Sale
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Revenue chart */}
          {summary?.daily_trend?.length > 0 && (
            <div className="rounded-2xl p-5 md:p-6 mb-6"
              style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#e8f5ef', marginBottom: 4 }}>Revenue Trend</h2>
              <p style={{ color: '#52b788', fontSize: 12, marginBottom: 20 }}>Last 30 days daily revenue</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={summary.daily_trend} barSize={16} margin={{ left: -20, right: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    tick={{ fontSize: 10, fill: '#52b788' }} axisLine={false} tickLine={false} dy={8} />
                  <YAxis tick={{ fontSize: 10, fill: '#52b788' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `₹${v}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(244,196,48,0.04)' }} />
                  <Bar dataKey="revenue" fill="url(#finGrad)" radius={[4,4,0,0]} />
                  <defs>
                    <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#f4c430" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#e9a800" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Analytics grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* By product */}
            {summary?.by_product?.length > 0 && (
              <div className="rounded-2xl p-5"
                style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e8f5ef', fontSize: 14, marginBottom: 16 }}>Revenue by Product</h3>
                <div className="space-y-3">
                  {summary.by_product.map(p => {
                    const maxRev = summary.by_product[0]?.total_revenue || 1;
                    const pct = (p.total_revenue / maxRev) * 100;
                    const color = PRODUCT_COLORS[p._id] || '#52b788';
                    return (
                      <div key={p._id}>
                        <div className="flex justify-between items-center mb-1">
                          <span style={{ color: '#95d5b2', fontSize: 12 }}>{p._id}</span>
                          <div className="text-right">
                            <span style={{ color, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14 }}>₹{p.total_revenue?.toFixed(0)}</span>
                            <span style={{ color: '#52b788', fontSize: 11, marginLeft: 6 }}>{p.total_units} units</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* By payment mode */}
            {summary?.by_payment?.length > 0 && (
              <div className="rounded-2xl p-5"
                style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e8f5ef', fontSize: 14, marginBottom: 16 }}>Payment Modes</h3>
                <div className="space-y-3">
                  {summary.by_payment.map(p => {
                    const color = PAYMENT_COLORS[p._id] || '#52b788';
                    const total = summary.total_revenue || 1;
                    const pct   = (p.total / total) * 100;
                    return (
                      <div key={p._id}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="capitalize" style={{ color: '#95d5b2', fontSize: 12 }}>{p._id}</span>
                          <div className="text-right">
                            <span style={{ color, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14 }}>₹{p.total?.toFixed(0)}</span>
                            <span style={{ color: '#52b788', fontSize: 11, marginLeft: 6 }}>{p.count} sales</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sales table */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e8f5ef', fontSize: 14 }}>
                Sales History · {sales.length} records
              </h3>
            </div>
            <div className="overflow-x-auto custom-scroll">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Date','Customer','Items','Payment','Discount','Total',''].map((h, i) => (
                      <th key={i}
                        className={`py-3 px-4 text-xs font-semibold uppercase tracking-widest whitespace-nowrap ${[4,5].includes(i) ? 'text-right' : 'text-left'}`}
                        style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', background: 'rgba(0,0,0,0.15)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-16">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                        <span style={{ color: '#52b788' }}>Loading…</span>
                      </div>
                    </td></tr>
                  ) : sales.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-20">
                      <div className="flex flex-col items-center">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#52b788" strokeWidth="1.5" className="mb-4 opacity-60">
                          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                        </svg>
                        <p style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>No sales in this period</p>
                        <p style={{ color: '#2d6a4f', fontSize: 13, marginTop: 4 }}>Record your first sale using the button above.</p>
                      </div>
                    </td></tr>
                  ) : sales.map((sale, idx) => {
                    const pmColor = PAYMENT_COLORS[sale.payment_mode] || '#52b788';
                    return (
                      <tr key={sale._id} className="table-row"
                        style={{ borderBottom: idx < sales.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <td className="px-4 py-4 whitespace-nowrap" style={{ color: '#e8f5ef', fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 13 }}>
                          {new Date(sale.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap" style={{ color: '#7fb89a', fontSize: 13 }}>
                          {sale.customer_name || 'Walk-in'}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {sale.items.slice(0, 3).map((item, i) => (
                              <span key={i} className="px-2 py-0.5 rounded text-xs"
                                style={{ background: `${PRODUCT_COLORS[item.product_type] || '#52b788'}15`, color: PRODUCT_COLORS[item.product_type] || '#52b788', fontFamily: 'Syne, sans-serif', fontSize: 11 }}>
                                {item.quantity}× {PACKING_TYPES.find(t => t.value === item.packing_type)?.label}
                              </span>
                            ))}
                            {sale.items.length > 3 && <span style={{ color: '#52b788', fontSize: 11 }}>+{sale.items.length - 3} more</span>}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold capitalize"
                            style={{ background: `${pmColor}15`, color: pmColor, border: `1px solid ${pmColor}30`, fontFamily: 'Syne, sans-serif' }}>
                            {sale.payment_mode}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap" style={{ color: sale.discount > 0 ? '#f87171' : '#2d6a4f', fontSize: 13 }}>
                          {sale.discount > 0 ? `-₹${sale.discount.toFixed(0)}` : '—'}
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <span style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16 }}>
                            ₹{sale.total_amount?.toFixed(0)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          {canManage && (
                            <button onClick={() => handleDelete(sale._id)}
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

        </div>
      </main>
    </div>
  );
}