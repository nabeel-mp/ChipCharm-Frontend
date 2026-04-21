import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { PRODUCT_TYPES } from './StockPage';

const today = () => new Date().toISOString().split('T')[0];

// The values here strictly match the backend Mongoose schema enum
export const PACKING_TYPES = [
  { value: 'normal_half_kg', label: 'Normal 500g' },
  { value: 'normal_1kg',     label: 'Normal 1 kg' },
  { value: 'jar_small',      label: 'Jar Small'   },
  { value: 'jar_medium',     label: 'Jar Medium'  },
  { value: 'jar_large',      label: 'Jar Large'   },
  { value: 'big_bottle',     label: 'Big Bottle'  },
];

const STATUSES = [
  { value: 'in_shop',              label: 'In Shop'            },
  { value: 'with_supplier',        label: 'With Supplier'      },
  { value: 'delivered_to_counter', label: 'At Counter/Shop'    },
  { value: 'sold',                 label: 'Sold'               },
  { value: 'sample',               label: 'Sample'             },
  { value: 'returned',             label: 'Returned'           },
  { value: 'damaged',              label: 'Damaged'            },
];

const RETURN_REASONS = [
  { value: 'damaged',      label: 'Damaged'       },
  { value: 'old_stock',    label: 'Old Stock'     },
  { value: 'not_selling',  label: 'Not Selling'   },
  { value: 'other',        label: 'Other'         },
];

const statusStyle = {
  in_shop:              { bg: 'rgba(82,183,136,0.12)',  color: '#52b788', border: 'rgba(82,183,136,0.25)'  },
  with_supplier:        { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.25)'  },
  delivered_to_counter: { bg: 'rgba(244,196,48,0.12)',  color: '#f4c430', border: 'rgba(244,196,48,0.25)'  },
  sold:                 { bg: 'rgba(34,197,94,0.12)',   color: '#4ade80', border: 'rgba(34,197,94,0.25)'   },
  sample:               { bg: 'rgba(168,85,247,0.12)',  color: '#c084fc', border: 'rgba(168,85,247,0.25)'  },
  returned:             { bg: 'rgba(251,146,60,0.12)',  color: '#fb923c', border: 'rgba(251,146,60,0.25)'  },
  damaged:              { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.25)'   },
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
  weight_per_unit_grams: '',
  quantity: '',
  status: 'in_shop',
  label: '',
  destination: '',
  supplier_name: '',
};

// Auto-fill weight based on packing type
const DEFAULT_WEIGHTS = {
  normal_half_kg: 500,
  normal_1kg: 1000,
  jar_small: 200,
  jar_medium: 400,
  jar_large: 750,
  big_bottle: 1500,
};

export default function PackedPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [filter, setFilter]         = useState({ status: '', type: '', product_type: '' });
  const [returnModal, setReturnModal] = useState(null); // { id, current }
  const [returnData, setReturnData] = useState({ reason: 'damaged', notes: '' });

  const canManage = user?.role === 'manager' || user?.role === 'owner';

  const fetchItems = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.status) params.append('status', filter.status);
    if (filter.type)   params.append('type', filter.type);
    if (filter.product_type) params.append('product_type', filter.product_type);
    api.get(`/packed?${params}`)
      .then(r => setItems(r.data))
      .catch(() => toast.error('Fetch failed', 'Could not load packed items.'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchItems, [filter]);

  // Auto-fill weight when packing type changes
  const handlePackingTypeChange = (val) => {
    setForm(f => ({
      ...f,
      packing_type: val,
      weight_per_unit_grams: DEFAULT_WEIGHTS[val] || f.weight_per_unit_grams
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/packed', form);
      setShowForm(false);
      setForm(emptyForm);
      fetchItems();
      toast.success('Packed item added!', `${form.quantity} units × ${form.weight_per_unit_grams}g recorded.`);
    } catch (err) {
      toast.error('Save failed', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    // If marking as returned/damaged, open the return modal
    if (newStatus === 'returned' || newStatus === 'damaged') {
      setReturnModal({ id, newStatus });
      setReturnData({ reason: newStatus === 'damaged' ? 'damaged' : 'not_selling', notes: '' });
      return;
    }
    try {
      await api.put(`/packed/${id}`, { status: newStatus });
      fetchItems();
      const s = STATUSES.find(s => s.value === newStatus);
      toast.info('Status updated', `Item moved to "${s?.label}".`);
    } catch {
      toast.error('Update failed', 'Could not update status.');
    }
  };

  const submitReturn = async () => {
    if (!returnModal) return;
    try {
      await api.put(`/packed/${returnModal.id}`, {
        status: returnModal.newStatus,
        return_reason: returnData.reason,
        return_notes: returnData.notes,
      });
      setReturnModal(null);
      fetchItems();
      toast.warning('Return recorded', `Item marked as ${returnModal.newStatus}.`);
    } catch {
      toast.error('Update failed', 'Could not record return.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this packed item?')) return;
    try {
      await api.delete(`/packed/${id}`);
      fetchItems();
      toast.warning('Item deleted', 'Packed item removed from records.');
    } catch {
      toast.error('Delete failed', 'Could not delete this item.');
    }
  };

  const selectStyle = (val, map) => ({
    ...inputStyle,
    background: map[val]?.bg || 'rgba(255,255,255,0.05)',
    color: map[val]?.color || '#e8f5ef',
    border: `1px solid ${map[val]?.border || 'rgba(255,255,255,0.1)'}`,
    cursor: 'pointer',
    fontFamily: 'Syne, sans-serif',
    fontWeight: 600,
    fontSize: 12,
    padding: '6px 10px',
    width: '100%',
    minWidth: '140px',
    borderRadius: 8,
    appearance: 'none',
  });

  return (
    <div className="flex min-h-screen" style={{ background: '#0a1e14' }}>
      <Sidebar />

      {/* Return Modal */}
      {returnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl p-6 w-full max-w-md fade-up"
            style={{ background: '#132d20', border: '1px solid rgba(251,146,60,0.3)', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(251,146,60,0.15)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
              </div>
              <div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e8f5ef', fontSize: 16 }}>
                  Record Return / Damage
                </h3>
                <p style={{ color: '#52b788', fontSize: 12 }}>Please provide return details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Reason</label>
                <select value={returnData.reason} onChange={e => setReturnData(d => ({ ...d, reason: e.target.value }))}
                  style={{ ...inputStyle, appearance: 'none' }} className="cc-input">
                  {RETURN_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Notes (optional)</label>
                <input type="text" value={returnData.notes} placeholder="Any additional details..."
                  onChange={e => setReturnData(d => ({ ...d, notes: e.target.value }))}
                  style={inputStyle} className="cc-input" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setReturnModal(null)}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{ color: '#52b788', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'DM Sans, sans-serif' }}>
                Cancel
              </button>
              <button onClick={submitReturn}
                className="flex-1 py-3 rounded-xl text-sm font-bold"
                style={{ background: 'rgba(251,146,60,0.15)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.3)', fontFamily: 'Syne, sans-serif' }}>
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 md:ml-64 p-4 sm:p-6 md:p-8 pb-28 md:pb-8 w-full max-w-full overflow-x-hidden">
        <div className="max-w-6xl mx-auto w-full">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8 fade-up">
            <div className="w-full sm:w-auto">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-6 rounded-full shrink-0" style={{ background: '#f4c430' }} />
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(20px, 4vw, 26px)', color: '#e8f5ef', letterSpacing: '-0.02em' }}>
                  Packed Items
                </h1>
              </div>
              <p style={{ color: '#52b788', fontSize: 13, paddingLeft: 14 }}>Track packing, deliveries, samples and returns</p>
            </div>
            {canManage && (
              <button onClick={() => setShowForm(!showForm)}
                className="cc-btn-primary w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 sm:py-3 rounded-xl text-sm font-medium shrink-0 transition-transform active:scale-95">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  {showForm ? (<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>) : (<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>)}
                </svg>
                {showForm ? 'Close Form' : 'Add Packed'}
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6 w-full">
            {[
              { label: 'All Products',  key: 'product_type', options: PRODUCT_TYPES.map(p => ({ value: p, label: p })) },
              { label: 'All Statuses',  key: 'status',       options: STATUSES      },
              { label: 'All Packaging', key: 'type',         options: PACKING_TYPES },
            ].map(({ label, key, options }) => (
              <div key={key} className="flex-1 sm:w-48 relative">
                <select value={filter[key]} onChange={e => setFilter({ ...filter, [key]: e.target.value })}
                  style={{ ...inputStyle, padding: '12px 14px', borderRadius: 10, fontSize: 13, appearance: 'none' }}
                  className="cc-input w-full cursor-pointer">
                  <option value="">{label}</option>
                  {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#52b788]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </div>
            ))}
          </div>

          {/* Status summary chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {STATUSES.map(s => {
              const count = items.filter(i => i.status === s.value).length;
              if (!count && filter.status !== s.value) return null;
              const st = statusStyle[s.value];
              return (
                <button key={s.value}
                  onClick={() => setFilter(f => ({ ...f, status: f.status === s.value ? '' : s.value }))}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: filter.status === s.value ? st.bg : 'rgba(255,255,255,0.03)',
                    color: filter.status === s.value ? st.color : '#7fb89a',
                    border: `1px solid ${filter.status === s.value ? st.border : 'rgba(255,255,255,0.06)'}`,
                    fontFamily: 'Syne, sans-serif'
                  }}>
                  {s.label} {count > 0 && <span className="ml-1 opacity-70">{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Form */}
          {showForm && canManage && (
            <div className="rounded-2xl p-5 sm:p-6 mb-8 fade-up"
              style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(244,196,48,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#e8f5ef', marginBottom: 20 }}>
                New Packed Entry
              </h2>
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
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                      className="cc-input" style={{ ...inputStyle, appearance: 'none' }}>
                      {STATUSES.filter(s => !['returned','damaged'].includes(s.value)).map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Label (optional)</label>
                    <input type="text" value={form.label} placeholder="e.g. 500g Masala Jar"
                      onChange={e => setForm({ ...form, label: e.target.value })}
                      className="cc-input" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Supplier Name</label>
                    <input type="text" value={form.supplier_name} placeholder="e.g. Ravi Kumar"
                      onChange={e => setForm({ ...form, supplier_name: e.target.value })}
                      className="cc-input" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Counter / Shop</label>
                    <input type="text" value={form.destination} placeholder="e.g. MG Road Counter"
                      onChange={e => setForm({ ...form, destination: e.target.value })}
                      className="cc-input" style={inputStyle} />
                  </div>
                </div>

                {form.weight_per_unit_grams && form.quantity && (
                  <div className="rounded-xl px-4 py-3 mb-5 flex items-center flex-wrap gap-2"
                    style={{ background: 'rgba(244,196,48,0.08)', border: '1px solid rgba(244,196,48,0.15)' }}>
                    <span style={{ color: '#52b788', fontSize: 13 }}>Total calculated weight:</span>
                    <span style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>
                      {((form.weight_per_unit_grams * form.quantity) / 1000).toFixed(3)} kg
                    </span>
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-6 py-3.5 sm:py-3 rounded-xl text-sm font-medium transition-all w-full sm:w-auto text-center hover:bg-white/5 active:scale-95"
                    style={{ color: '#52b788', fontFamily: 'DM Sans, sans-serif', border: '1px solid rgba(255,255,255,0.08)' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="cc-btn-primary flex items-center justify-center gap-2 px-8 py-3.5 sm:py-3 rounded-xl text-sm font-medium w-full sm:w-auto active:scale-95">
                    {saving ? (<><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Saving…</>) : 'Save Entry'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table */}
          <div className="rounded-2xl w-full flex flex-col"
            style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
            <div className="overflow-x-auto w-full custom-scroll" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full text-sm min-w-[1100px] text-left">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Date','Product','Label','Type','Wt/Unit','Qty','Total kg','Supplier','Counter/Shop','Status',''].map((h, i) => (
                      <th key={i}
                        className={`py-4 px-3 text-xs font-semibold uppercase tracking-widest whitespace-nowrap ${[4,5,6].includes(i) ? 'text-right' : 'text-left'}`}
                        style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', background: 'rgba(0,0,0,0.15)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan={11} className="text-center py-16">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                        <span style={{ color: '#52b788' }}>Loading items…</span>
                      </div>
                    </td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={11} className="text-center py-20 px-4">
                      <div className="flex flex-col items-center">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#52b788" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-70">
                          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                        </svg>
                        <p style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 16 }}>No packed items found</p>
                        <p style={{ color: '#2d6a4f', fontSize: 14, marginTop: 6 }}>Add a packed entry or adjust your filters.</p>
                      </div>
                    </td></tr>
                  ) : items.map((item) => {
                    const ts = typeStyle[item.packing_type] || typeStyle.normal_half_kg;
                    const ss = statusStyle[item.status] || statusStyle.in_shop;
                    const isReturn = item.status === 'returned' || item.status === 'damaged';
                    return (
                      <tr key={item._id} className="table-row hover:bg-white/[0.02] transition-colors"
                        style={isReturn ? { background: 'rgba(239,68,68,0.02)' } : {}}>
                        <td className="px-3 py-4 whitespace-nowrap" style={{ color: '#7fb89a', fontSize: 12 }}>
                          {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap" style={{ color: '#e8f5ef', fontSize: 12 }}>
                          {item.product_type}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap" style={{ color: '#7fb89a', fontSize: 12 }}>
                          {item.label || '—'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold inline-block"
                            style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}`, fontFamily: 'Syne, sans-serif' }}>
                            {PACKING_TYPES.find(t => t.value === item.packing_type)?.label || item.packing_type}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-right whitespace-nowrap" style={{ color: '#7fb89a', fontSize: 12 }}>
                          {item.weight_per_unit_grams}g
                        </td>
                        <td className="px-3 py-4 text-right font-bold whitespace-nowrap" style={{ color: '#e8f5ef', fontFamily: 'Syne, sans-serif' }}>
                          {item.quantity}
                        </td>
                        <td className="px-3 py-4 text-right font-bold whitespace-nowrap" style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif' }}>
                          {item.total_weight_kg?.toFixed(3)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap" style={{ color: '#7fb89a', fontSize: 12 }}>
                          {item.supplier_name || '—'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap" style={{ color: '#7fb89a', fontSize: 12 }}>
                          {item.destination || '—'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          {isReturn ? (
                            <div>
                              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold inline-block"
                                style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, fontFamily: 'Syne, sans-serif' }}>
                                {STATUSES.find(s => s.value === item.status)?.label}
                              </span>
                              {item.return_reason && (
                                <p style={{ color: '#7fb89a', fontSize: 10, marginTop: 2 }}>
                                  {RETURN_REASONS.find(r => r.value === item.return_reason)?.label}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="w-[150px]">
                              <select value={item.status} onChange={e => handleStatusChange(item._id, e.target.value)}
                                style={selectStyle(item.status, statusStyle)}
                                className="focus:ring-2 focus:ring-[#f4c430]/50">
                                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                              </select>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-right">
                          {canManage && (
                            <button onClick={() => handleDelete(item._id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                              style={{ color: '#7fb89a', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Sans, sans-serif' }}>
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