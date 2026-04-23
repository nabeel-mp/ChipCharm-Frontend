import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { PRODUCT_TYPES } from './StockPage';
import { PACKING_TYPES } from './PackedPage';

const today = () => new Date().toISOString().split('T')[0];

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#e8f5ef',
  fontFamily: 'DM Sans, sans-serif',
  borderRadius: 12,
  padding: '12px 14px', // Increased for mobile touch
  fontSize: 15,
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.2s ease',
};

// SVG Icons
const Icons = {
  Truck: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1" ry="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Close: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  Box: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Return: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
};

const RETURN_REASONS = [
  { value: 'unsold',        label: 'Unsold'         },
  { value: 'damaged',       label: 'Damaged'        },
  { value: 'sample_return', label: 'Sample Return'  },
  { value: 'other',         label: 'Other'          },
];

const DEFAULT_WEIGHTS = {
  normal_half_kg: 500, normal_1kg: 1000,
  jar_small: 200, jar_medium: 400, jar_large: 750, big_bottle: 1500,
};

// Units per box per packing type (default 18 for 500g)
const DEFAULT_UNITS_PER_BOX = {
  normal_half_kg: 18, normal_1kg: 12,
  jar_small: 24, jar_medium: 20, jar_large: 12, big_bottle: 6,
};

const emptyCarryItem = () => ({
  product_type: PRODUCT_TYPES[0],
  packing_type: 'normal_half_kg',
  weight_per_unit_grams: 500,
  quantity: '',
  use_boxes: false,
  boxes_count: '',
  units_per_box: 18,
});

const emptyReturnItem = () => ({
  product_type: PRODUCT_TYPES[0],
  packing_type: 'normal_half_kg',
  weight_per_unit_grams: 500,
  quantity: '',
  reason: 'unsold',
  notes: ''
});

export default function SupplierTripsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [trips, setTrips]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [returnModal, setReturnModal] = useState(null);
  const [saving, setSaving]           = useState(false);

  const [tripForm, setTripForm] = useState({
    date: today(),
    supplier_name: '',
    carried_out: [emptyCarryItem()],
    notes: ''
  });

  const [returnForm, setReturnForm] = useState({
    returned_items: [emptyReturnItem()],
    cash_collected: '',
    notes: ''
  });

  const canManage = user?.role === 'manager' || user?.role === 'owner';

  const fetchTrips = () => {
    setLoading(true);
    api.get('/supplier-trips')
      .then(r => setTrips(r.data))
      .catch(() => toast.error('Fetch failed'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchTrips, []);

  // ── Carry-out item helpers ──
  const addCarryItem    = () => setTripForm(f => ({ ...f, carried_out: [...f.carried_out, emptyCarryItem()] }));
  const removeCarryItem = (i) => setTripForm(f => ({ ...f, carried_out: f.carried_out.filter((_, idx) => idx !== i) }));

  const updateCarryItem = (i, field, val) => {
    setTripForm(f => {
      const items = [...f.carried_out];
      items[i] = { ...items[i], [field]: val };
      if (field === 'packing_type') {
        items[i].weight_per_unit_grams = DEFAULT_WEIGHTS[val] || 500;
        items[i].units_per_box = DEFAULT_UNITS_PER_BOX[val] || 18;
        if (items[i].use_boxes && items[i].boxes_count) {
          items[i].quantity = String(Number(items[i].boxes_count) * items[i].units_per_box);
        }
      }
      if (field === 'use_boxes') {
        if (val && items[i].boxes_count) {
          items[i].quantity = String(Number(items[i].boxes_count) * (items[i].units_per_box || 18));
        }
        if (!val) items[i].boxes_count = '';
      }
      if (field === 'boxes_count' && items[i].use_boxes) {
        items[i].quantity = val ? String(Number(val) * (items[i].units_per_box || 18)) : '';
      }
      if (field === 'units_per_box' && items[i].use_boxes && items[i].boxes_count) {
        items[i].quantity = String(Number(items[i].boxes_count) * Number(val));
      }
      return { ...f, carried_out: items };
    });
  };

  // ── Return item helpers ──
  const addReturnItem    = () => setReturnForm(f => ({ ...f, returned_items: [...f.returned_items, emptyReturnItem()] }));
  const removeReturnItem = (i) => setReturnForm(f => ({ ...f, returned_items: f.returned_items.filter((_, idx) => idx !== i) }));
  const updateReturnItem = (i, field, val) => {
    setReturnForm(f => {
      const items = [...f.returned_items];
      items[i] = { ...items[i], [field]: val };
      if (field === 'packing_type') items[i].weight_per_unit_grams = DEFAULT_WEIGHTS[val] || 500;
      return { ...f, returned_items: items };
    });
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!tripForm.supplier_name.trim()) { toast.error('Supplier name required'); return; }
    setSaving(true);
    try {
      const carried_out = tripForm.carried_out
        .filter(i => i.quantity > 0)
        .map(({ use_boxes, boxes_count, units_per_box, ...rest }) => rest);

      await api.post('/supplier-trips', { ...tripForm, carried_out });
      setShowNewTrip(false);
      setTripForm({ date: today(), supplier_name: '', carried_out: [emptyCarryItem()], notes: '' });
      fetchTrips();
      toast.success('Trip created!', `${tripForm.supplier_name} trip recorded.`);
    } catch (err) {
      toast.error('Create failed', err.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const openReturnModal = (trip) => {
    setReturnModal(trip);
    setReturnForm({ returned_items: [emptyReturnItem()], cash_collected: '', notes: '' });
  };

  const handleRecordReturn = async () => {
    if (!returnModal) return;
    setSaving(true);
    try {
      await api.put(`/supplier-trips/${returnModal._id}/return`, {
        returned_items: returnForm.returned_items.filter(i => i.quantity > 0),
        cash_collected: Number(returnForm.cash_collected) || 0,
        notes: returnForm.notes
      });
      setReturnModal(null);
      fetchTrips();
      toast.success('Return recorded!', `₹${returnForm.cash_collected || 0} cash collected.`);
    } catch (err) {
      toast.error('Return failed', err.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this trip?')) return;
    try {
      await api.delete(`/supplier-trips/${id}`);
      fetchTrips();
      toast.warning('Trip deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const totalPending = trips.filter(t => t.status === 'pending').length;
  const totalCash    = trips.filter(t => t.status === 'completed').reduce((s, t) => s + (t.cash_collected || 0), 0);

  return (
    <div className="flex min-h-screen" style={{ background: '#0a1e14' }}>
      <Sidebar />

      {/* Return Modal - Scrollable on mobile */}
      {returnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}>
          <div className="rounded-2xl p-4 sm:p-6 w-full max-w-2xl fade-up max-h-[90vh] overflow-y-auto custom-scroll"
            style={{ background: '#0d2b1e', border: '1px solid rgba(82,183,136,0.25)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
            
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(82,183,136,0.15)' }}>
                  <Icons.Return stroke="#52b788" />
                </div>
                <div>
                  <h3 className="font-syne font-bold text-[#e8f5ef] text-[16px] sm:text-[18px] leading-tight">
                    Record Return — {returnModal.supplier_name}
                  </h3>
                  <p className="text-[#52b788] text-xs mt-1">
                    {new Date(returnModal.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button onClick={() => setReturnModal(null)} className="p-2 bg-white/5 rounded-full text-[#7fb89a] active:scale-95 transition-transform">
                <Icons.Close />
              </button>
            </div>

            {returnModal.carried_out?.length > 0 && (
              <div className="rounded-xl p-3.5 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[#52b788] text-[11px] font-syne font-semibold uppercase tracking-wider mb-2">Carried Out Today</p>
                <div className="space-y-2">
                  {returnModal.carried_out.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm pb-2 border-b border-white/5 last:border-b-0 last:pb-0">
                      <span className="text-[#95d5b2] text-xs sm:text-sm">{item.product_type} <span className="opacity-50">·</span> {PACKING_TYPES.find(t => t.value === item.packing_type)?.label}</span>
                      <span className="text-[#f4c430] font-syne font-bold text-sm sm:text-base whitespace-nowrap">{item.quantity} units</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[#52b788] text-[12px] font-syne font-bold uppercase tracking-wider">Returned Items</p>
                <button onClick={addReturnItem}
                  className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 active:scale-95 transition-transform font-bold"
                  style={{ background: 'rgba(82,183,136,0.1)', color: '#52b788', border: '1px solid rgba(82,183,136,0.2)' }}>
                  <Icons.Plus /> Add Item
                </button>
              </div>
              
              <div className="space-y-3">
                {returnForm.returned_items.map((item, i) => (
                  <div key={i} className="rounded-xl p-3 sm:p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex flex-col sm:flex-row gap-2.5 mb-2.5">
                      <select value={item.product_type} onChange={e => updateReturnItem(i, 'product_type', e.target.value)}
                        className="w-full sm:flex-1" style={{ ...inputStyle, padding: '10px', fontSize: 14, appearance: 'none' }}>
                        {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <select value={item.packing_type} onChange={e => updateReturnItem(i, 'packing_type', e.target.value)}
                        className="w-full sm:flex-1" style={{ ...inputStyle, padding: '10px', fontSize: 14, appearance: 'none' }}>
                        {PACKING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input type="number" min="0" placeholder="Qty (units)" value={item.quantity}
                        onChange={e => updateReturnItem(i, 'quantity', e.target.value)}
                        className="w-full sm:w-1/3" style={{ ...inputStyle, padding: '10px', fontSize: 14 }} />
                      <select value={item.reason} onChange={e => updateReturnItem(i, 'reason', e.target.value)}
                        className="w-full sm:w-1/3" style={{ ...inputStyle, padding: '10px', fontSize: 14, appearance: 'none' }}>
                        {RETURN_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                      <button onClick={() => removeReturnItem(i)}
                        className="w-full sm:w-1/3 rounded-xl text-xs py-2.5 flex justify-center items-center gap-1.5 active:scale-95 transition-transform" 
                        style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>
                        <Icons.Trash /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs text-[#52b788] mb-2 font-syne font-bold uppercase tracking-wider">
                Cash Collected (₹)
              </label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={returnForm.cash_collected}
                onChange={e => setReturnForm(f => ({ ...f, cash_collected: e.target.value }))}
                style={{ ...inputStyle, fontSize: 18, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#f4c430' }} />
            </div>

            <div className="mb-6">
              <label className="block text-xs text-[#52b788] mb-2 font-syne font-bold uppercase tracking-wider">Notes</label>
              <input type="text" placeholder="Any notes..." value={returnForm.notes}
                onChange={e => setReturnForm(f => ({ ...f, notes: e.target.value }))} style={inputStyle} />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setReturnModal(null)}
                className="w-full sm:flex-1 py-3.5 sm:py-3 rounded-xl text-sm active:scale-95 transition-transform"
                style={{ color: '#52b788', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'DM Sans, sans-serif' }}>
                Cancel
              </button>
              <button onClick={handleRecordReturn} disabled={saving}
                className="w-full sm:flex-1 py-3.5 sm:py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
                style={{ background: 'rgba(82,183,136,0.15)', color: '#52b788', border: '1px solid rgba(82,183,136,0.3)', fontFamily: 'Syne, sans-serif' }}>
                {saving ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> : <Icons.Return />}
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 md:ml-64 p-4 sm:p-6 md:p-8 pb-28 md:pb-8 w-full max-w-full overflow-x-hidden">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-6 fade-up">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-6 md:h-8 rounded-full shrink-0" style={{ background: '#60a5fa' }} />
                <h1 className="font-syne font-extrabold text-[24px] md:text-[28px] text-[#e8f5ef] tracking-tight">
                  Supplier Trips
                </h1>
              </div>
              <p className="text-[#52b788] text-[13px] pl-3.5 mt-1">Track daily carry-out, returns & cash collection</p>
            </div>
            {canManage && (
              <button onClick={() => setShowNewTrip(!showNewTrip)}
                className="bg-[#60a5fa] text-[#0a1e14] w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform shadow-lg font-syne shrink-0">
                {showNewTrip ? <Icons.Close /> : <Icons.Plus />}
                {showNewTrip ? 'Cancel' : 'New Trip'}
              </button>
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 md:mb-8">
            {[
              { label: 'Total Trips',     value: trips.length,  unit: 'trips',   color: '#60a5fa' },
              { label: 'Pending Returns', value: totalPending,  unit: 'pending', color: totalPending > 0 ? '#fb923c' : '#52b788' },
              { label: 'Cash Collected',  value: `₹${totalCash.toFixed(0)}`, unit: '', color: '#f4c430' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 sm:p-5 shadow-lg"
                style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-[#52b788] text-[10px] sm:text-[11px] font-syne font-bold uppercase tracking-wider">{s.label}</div>
                <div className="flex items-baseline gap-1.5 mt-1 sm:mt-2">
                  <span style={{ color: s.color, fontFamily: 'Syne, sans-serif', fontWeight: 800 }} className="text-xl sm:text-[26px]">{s.value}</span>
                  {s.unit && <span style={{ color: '#52b788', fontSize: 12 }}>{s.unit}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* New Trip Form */}
          {showNewTrip && canManage && (
            <div className="rounded-2xl p-4 sm:p-6 mb-8 fade-up shadow-2xl border border-[#60a5fa]/20"
              style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)' }}>
              <h2 className="font-syne font-bold text-lg text-[#e8f5ef] mb-5 flex items-center gap-2">
                <Icons.Truck /> New Supplier Trip
              </h2>
              <form onSubmit={handleCreateTrip}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-xs text-[#52b788] mb-1.5 font-bold uppercase tracking-wider font-syne">Date</label>
                    <input type="date" required value={tripForm.date} onChange={e => setTripForm({ ...tripForm, date: e.target.value })} style={inputStyle} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-[#52b788] mb-1.5 font-bold uppercase tracking-wider font-syne">Supplier Name</label>
                    <input type="text" required placeholder="e.g. Ravi Kumar" value={tripForm.supplier_name}
                      onChange={e => setTripForm({ ...tripForm, supplier_name: e.target.value })} style={inputStyle} />
                  </div>
                </div>

                {/* Carried out items */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                    <p className="text-[#52b788] text-[13px] font-syne font-bold uppercase tracking-wider">Items Carried Out</p>
                    <button type="button" onClick={addCarryItem}
                      className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold active:scale-95 transition-transform"
                      style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
                      <Icons.Plus /> Add Item
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {tripForm.carried_out.map((item, i) => (
                      <div key={i} className="rounded-xl p-4 shadow-inner" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        
                        {/* Row 1: Product + Packing + Box Toggle */}
                        <div className="flex flex-col md:flex-row gap-3 mb-4">
                          <select value={item.product_type} onChange={e => updateCarryItem(i, 'product_type', e.target.value)}
                            className="w-full md:flex-1" style={{ ...inputStyle, appearance: 'none' }}>
                            {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <select value={item.packing_type} onChange={e => updateCarryItem(i, 'packing_type', e.target.value)}
                            className="w-full md:flex-1" style={{ ...inputStyle, appearance: 'none' }}>
                            {PACKING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          <button type="button" onClick={() => updateCarryItem(i, 'use_boxes', !item.use_boxes)}
                            className="w-full md:w-auto rounded-xl text-xs font-bold flex items-center justify-center gap-2 px-4 py-3 md:py-0 active:scale-95 transition-all"
                            style={item.use_boxes
                              ? { background: 'rgba(251,146,60,0.15)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.3)', fontFamily: 'Syne' }
                              : { background: 'rgba(255,255,255,0.05)', color: '#7fb89a', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'DM Sans' }}>
                            <Icons.Box />
                            {item.use_boxes ? 'Box Mode ON' : 'Use Boxes'}
                          </button>
                        </div>

                        {/* Row 2: Quantities */}
                        {item.use_boxes ? (
                          <div className="rounded-xl p-3 sm:p-4 mb-3" style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.15)' }}>
                            <div className="flex flex-col sm:flex-row gap-3 mb-3">
                              <div className="flex-1">
                                <label className="block text-[11px] text-[#fb923c] mb-1 font-syne font-bold uppercase tracking-wider"># Boxes</label>
                                <input type="number" min="0" placeholder="e.g. 3" value={item.boxes_count}
                                  onChange={e => updateCarryItem(i, 'boxes_count', e.target.value)}
                                  style={{ ...inputStyle, fontWeight: 700, color: '#fb923c' }} />
                              </div>
                              <div className="flex-1">
                                <label className="block text-[11px] text-[#fb923c] mb-1 font-syne font-bold uppercase tracking-wider">Units/Box</label>
                                <input type="number" min="1" value={item.units_per_box}
                                  onChange={e => updateCarryItem(i, 'units_per_box', e.target.value)}
                                  style={inputStyle} />
                              </div>
                              <div className="flex-1">
                                <label className="block text-[11px] text-[#52b788] mb-1 font-syne font-bold uppercase tracking-wider">Total Qty</label>
                                <input type="number" min="0" value={item.quantity}
                                  onChange={e => updateCarryItem(i, 'quantity', e.target.value)}
                                  style={{ ...inputStyle, fontWeight: 700, color: '#f4c430' }} />
                              </div>
                            </div>
                            {item.boxes_count && item.units_per_box && (
                              <div className="text-xs px-3 py-2 rounded-lg bg-[#fb923c]/10 text-[#fb923c] font-syne font-medium flex items-center gap-2">
                                <Icons.Box /> {item.boxes_count} boxes × {item.units_per_box} units = <strong>{item.quantity} units total</strong>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                              <label className="block text-[11px] text-[#52b788] mb-1 font-syne font-bold uppercase tracking-wider">Quantity (units)</label>
                              <input type="number" min="0" placeholder="Qty" value={item.quantity}
                                onChange={e => updateCarryItem(i, 'quantity', e.target.value)}
                                style={{ ...inputStyle, fontWeight: 700, color: '#f4c430' }} />
                            </div>
                            {tripForm.carried_out.length > 1 && (
                              <div className="flex items-end">
                                <button type="button" onClick={() => removeCarryItem(i)}
                                  className="w-full sm:w-auto px-6 py-[14px] rounded-xl text-xs font-bold flex justify-center items-center gap-1.5 active:scale-95 transition-transform"
                                  style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>
                                  <Icons.Trash /> Remove
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Remove button when box mode is active and multiple items exist */}
                        {item.use_boxes && tripForm.carried_out.length > 1 && (
                          <button type="button" onClick={() => removeCarryItem(i)}
                            className="mt-3 w-full py-2.5 rounded-xl text-xs font-bold flex justify-center items-center gap-1.5 active:scale-95 transition-transform"
                            style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>
                            <Icons.Trash /> Remove Item
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs text-[#52b788] mb-1.5 font-bold uppercase tracking-wider font-syne">Notes</label>
                  <input type="text" placeholder="Optional notes..." value={tripForm.notes}
                    onChange={e => setTripForm({ ...tripForm, notes: e.target.value })} style={inputStyle} />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button type="submit" disabled={saving || !tripForm.supplier_name.trim()}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 sm:py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
                    style={{ background: '#60a5fa', color: '#0a1e14', fontFamily: 'Syne' }}>
                    {saving ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> : <Icons.Truck />}
                    Create Trip
                  </button>
                  <button type="button" onClick={() => setShowNewTrip(false)}
                    className="w-full sm:w-auto px-6 py-3.5 sm:py-3 rounded-xl text-sm text-center border border-white/10 text-[#52b788] active:scale-95 transition-transform">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Trips list */}
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 bg-[#132d20]/50 rounded-2xl border border-white/5">
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
              <span className="text-[#52b788]">Loading trips…</span>
            </div>
          ) : trips.length === 0 ? (
            <div className="flex flex-col items-center py-20 bg-[#132d20]/50 rounded-2xl border border-white/5">
              <Icons.Truck className="mb-4 opacity-50 w-12 h-12 text-[#52b788]" />
              <p className="text-[#52b788] font-syne font-semibold text-lg">No trips yet</p>
              <p className="text-[#2d6a4f] text-sm mt-1">Record your first supplier trip above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trips.map(trip => (
                <div key={trip._id} className="rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(145deg, #132d20, #0f2419)',
                    border: trip.status === 'pending' ? '1px solid rgba(251,146,60,0.25)' : '1px solid rgba(82,183,136,0.15)',
                  }}>
                  
                  {/* Trip Card Header */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                        <h3 className="font-syne font-bold text-[#e8f5ef] text-[18px] sm:text-[20px]">
                          {trip.supplier_name}
                        </h3>
                        <span className="px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-bold font-syne flex items-center gap-1.5"
                          style={trip.status === 'pending'
                            ? { background: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.25)' }
                            : { background: 'rgba(82,183,136,0.12)', color: '#52b788', border: '1px solid rgba(82,183,136,0.25)' }}>
                          {trip.status === 'pending' ? <><Icons.Clock /> Pending Return</> : <><Icons.Check /> Completed</>}
                        </span>
                      </div>
                      <p className="text-[#7fb89a] text-[12px] sm:text-[13px] mt-1.5">
                        {new Date(trip.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                      {trip.status === 'completed' && trip.cash_collected > 0 && (
                        <div className="px-4 py-2 sm:py-1.5 rounded-xl text-center bg-[#f4c430]/10 border border-[#f4c430]/20 w-full sm:w-auto">
                          <div className="text-[#52b788] text-[9px] font-syne font-bold uppercase tracking-wider">Cash Collected</div>
                          <div className="text-[#f4c430] font-syne font-bold text-[18px]">₹{trip.cash_collected}</div>
                        </div>
                      )}
                      
                      <div className="flex gap-2 w-full sm:w-auto">
                        {trip.status === 'pending' && canManage && (
                          <button onClick={() => openReturnModal(trip)}
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 active:scale-95 transition-transform"
                            style={{ background: 'rgba(82,183,136,0.15)', color: '#52b788', border: '1px solid rgba(82,183,136,0.3)', fontFamily: 'Syne' }}>
                            <Icons.Return /> Record Return
                          </button>
                        )}
                        {canManage && (
                          <button onClick={() => handleDelete(trip._id)}
                            className="p-2.5 sm:px-3 sm:py-2 rounded-xl text-sm transition-all border border-white/10 text-[#7fb89a] hover:bg-red-500/10 hover:text-red-400 active:scale-95 shrink-0 flex items-center justify-center">
                            <Icons.Trash />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Trip Details: Carried Out */}
                  {trip.carried_out?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-[#52b788] text-[10px] font-syne font-bold uppercase tracking-wider mb-2">Carried Out</p>
                      <div className="flex flex-wrap gap-2">
                        {trip.carried_out.map((item, i) => (
                          <span key={i} className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
                            style={{ background: 'rgba(96,165,250,0.08)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.15)', fontFamily: 'DM Sans' }}>
                            {item.product_type.replace(' Banana Chips', '').replace(' Chips', '')} <span className="opacity-50">·</span> {PACKING_TYPES.find(t => t.value === item.packing_type)?.label} × <strong className="font-syne text-[13px]">{item.quantity}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trip Details: Returned */}
                  {trip.returned_items?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-[#fb923c] text-[10px] font-syne font-bold uppercase tracking-wider mb-2">Returned</p>
                      <div className="flex flex-wrap gap-2">
                        {trip.returned_items.map((item, i) => (
                          <span key={i} className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
                            style={{ background: 'rgba(251,146,60,0.08)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.15)', fontFamily: 'DM Sans' }}>
                            {item.product_type.replace(' Banana Chips', '').replace(' Chips', '')} × <strong className="font-syne text-[13px]">{item.quantity}</strong> <span className="opacity-75 text-[10px]">({RETURN_REASONS.find(r => r.value === item.reason)?.label})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {trip.notes && (
                    <div className="mt-3 text-xs px-3 py-2 rounded-lg bg-black/20 border border-white/5 text-[#2d6a4f] italic">
                      "{trip.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}