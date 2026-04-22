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
  padding: '10px 14px',
  fontSize: 14,
  width: '100%',
  outline: 'none',
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

const emptyCarryItem = () => ({
  product_type: PRODUCT_TYPES[0],
  packing_type: 'normal_half_kg',
  weight_per_unit_grams: 500,
  quantity: ''
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
  const [returnModal, setReturnModal] = useState(null); // trip object
  const [saving, setSaving]           = useState(false);

  // New trip form
  const [tripForm, setTripForm] = useState({
    date: today(),
    supplier_name: '',
    carried_out: [emptyCarryItem()],
    notes: ''
  });

  // Return form
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
      if (field === 'packing_type') items[i].weight_per_unit_grams = DEFAULT_WEIGHTS[val] || 500;
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
      await api.post('/supplier-trips', {
        ...tripForm,
        carried_out: tripForm.carried_out.filter(i => i.quantity > 0)
      });
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
    setReturnForm({
      returned_items: [emptyReturnItem()],
      cash_collected: '',
      notes: ''
    });
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
      toast.success('Return recorded!', `₹${returnForm.cash_collected || 0} cash collected from ${returnModal.supplier_name}.`);
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

  const totalPending   = trips.filter(t => t.status === 'pending').length;
  const totalCash      = trips.filter(t => t.status === 'completed').reduce((s, t) => s + (t.cash_collected || 0), 0);

  return (
    <div className="flex min-h-screen" style={{ background: '#0a1e14' }}>
      <Sidebar />

      {/* Return Modal */}
      {returnModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl p-6 w-full max-w-2xl my-4 fade-up"
            style={{ background: '#0d2b1e', border: '1px solid rgba(82,183,136,0.25)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(82,183,136,0.15)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52b788" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
              </div>
              <div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e8f5ef', fontSize: 17 }}>
                  Record Return — {returnModal.supplier_name}
                </h3>
                <p style={{ color: '#52b788', fontSize: 12 }}>
                  {new Date(returnModal.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* What was carried out */}
            {returnModal.carried_out?.length > 0 && (
              <div className="rounded-xl p-3 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ color: '#52b788', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Carried Out Today</p>
                {returnModal.carried_out.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 text-sm border-b last:border-b-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <span style={{ color: '#95d5b2' }}>{item.product_type} · {PACKING_TYPES.find(t => t.value === item.packing_type)?.label}</span>
                    <span style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>{item.quantity} units</span>
                  </div>
                ))}
              </div>
            )}

            {/* Returned items */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <p style={{ color: '#52b788', fontSize: 12, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Returned Items</p>
                <button onClick={addReturnItem}
                  className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                  style={{ background: 'rgba(82,183,136,0.1)', color: '#52b788', border: '1px solid rgba(82,183,136,0.2)' }}>
                  + Add Item
                </button>
              </div>
              <div className="space-y-3">
                {returnForm.returned_items.map((item, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <select value={item.product_type} onChange={e => updateReturnItem(i, 'product_type', e.target.value)}
                        style={{ ...inputStyle, padding: '8px 10px', fontSize: 13, appearance: 'none' }}>
                        {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <select value={item.packing_type} onChange={e => updateReturnItem(i, 'packing_type', e.target.value)}
                        style={{ ...inputStyle, padding: '8px 10px', fontSize: 13, appearance: 'none' }}>
                        {PACKING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" min="0" placeholder="Qty" value={item.quantity}
                        onChange={e => updateReturnItem(i, 'quantity', e.target.value)}
                        style={{ ...inputStyle, padding: '8px 10px', fontSize: 13 }} />
                      <select value={item.reason} onChange={e => updateReturnItem(i, 'reason', e.target.value)}
                        style={{ ...inputStyle, padding: '8px 10px', fontSize: 13, appearance: 'none' }}>
                        {RETURN_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                      <button onClick={() => removeReturnItem(i)}
                        className="rounded-xl text-xs" style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cash collected */}
            <div className="mb-5">
              <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>
                Cash Collected (₹)
              </label>
              <input type="number" min="0" step="0.01" placeholder="0.00"
                value={returnForm.cash_collected}
                onChange={e => setReturnForm(f => ({ ...f, cash_collected: e.target.value }))}
                style={{ ...inputStyle, fontSize: 18, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#f4c430' }} />
            </div>

            <div className="mb-5">
              <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Notes</label>
              <input type="text" placeholder="Any notes..."
                value={returnForm.notes}
                onChange={e => setReturnForm(f => ({ ...f, notes: e.target.value }))}
                style={inputStyle} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setReturnModal(null)}
                className="flex-1 py-3 rounded-xl text-sm"
                style={{ color: '#52b788', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'DM Sans, sans-serif' }}>
                Cancel
              </button>
              <button onClick={handleRecordReturn} disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: 'rgba(82,183,136,0.15)', color: '#52b788', border: '1px solid rgba(82,183,136,0.3)', fontFamily: 'Syne, sans-serif' }}>
                {saving ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> : null}
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 md:ml-64 p-4 sm:p-6 md:p-8 pb-28 md:pb-8 w-full max-w-full overflow-x-hidden">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 fade-up">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-6 rounded-full" style={{ background: '#60a5fa' }} />
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#e8f5ef', letterSpacing: '-0.02em' }}>
                  Supplier Trips
                </h1>
              </div>
              <p style={{ color: '#52b788', fontSize: 13, paddingLeft: 14 }}>Track daily carry-out, returns & cash collection</p>
            </div>
            {canManage && (
              <button onClick={() => setShowNewTrip(!showNewTrip)}
                className="cc-btn-primary w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  {showNewTrip ? (<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>) : (<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>)}
                </svg>
                {showNewTrip ? 'Cancel' : 'New Trip'}
              </button>
            )}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Trips', value: trips.length, unit: 'trips', color: '#60a5fa' },
              { label: 'Pending Returns', value: totalPending, unit: 'pending', color: totalPending > 0 ? '#fb923c' : '#52b788' },
              { label: 'Cash Collected', value: `₹${totalCash.toFixed(0)}`, unit: '', color: '#f4c430' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4"
                style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: '#52b788', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span style={{ color: s.color, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22 }}>{s.value}</span>
                  {s.unit && <span style={{ color: '#52b788', fontSize: 12 }}>{s.unit}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* New Trip Form */}
          {showNewTrip && canManage && (
            <div className="rounded-2xl p-5 sm:p-6 mb-8 fade-up"
              style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(96,165,250,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#e8f5ef', marginBottom: 20 }}>
                New Supplier Trip
              </h2>
              <form onSubmit={handleCreateTrip}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Date</label>
                    <input type="date" required value={tripForm.date} onChange={e => setTripForm({ ...tripForm, date: e.target.value })} style={inputStyle} className="cc-input" />
                  </div>
                  <div className="sm:col-span-2">
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Supplier Name</label>
                    <input type="text" required placeholder="e.g. Ravi Kumar" value={tripForm.supplier_name}
                      onChange={e => setTripForm({ ...tripForm, supplier_name: e.target.value })} style={inputStyle} className="cc-input" />
                  </div>
                </div>

                {/* Carried out items */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <p style={{ color: '#52b788', fontSize: 12, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Items Carried Out</p>
                    <button type="button" onClick={addCarryItem}
                      className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                      style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
                      + Add Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {tripForm.carried_out.map((item, i) => (
                      <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <select value={item.product_type} onChange={e => updateCarryItem(i, 'product_type', e.target.value)}
                            style={{ ...inputStyle, padding: '8px 10px', fontSize: 13, appearance: 'none' }}>
                            {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <select value={item.packing_type} onChange={e => updateCarryItem(i, 'packing_type', e.target.value)}
                            style={{ ...inputStyle, padding: '8px 10px', fontSize: 13, appearance: 'none' }}>
                            {PACKING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          <input type="number" min="0" placeholder="Qty" value={item.quantity}
                            onChange={e => updateCarryItem(i, 'quantity', e.target.value)}
                            style={{ ...inputStyle, padding: '8px 10px', fontSize: 13 }} />
                          {tripForm.carried_out.length > 1 && (
                            <button type="button" onClick={() => removeCarryItem(i)}
                              className="rounded-xl text-xs" style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Notes</label>
                  <input type="text" placeholder="Optional notes..." value={tripForm.notes}
                    onChange={e => setTripForm({ ...tripForm, notes: e.target.value })} style={inputStyle} className="cc-input" />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button type="button" onClick={() => setShowNewTrip(false)}
                    className="px-6 py-3 rounded-xl text-sm w-full sm:w-auto"
                    style={{ color: '#52b788', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'DM Sans, sans-serif' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="cc-btn-primary flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm w-full sm:w-auto">
                    {saving ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> : null}
                    Create Trip
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Trips list */}
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2">
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
              <span style={{ color: '#52b788' }}>Loading trips…</span>
            </div>
          ) : trips.length === 0 ? (
            <div className="flex flex-col items-center py-20">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#52b788" strokeWidth="1.5" className="mb-4 opacity-60">
                <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <p style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 16 }}>No trips yet</p>
              <p style={{ color: '#2d6a4f', fontSize: 14, marginTop: 6 }}>Record your first supplier trip above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trips.map(trip => (
                <div key={trip._id} className="rounded-2xl p-5"
                  style={{
                    background: 'linear-gradient(145deg, #132d20, #0f2419)',
                    border: trip.status === 'pending' ? '1px solid rgba(251,146,60,0.25)' : '1px solid rgba(82,183,136,0.15)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
                  }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e8f5ef', fontSize: 16 }}>
                          {trip.supplier_name}
                        </h3>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold"
                          style={trip.status === 'pending'
                            ? { background: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.25)', fontFamily: 'Syne, sans-serif' }
                            : { background: 'rgba(82,183,136,0.12)', color: '#52b788', border: '1px solid rgba(82,183,136,0.25)', fontFamily: 'Syne, sans-serif' }}>
                          {trip.status === 'pending' ? '⏳ Pending Return' : '✓ Completed'}
                        </span>
                      </div>
                      <p style={{ color: '#7fb89a', fontSize: 13 }}>
                        {new Date(trip.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {trip.status === 'completed' && trip.cash_collected > 0 && (
                        <div className="px-4 py-2 rounded-xl text-center"
                          style={{ background: 'rgba(244,196,48,0.1)', border: '1px solid rgba(244,196,48,0.2)' }}>
                          <div style={{ color: '#52b788', fontSize: 10, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Cash Collected</div>
                          <div style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18 }}>₹{trip.cash_collected}</div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {trip.status === 'pending' && canManage && (
                          <button onClick={() => openReturnModal(trip)}
                            className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                            style={{ background: 'rgba(82,183,136,0.12)', color: '#52b788', border: '1px solid rgba(82,183,136,0.25)', fontFamily: 'Syne, sans-serif' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
                            Record Return
                          </button>
                        )}
                        {canManage && (
                          <button onClick={() => handleDelete(trip._id)}
                            className="px-3 py-2 rounded-xl text-sm transition-all"
                            style={{ color: '#7fb89a', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Sans, sans-serif' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7fb89a'; }}>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items carried out */}
                  {trip.carried_out?.length > 0 && (
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ color: '#52b788', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Carried Out</p>
                      <div className="flex flex-wrap gap-2">
                        {trip.carried_out.map((item, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-lg text-xs"
                            style={{ background: 'rgba(96,165,250,0.08)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.15)', fontFamily: 'DM Sans, sans-serif' }}>
                            {item.product_type.replace(' Banana Chips', '').replace(' Chips', '')} · {PACKING_TYPES.find(t => t.value === item.packing_type)?.label} × <strong>{item.quantity}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Returned items */}
                  {trip.returned_items?.length > 0 && (
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ color: '#fb923c', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Returned</p>
                      <div className="flex flex-wrap gap-2">
                        {trip.returned_items.map((item, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-lg text-xs"
                            style={{ background: 'rgba(251,146,60,0.08)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.15)', fontFamily: 'DM Sans, sans-serif' }}>
                            {item.product_type.replace(' Banana Chips', '').replace(' Chips', '')} × <strong>{item.quantity}</strong> ({RETURN_REASONS.find(r => r.value === item.reason)?.label})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {trip.notes && (
                    <p className="mt-3 text-xs" style={{ color: '#2d6a4f' }}>{trip.notes}</p>
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