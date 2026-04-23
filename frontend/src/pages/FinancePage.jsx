import { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { PRODUCT_TYPES } from './StockPage';
import { PACKING_TYPES } from './PackedPage';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const today = () => new Date().toISOString().split('T')[0];

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

// SVG Icons
const Icons = {
  Factory: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></svg>,
  Store: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>,
  Bag: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
};

const PAYMENT_MODES = [
  { value: 'cash',   label: 'Cash'   },
  { value: 'upi',    label: 'UPI'    },
  { value: 'card',   label: 'Card'   },
  { value: 'credit', label: 'Credit' },
];

const PAYMENT_COLORS = { cash: '#f4c430', upi: '#60a5fa', card: '#c084fc', credit: '#fb923c' };
const PRODUCT_COLORS = {
  'Salted Banana Chips': '#f4c430',
  'Spicy Banana Chips':  '#f87171',
  'Sweet Banana Chips':  '#fb923c',
  'Banana 4 Cut':        '#52b788',
  'Jaggery':             '#c084fc',
};

const DEFAULT_WEIGHTS = {
  normal_half_kg: 500, normal_1kg: 1000,
  jar_small: 200, jar_medium: 400, jar_large: 750, big_bottle: 1500,
};

const WEIGHT_PRESETS = [100, 200, 250, 400, 500, 750, 1000, 1500, 2000];

const emptySaleItem = () => ({
  product_type: PRODUCT_TYPES[0],
  packing_type: 'normal_half_kg',
  weight_per_unit_grams: 500,
  custom_weight: false,
  quantity: 1,
  unit_price: ''
});

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

// ── Sale Item Row ─────────────────────────────────────────────────────────────
function SaleItemRow({ item, idx, onUpdate, onRemove, showRemove, accentColor }) {
  const handlePackingChange = (val) => {
    onUpdate(idx, 'packing_type', val);
    if (!item.custom_weight) {
      onUpdate(idx, 'weight_per_unit_grams', DEFAULT_WEIGHTS[val] || 500);
    }
  };

  const totalPrice = Number(item.quantity) * Number(item.unit_price || 0);

  return (
    <div className="rounded-xl p-4 shadow-lg mb-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Row 1: Product + Packing */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select value={item.product_type} onChange={e => onUpdate(idx, 'product_type', e.target.value)}
          className="flex-1 outline-none" style={{ ...inputStyle, appearance: 'none' }}>
          {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={item.packing_type} onChange={e => handlePackingChange(e.target.value)}
          className="flex-1 outline-none" style={{ ...inputStyle, appearance: 'none' }}>
          {PACKING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Row 2: Weight + Qty + Price + Total */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 items-end">
        {/* Weight field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label style={{ fontSize: 10, color: accentColor, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>
              Weight (g)
            </label>
            <button type="button" onClick={() => onUpdate(idx, 'custom_weight', !item.custom_weight)}
              style={{ fontSize: 10, color: item.custom_weight ? '#f4c430' : '#52b788', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>
              {item.custom_weight ? '✏ Custom' : 'Preset ▾'}
            </button>
          </div>
          {item.custom_weight ? (
            <input type="number" min="1" placeholder="e.g. 300" value={item.weight_per_unit_grams}
              onChange={e => onUpdate(idx, 'weight_per_unit_grams', Number(e.target.value))}
              style={{ ...inputStyle, color: '#f4c430', fontWeight: 700 }} />
          ) : (
            <select value={item.weight_per_unit_grams} onChange={e => onUpdate(idx, 'weight_per_unit_grams', Number(e.target.value))}
              style={{ ...inputStyle, appearance: 'none', color: '#f4c430', fontWeight: 700 }}>
              {WEIGHT_PRESETS.map(w => (
                <option key={w} value={w}>{w}g {w === 500 ? '(½kg)' : w === 1000 ? '(1kg)' : ''}</option>
              ))}
            </select>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label style={{ display: 'block', fontSize: 10, color: accentColor, marginBottom: 6, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>
            Qty
          </label>
          <input type="number" min="1" placeholder="Qty" value={item.quantity}
            onChange={e => onUpdate(idx, 'quantity', e.target.value)} style={inputStyle} />
        </div>

        {/* Price */}
        <div>
          <label style={{ display: 'block', fontSize: 10, color: accentColor, marginBottom: 6, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>
            Price/Unit
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: '#52b788' }}>₹</span>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={item.unit_price}
              onChange={e => onUpdate(idx, 'unit_price', e.target.value)}
              style={{ ...inputStyle, paddingLeft: 26 }} />
          </div>
        </div>

        {/* Total + Remove */}
        <div>
          <label style={{ display: 'block', fontSize: 10, color: accentColor, marginBottom: 6, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>
            Total
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 py-[11px] rounded-xl text-center" style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}20` }}>
              <span style={{ color: accentColor, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>
                ₹{totalPrice.toFixed(0)}
              </span>
            </div>
            {showRemove && (
              <button type="button" onClick={() => onRemove(idx)}
                className="p-[11px] rounded-xl text-xs shrink-0 active:scale-95 transition-transform flex items-center justify-center"
                style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>
                <Icons.Trash />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <span style={{ color: '#52b788', fontSize: 12 }}>
          {item.weight_per_unit_grams}g × {item.quantity} = {((item.weight_per_unit_grams * Number(item.quantity)) / 1000).toFixed(3)} kg
        </span>
      </div>
    </div>
  );
}

// ── Counter Daily Sale Form ───────────────────────────────────────────────────
function CounterSaleForm({ counters, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    date: today(), counter_name: counters[0]?.name || '',
    items: [emptySaleItem()], discount: '', payment_mode: 'cash', notes: '',
  });

  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, emptySaleItem()] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, val) => {
    setForm(f => {
      const items = [...f.items];
      items[i] = { ...items[i], [field]: val };
      if (field === 'packing_type' && !items[i].custom_weight) {
        items[i].weight_per_unit_grams = DEFAULT_WEIGHTS[val] || 500;
      }
      return { ...f, items };
    });
  };

  const calcSubtotal = () => form.items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unit_price || 0)), 0);
  const calcTotal    = () => Math.max(0, calcSubtotal() - Number(form.discount || 0));

  const handleSubmit = (e) => {
    e.preventDefault();
    const validItems = form.items
      .filter(i => i.quantity > 0 && i.unit_price > 0)
      .map(({ custom_weight, ...rest }) => ({
        ...rest, weight_per_unit_grams: Number(rest.weight_per_unit_grams) || 500,
        quantity: Number(rest.quantity), unit_price: Number(rest.unit_price),
      }));
    if (!validItems.length) return;
    onSave({ ...form, items: validItems, sale_type: 'counter', customer_name: form.counter_name });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-xs text-[#60a5fa] mb-2 font-syne font-bold uppercase tracking-wider">Date</label>
          <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs text-[#60a5fa] mb-2 font-syne font-bold uppercase tracking-wider">Counter / Shop</label>
          {counters.length > 0 ? (
            <select value={form.counter_name} onChange={e => setForm({ ...form, counter_name: e.target.value })} style={{ ...inputStyle, appearance: 'none' }}>
              {counters.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          ) : (
            <input type="text" required placeholder="Counter/Shop name" value={form.counter_name} onChange={e => setForm({ ...form, counter_name: e.target.value })} style={inputStyle} />
          )}
        </div>
        <div>
          <label className="block text-xs text-[#60a5fa] mb-2 font-syne font-bold uppercase tracking-wider">Payment</label>
          <select value={form.payment_mode} onChange={e => setForm({ ...form, payment_mode: e.target.value })}
            style={{ ...inputStyle, appearance: 'none', color: PAYMENT_COLORS[form.payment_mode] || '#e8f5ef' }}>
            {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#60a5fa] mb-2 font-syne font-bold uppercase tracking-wider">Discount (₹)</label>
          <input type="number" min="0" step="0.01" placeholder="0" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} style={inputStyle} />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[12px] text-[#60a5fa] font-syne font-bold uppercase tracking-widest">Items Sold</p>
          <button type="button" onClick={addItem} className="text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold active:scale-95 transition-transform"
            style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
            <Icons.Plus /> Add Item
          </button>
        </div>
        <div className="space-y-4">
          {form.items.map((item, i) => (
            <SaleItemRow key={i} item={item} idx={i} onUpdate={updateItem} onRemove={removeItem} showRemove={form.items.length > 1} accentColor="#60a5fa" />
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg"
        style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)' }}>
        <div className="flex gap-4 text-[15px] text-[#52b788] w-full sm:w-auto justify-between sm:justify-start">
          <span>Subtotal: <strong className="text-[#e8f5ef]">₹{calcSubtotal().toFixed(2)}</strong></span>
          {form.discount > 0 && <span>Disc: <strong className="text-[#f87171]">-₹{Number(form.discount).toFixed(2)}</strong></span>}
        </div>
        <div className="text-[#60a5fa] font-syne font-bold text-3xl w-full sm:w-auto text-right">
          ₹{calcTotal().toFixed(2)}
        </div>
      </div>

      <div className="mb-6">
        <input type="text" placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={inputStyle} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button type="button" onClick={onCancel} className="w-full sm:flex-1 py-3.5 sm:py-3 rounded-xl text-sm font-bold text-center border border-white/10 text-[#52b788] active:scale-95 transition-transform">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform"
          style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', fontFamily: 'Syne, sans-serif' }}>
          {saving ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> : null}
          Save Counter Sale
        </button>
      </div>
    </form>
  );
}

// ── Factory Direct Sale Form ──────────────────────────────────────────────────
function FactorySaleForm({ onSave, onCancel, saving, saleType = 'factory' }) {
  const [form, setForm] = useState({
    date: today(), customer_name: '', items: [emptySaleItem()], discount: '', payment_mode: 'cash', notes: '',
  });

  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, emptySaleItem()] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, val) => {
    setForm(f => {
      const items = [...f.items];
      items[i] = { ...items[i], [field]: val };
      if (field === 'packing_type' && !items[i].custom_weight) {
        items[i].weight_per_unit_grams = DEFAULT_WEIGHTS[val] || 500;
      }
      return { ...f, items };
    });
  };

  const calcSubtotal = () => form.items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unit_price || 0)), 0);
  const calcTotal    = () => Math.max(0, calcSubtotal() - Number(form.discount || 0));

  const handleSubmit = (e) => {
    e.preventDefault();
    const validItems = form.items
      .filter(i => Number(i.quantity) > 0 && Number(i.unit_price) > 0)
      .map(({ custom_weight, ...rest }) => ({
        ...rest, weight_per_unit_grams: Number(rest.weight_per_unit_grams) || 500,
        quantity: Number(rest.quantity), unit_price: Number(rest.unit_price),
      }));
    if (!validItems.length) return;
    onSave({ ...form, items: validItems, sale_type: saleType });
  };

  const accentColor = saleType === 'shop' ? '#c084fc' : '#52b788';

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-xs mb-2 font-syne font-bold uppercase tracking-wider" style={{ color: accentColor }}>Date</label>
          <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs mb-2 font-syne font-bold uppercase tracking-wider" style={{ color: accentColor }}>Customer Name</label>
          <input type="text" placeholder="Walk-in / Name" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs mb-2 font-syne font-bold uppercase tracking-wider" style={{ color: accentColor }}>Payment</label>
          <select value={form.payment_mode} onChange={e => setForm({ ...form, payment_mode: e.target.value })}
            style={{ ...inputStyle, appearance: 'none', color: PAYMENT_COLORS[form.payment_mode] || '#e8f5ef' }}>
            {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-2 font-syne font-bold uppercase tracking-wider" style={{ color: accentColor }}>Discount (₹)</label>
          <input type="number" min="0" step="0.01" placeholder="0" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} style={inputStyle} />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[12px] font-syne font-bold uppercase tracking-widest leading-none" style={{ color: accentColor }}>Items Sold</p>
            <p className="text-[10px] text-[#52b788] mt-1 hidden sm:block">Set any weight (grams) per item</p>
          </div>
          <button type="button" onClick={addItem} className="text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold active:scale-95 transition-transform"
            style={{ background: `${accentColor}10`, color: accentColor, border: `1px solid ${accentColor}30` }}>
            <Icons.Plus /> Add Item
          </button>
        </div>
        <div className="space-y-4">
          {form.items.map((item, i) => (
            <SaleItemRow key={i} item={item} idx={i} onUpdate={updateItem} onRemove={removeItem} showRemove={form.items.length > 1} accentColor={accentColor} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg"
        style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}>
        <div className="flex gap-4 text-[15px] text-[#52b788] w-full sm:w-auto justify-between sm:justify-start">
          <span>Subtotal: <strong className="text-[#e8f5ef]">₹{calcSubtotal().toFixed(2)}</strong></span>
          {form.discount > 0 && <span>Disc: <strong className="text-[#f87171]">-₹{Number(form.discount).toFixed(2)}</strong></span>}
        </div>
        <div className="font-syne font-bold text-3xl w-full sm:w-auto text-right" style={{ color: accentColor }}>
          ₹{calcTotal().toFixed(2)}
        </div>
      </div>

      <div className="mb-6">
        <input type="text" placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={inputStyle} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button type="button" onClick={onCancel} className="w-full sm:flex-1 py-3.5 sm:py-3 rounded-xl text-sm font-bold text-center border border-white/10 text-[#52b788] active:scale-95 transition-transform">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform"
          style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}30`, fontFamily: 'Syne, sans-serif' }}>
          {saving ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> : null}
          Save Sale
        </button>
      </div>
    </form>
  );
}

// ── Main Finance Page ─────────────────────────────────────────────────────────
export default function FinancePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [summary, setSummary]         = useState(null);
  const [sales, setSales]             = useState([]);
  const [counters, setCounters]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [activeForm, setActiveForm]   = useState(null);
  const [saleTypeFilter, setSaleTypeFilter] = useState('');
  const [dateRange, setDateRange]     = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: today()
  });

  const canManage = user?.role === 'manager' || user?.role === 'owner';

  const fetchSummary = useCallback(() => {
    api.get(`/sales/summary?from=${dateRange.from}&to=${dateRange.to}`)
      .then(r => setSummary(r.data))
      .catch(() => toast.error('Failed to load summary'));
  }, [dateRange]);

  const fetchSales = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ from: dateRange.from, to: dateRange.to });
    if (saleTypeFilter) params.append('sale_type', saleTypeFilter);
    api.get(`/sales?${params}`)
      .then(r => setSales(r.data))
      .catch(() => toast.error('Failed to load sales'))
      .finally(() => setLoading(false));
  }, [dateRange, saleTypeFilter]);

  const fetchCounters = useCallback(() => {
    api.get('/counters').then(r => setCounters(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchSummary(); fetchSales(); fetchCounters(); }, [fetchSummary, fetchSales, fetchCounters]);

  const handleSaveSale = async (saleData) => {
    const validItems = (saleData.items || []).filter(i => Number(i.quantity) > 0 && Number(i.unit_price) > 0);
    if (!validItems.length) {
      toast.error('No valid items', 'Add at least one item with quantity and price.');
      return;
    }

    const payload = {
      date:          saleData.date,
      sale_type:     saleData.sale_type,
      payment_mode:  saleData.payment_mode,
      customer_name: saleData.customer_name || '',
      discount:      Number(saleData.discount) || 0,
      notes:         saleData.notes || '',
      items: validItems.map(item => ({
        product_type:          item.product_type,
        packing_type:          item.packing_type,
        weight_per_unit_grams: Number(item.weight_per_unit_grams) || 500,
        quantity:              Number(item.quantity),
        unit_price:            Number(item.unit_price),
      })),
    };

    setSaving(true);
    try {
      await api.post('/sales', payload);
      setActiveForm(null);
      fetchSummary();
      fetchSales();
      const total = validItems.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0);
      toast.success('Sale recorded!', `₹${total.toFixed(0)} sale saved.`);
    } catch (err) {
      toast.error('Save failed', err.response?.data?.message || 'Server error. Please try again.');
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

  const getSaleSourceLabel = (saleType) => {
    if (saleType === 'factory') return { label: 'Factory Direct', color: '#52b788', icon: <Icons.Factory /> };
    if (saleType === 'counter') return { label: 'Counter Sale', color: '#60a5fa', icon: <Icons.Store /> };
    return { label: 'Shop Sale', color: '#c084fc', icon: <Icons.Bag /> };
  };

  const counterRevenue = sales
    .filter(s => s.sale_type === 'counter')
    .reduce((acc, s) => {
      const name = s.customer_name || 'Unknown Counter';
      if (!acc[name]) acc[name] = { total: 0, count: 0 };
      acc[name].total += s.total_amount;
      acc[name].count += 1;
      return acc;
    }, {});

  const factoryRevenue  = sales.filter(s => s.sale_type === 'factory').reduce((s, x) => s + x.total_amount, 0);
  const counterRevTotal = sales.filter(s => s.sale_type === 'counter').reduce((s, x) => s + x.total_amount, 0);
  const shopRevTotal    = sales.filter(s => s.sale_type === 'shop').reduce((s, x) => s + x.total_amount, 0);

  return (
    <div className="flex min-h-screen bg-[#0a1e14]">
      <Sidebar />

      <main className="flex-1 min-w-0 md:ml-64 p-4 sm:p-6 md:p-8 pb-28 md:pb-8 w-full max-w-full overflow-x-hidden">
        <div className="max-w-6xl mx-auto">

          {/* Header & Forms Toggle */}
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5 mb-6 fade-up">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-6 md:h-8 rounded-full" style={{ background: '#f4c430' }} />
                <h1 className="font-syne font-extrabold text-[24px] md:text-[28px] text-[#e8f5ef] tracking-tight">
                  Finance
                </h1>
              </div>
              <p className="text-[#52b788] text-[13px] pl-3.5 mt-1">Factory, Counter & Shop sales & revenue tracking</p>
            </div>

            {canManage && (
              <div className="relative w-full xl:w-auto -mx-4 px-4 xl:mx-0 xl:px-0">
                <style>{`.filter-scroll::-webkit-scrollbar { display: none; } .filter-scroll { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
                <div className="flex overflow-x-auto gap-2 pb-2 xl:pb-0 w-full snap-x filter-scroll">
                  {[
                    { key: 'factory', label: 'Factory Sale', color: '#52b788', bg: 'rgba(82,183,136,0.12)', border: 'rgba(82,183,136,0.3)', icon: <Icons.Factory /> },
                    { key: 'counter', label: 'Counter Sale', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)', icon: <Icons.Store /> },
                    { key: 'shop',    label: 'Shop Sale',    color: '#c084fc', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.3)', icon: <Icons.Bag /> },
                  ].map(btn => (
                    <button key={btn.key} onClick={() => setActiveForm(activeForm === btn.key ? null : btn.key)}
                      className="snap-start whitespace-nowrap flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-transform active:scale-95 shrink-0"
                      style={activeForm === btn.key
                        ? { background: btn.bg, color: btn.color, border: `1px solid ${btn.border}`, fontFamily: 'Syne, sans-serif' }
                        : { background: 'rgba(255,255,255,0.04)', color: btn.color, border: `1px solid ${btn.border}`, fontFamily: 'Syne, sans-serif' }}>
                      {btn.icon}
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date range filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 items-stretch sm:items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#52b788] font-syne font-bold uppercase tracking-wider"></span>
                <input type="date" value={dateRange.from} onChange={e => setDateRange(d => ({ ...d, from: e.target.value }))}
                  className="w-full sm:w-auto pl-[50px] outline-none" style={inputStyle} />
              </div>
              <div className="flex-1 sm:flex-none relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#52b788] font-syne font-bold uppercase tracking-wider"></span>
                <input type="date" value={dateRange.to} onChange={e => setDateRange(d => ({ ...d, to: e.target.value }))}
                  className="w-full sm:w-auto pl-[36px] outline-none" style={inputStyle} />
              </div>
            </div>
            
            <div className="relative w-full sm:w-auto -mx-4 px-4 sm:mx-0 sm:px-0">
               <div className="flex overflow-x-auto gap-2 w-full snap-x filter-scroll">
                {[
                  { label: 'Today',      fn: () => setDateRange({ from: today(), to: today() }) },
                  { label: 'This Week',  fn: () => { const d = new Date(); const day = d.getDay(); const mon = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); setDateRange({ from: mon.toISOString().split('T')[0], to: today() }); }},
                  { label: 'This Month', fn: () => setDateRange({ from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], to: today() }) },
                ].map(btn => (
                  <button key={btn.label} onClick={btn.fn}
                    className="snap-start whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-transform active:scale-95 shrink-0 border border-white/5"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#7fb89a', fontFamily: 'DM Sans, sans-serif' }}>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Sale Forms */}
          {activeForm === 'factory' && canManage && (
            <div className="rounded-2xl p-4 sm:p-6 mb-8 fade-up shadow-2xl" style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(82,183,136,0.2)' }}>
              <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[#52b788]" style={{ background: 'rgba(82,183,136,0.12)' }}><Icons.Factory /></div>
                <div>
                  <h2 className="font-syne font-bold text-lg text-[#e8f5ef]">Factory Direct Sale</h2>
                  <p className="text-[#52b788] text-xs mt-0.5">Walk-in customer — set any weight per item</p>
                </div>
              </div>
              <FactorySaleForm onSave={handleSaveSale} onCancel={() => setActiveForm(null)} saving={saving} saleType="factory" />
            </div>
          )}

          {activeForm === 'counter' && canManage && (
            <div className="rounded-2xl p-4 sm:p-6 mb-8 fade-up shadow-2xl" style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(96,165,250,0.2)' }}>
              <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[#60a5fa]" style={{ background: 'rgba(96,165,250,0.12)' }}><Icons.Store /></div>
                <div>
                  <h2 className="font-syne font-bold text-lg text-[#e8f5ef]">Counter Daily Sales</h2>
                  <p className="text-[#52b788] text-xs mt-0.5">Roadside Counter / Shop</p>
                </div>
              </div>
              <CounterSaleForm counters={counters} onSave={handleSaveSale} onCancel={() => setActiveForm(null)} saving={saving} />
            </div>
          )}

          {activeForm === 'shop' && canManage && (
            <div className="rounded-2xl p-4 sm:p-6 mb-8 fade-up shadow-2xl" style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(192,132,252,0.2)' }}>
              <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[#c084fc]" style={{ background: 'rgba(192,132,252,0.12)' }}><Icons.Bag /></div>
                <div>
                  <h2 className="font-syne font-bold text-lg text-[#e8f5ef]">Shop Sale</h2>
                </div>
              </div>
              <FactorySaleForm onSave={handleSaveSale} onCancel={() => setActiveForm(null)} saving={saving} saleType="shop" />
            </div>
          )}

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[
              { label: "Today's Revenue", value: `₹${(summary?.today_revenue || 0).toFixed(0)}`, sub: `${summary?.today_sales || 0} sales`, color: '#f4c430', accent: 'rgba(244,196,48,0.1)' },
              { label: 'Factory Direct',  value: `₹${factoryRevenue.toFixed(0)}`,  sub: `${sales.filter(s=>s.sale_type==='factory').length} sales`, color: '#52b788', accent: 'rgba(82,183,136,0.1)' },
              { label: 'Counter Sales',   value: `₹${counterRevTotal.toFixed(0)}`, sub: `${sales.filter(s=>s.sale_type==='counter').length} sales`, color: '#60a5fa', accent: 'rgba(96,165,250,0.1)' },
              { label: 'Period Total',    value: `₹${(summary?.total_revenue || 0).toFixed(0)}`, sub: `${summary?.total_sales || 0} total`, color: '#c084fc', accent: 'rgba(192,132,252,0.1)' },
            ].map(card => (
              <div key={card.label} className="rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-lg"
                style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none"
                  style={{ background: card.accent, filter: 'blur(24px)', transform: 'translate(30%,-30%)' }} />
                <div style={{ color: '#52b788', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{card.label}</div>
                <div style={{ color: card.color, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24 }}>{card.value}</div>
                {card.sub && <div style={{ color: '#52b788', fontSize: 12, mt: 4 }}>{card.sub}</div>}
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          {summary?.daily_trend?.length > 0 && (
            <div className="rounded-2xl p-4 sm:p-6 mb-6 shadow-lg"
              style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="font-syne font-bold text-lg text-[#e8f5ef] mb-1">Revenue Trend</h2>
              <p className="text-[#52b788] text-xs mb-6">Daily revenue across all channels</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={summary.daily_trend} barSize={16} margin={{ left: -20, right: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    tick={{ fontSize: 10, fill: '#52b788' }} axisLine={false} tickLine={false} dy={8} />
                  <YAxis tick={{ fontSize: 10, fill: '#52b788' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Counter-wise Revenue */}
            {Object.keys(counterRevenue).length > 0 && (
              <div className="rounded-2xl p-5 shadow-lg" style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(96,165,250,0.15)' }}>
                <div className="flex items-center gap-2 mb-5 border-b border-white/5 pb-4">
                  <div className="w-1.5 h-5 rounded-full" style={{ background: '#60a5fa' }} />
                  <h3 className="font-syne font-bold text-[#e8f5ef] text-[15px]">Counter-wise Revenue</h3>
                </div>
                <div className="space-y-4">
                  {Object.entries(counterRevenue)
                    .sort((a, b) => b[1].total - a[1].total)
                    .map(([name, data]) => {
                      const maxTotal = Math.max(...Object.values(counterRevenue).map(d => d.total)) || 1;
                      const pct = (data.total / maxTotal) * 100;
                      return (
                        <div key={name}>
                          <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center gap-2">
                              <span style={{ color: '#95d5b2', fontSize: 13 }}>{name}</span>
                              <span style={{ color: '#52b788', fontSize: 11 }}>{data.count} sales</span>
                            </div>
                            <span style={{ color: '#60a5fa', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>₹{data.total.toFixed(0)}</span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#60a5fa' }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {/* Source + Payment breakdown */}
              <div className="rounded-2xl p-5 shadow-lg" style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="font-syne font-bold text-[#e8f5ef] text-[15px] mb-5 border-b border-white/5 pb-4">By Sales Channel</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Factory Direct', value: factoryRevenue,  count: sales.filter(s=>s.sale_type==='factory').length, color: '#52b788' },
                    { label: 'Counter/Shop',   value: counterRevTotal, count: sales.filter(s=>s.sale_type==='counter').length, color: '#60a5fa' },
                    { label: 'In-Shop',        value: shopRevTotal,    count: sales.filter(s=>s.sale_type==='shop').length,    color: '#c084fc' },
                  ].map(s => {
                    const total = factoryRevenue + counterRevTotal + shopRevTotal || 1;
                    const pct = (s.value / total) * 100;
                    return (
                      <div key={s.label}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span style={{ color: '#95d5b2', fontSize: 13 }}>{s.label}</span>
                          <div className="text-right">
                            <span style={{ color: s.color, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>₹{s.value.toFixed(0)}</span>
                            <span style={{ color: '#52b788', fontSize: 11, marginLeft: 6 }}>{s.count} sales</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: s.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {summary?.by_payment?.length > 0 && (
                <div className="rounded-2xl p-5 shadow-lg" style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 className="font-syne font-bold text-[#e8f5ef] text-[15px] mb-5 border-b border-white/5 pb-4">Payment Modes</h3>
                  <div className="space-y-4">
                    {summary.by_payment.map(p => {
                      const color = PAYMENT_COLORS[p._id] || '#52b788';
                      const total = summary.total_revenue || 1;
                      const pct   = (p.total / total) * 100;
                      return (
                        <div key={p._id}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="capitalize" style={{ color: '#95d5b2', fontSize: 13 }}>{p._id}</span>
                            <div className="text-right">
                              <span style={{ color, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>₹{p.total?.toFixed(0)}</span>
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
          </div>

          {/* Sales History Table / Mobile Cards */}
          <div className="mb-4 flex items-center justify-between px-1">
             <h3 className="font-syne font-bold text-[#e8f5ef] text-[16px]">
               Sales History <span className="text-[#52b788] text-sm font-normal ml-2">· {sales.length} records</span>
             </h3>
          </div>
          
          <div className="relative w-full mb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
             <div className="flex overflow-x-auto gap-2 w-full snap-x filter-scroll">
              {[
                { value: '',        label: 'All',        color: '#f4c430' },
                { value: 'factory', label: '🏭 Factory', color: '#52b788' },
                { value: 'counter', label: '🏪 Counter', color: '#60a5fa' },
                { value: 'shop',    label: '🛍 Shop',    color: '#c084fc' },
              ].map(f => (
                <button key={f.value} onClick={() => setSaleTypeFilter(f.value)}
                  className="snap-start whitespace-nowrap px-4 py-2.5 rounded-full text-xs font-bold transition-transform active:scale-95 shrink-0"
                  style={saleTypeFilter === f.value
                    ? { background: `${f.color}20`, color: f.color, border: `1px solid ${f.color}40`, fontFamily: 'Syne, sans-serif' }
                    : { background: 'rgba(255,255,255,0.03)', color: '#7fb89a', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Sans, sans-serif' }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
             <div className="flex items-center justify-center py-20 gap-3 bg-[#132d20]/50 rounded-2xl border border-white/5">
             <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
             <span className="text-[#52b788] text-sm">Loading history…</span>
           </div>
          ) : sales.length === 0 ? (
             <div className="flex flex-col items-center py-20 bg-[#132d20]/50 rounded-2xl border border-white/5">
             <Icons.Bag className="mb-4 opacity-50 w-12 h-12 text-[#52b788]" />
             <p className="text-[#52b788] font-syne font-semibold text-lg">No sales in this period</p>
             <p className="text-[#2d6a4f] text-sm mt-1">Adjust filters to see more records.</p>
           </div>
          ) : (
            <>
              {/* --- DESKTOP TABLE VIEW --- */}
              <div className="hidden md:block rounded-2xl overflow-hidden border border-white/5 shadow-xl" style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/20">
                      {['Date','Source','Customer/Counter','Items','Payment','Total',''].map((h, i) => (
                        <th key={i} className={`py-4 px-4 text-xs font-semibold uppercase tracking-widest ${[4,5].includes(i) ? 'text-right' : 'text-left'}`} style={{ color: '#52b788', fontFamily: 'Syne, sans-serif' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale, idx) => {
                      const pmColor = PAYMENT_COLORS[sale.payment_mode] || '#52b788';
                      const src = getSaleSourceLabel(sale.sale_type);
                      return (
                        <tr key={sale._id} className="hover:bg-white/[0.03] transition-colors" style={{ borderBottom: idx < sales.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          <td className="px-4 py-4 whitespace-nowrap text-[#7fb89a] text-sm">
                            {new Date(sale.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1.5 rounded-lg text-xs font-semibold font-syne flex items-center gap-1.5 w-max" style={{ background: `${src.color}15`, color: src.color, border: `1px solid ${src.color}30` }}>
                              {src.icon} {src.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-[#e8f5ef] font-medium font-syne">
                            {sale.customer_name || 'Walk-in'}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {sale.items.slice(0, 2).map((item, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-md text-xs font-syne font-medium whitespace-nowrap"
                                  style={{ background: `${PRODUCT_COLORS[item.product_type] || '#52b788'}15`, color: PRODUCT_COLORS[item.product_type] || '#52b788', border: `1px solid ${PRODUCT_COLORS[item.product_type] || '#52b788'}30` }}>
                                  {item.quantity}× {item.weight_per_unit_grams}g {PACKING_TYPES.find(t => t.value === item.packing_type)?.label}
                                </span>
                              ))}
                              {sale.items.length > 2 && <span className="px-2 py-1 text-xs text-[#52b788] bg-white/5 rounded-md">+{sale.items.length - 2} more</span>}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            <span className="px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize font-syne" style={{ background: `${pmColor}15`, color: pmColor, border: `1px solid ${pmColor}30` }}>
                              {sale.payment_mode}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap">
                            <span className="text-[#f4c430] font-syne font-bold text-[17px]">
                              ₹{sale.total_amount?.toFixed(0)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            {canManage && (
                              <button onClick={() => handleDelete(sale._id)} className="p-2 rounded-lg text-xs hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all border border-white/10 text-[#7fb89a]">
                                <Icons.Trash />
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
                {sales.map(sale => {
                  const pmColor = PAYMENT_COLORS[sale.payment_mode] || '#52b788';
                  const src = getSaleSourceLabel(sale.sale_type);
                  return (
                    <div key={sale._id} className="rounded-xl p-4 border border-white/5 relative shadow-lg" style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)' }}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-syne font-bold text-[#e8f5ef] text-[15px] mb-2 flex items-center gap-2">
                             {sale.customer_name || 'Walk-in'}
                          </div>
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="px-2 py-1 rounded-md text-[10px] font-bold font-syne flex items-center gap-1" style={{ background: `${src.color}15`, color: src.color, border: `1px solid ${src.color}30` }}>
                              {src.icon} {src.label}
                            </span>
                            <span className="text-[12px] text-[#7fb89a] font-dm">{new Date(sale.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           {canManage && (
                            <button onClick={() => handleDelete(sale._id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 active:scale-95 transition-transform shrink-0">
                              <Icons.Trash />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="bg-black/20 rounded-xl p-3 mb-3 border border-white/5 space-y-2">
                         {sale.items.map((item, i) => (
                           <div key={i} className="flex justify-between items-center text-sm">
                              <span style={{ color: PRODUCT_COLORS[item.product_type] || '#52b788', fontSize: 12, fontFamily: 'Syne, sans-serif' }}>
                                {item.product_type.replace(' Banana Chips', '')} <span className="opacity-50 mx-1">•</span> {item.weight_per_unit_grams}g
                              </span>
                              <span className="text-[#e8f5ef] font-syne font-bold text-[13px]">×{item.quantity}</span>
                           </div>
                         ))}
                      </div>

                      <div className="flex justify-between items-center pt-2">
                         <span className="px-2 py-1 rounded-lg text-[10px] font-bold capitalize font-syne" style={{ background: `${pmColor}15`, color: pmColor, border: `1px solid ${pmColor}30` }}>
                            {sale.payment_mode}
                          </span>
                          <span className="text-[#f4c430] font-syne font-bold text-[18px]">
                            ₹{sale.total_amount?.toFixed(0)}
                          </span>
                      </div>
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