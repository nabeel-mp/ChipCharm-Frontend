import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api     from '../api/axios';
import { useToast } from '../components/Toast';

const today = () => new Date().toISOString().split('T')[0];

const PACKING_TYPES = [
  { value: 'kg_pack', label: 'KG Pack' },
  { value: 'jar',     label: 'Jar'     },
  { value: 'normal',  label: 'Normal'  },
];
const STATUSES = [
  { value: 'in_shop', label: 'In Shop' },
  { value: 'sold',    label: 'Sold'    },
  { value: 'sample',  label: 'Sample'  },
];

const statusStyle = {
  in_shop: { bg: 'rgba(82,183,136,0.12)', color: '#52b788',  border: 'rgba(82,183,136,0.25)'  },
  sold:    { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa',  border: 'rgba(59,130,246,0.25)'  },
  sample:  { bg: 'rgba(168,85,247,0.12)', color: '#c084fc',  border: 'rgba(168,85,247,0.25)'  },
};
const typeStyle = {
  kg_pack: { bg: 'rgba(244,196,48,0.1)',  color: '#f4c430',  border: 'rgba(244,196,48,0.2)'  },
  jar:     { bg: 'rgba(251,146,60,0.1)',  color: '#fb923c',  border: 'rgba(251,146,60,0.2)'  },
  normal:  { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: 'rgba(148,163,184,0.15)' },
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
};

const emptyForm = { date: today(), packing_type: 'normal', weight_per_unit_grams: '', quantity: '', status: 'in_shop', label: '' };

export default function PackedPage() {
  const toast = useToast();
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [saving, setSaving]     = useState(false);
  const [filter, setFilter]     = useState({ status: '', type: '' });

  const fetchItems = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.status) params.append('status', filter.status);
    if (filter.type)   params.append('type',   filter.type);
    api.get(`/packed?${params}`)
      .then(r => setItems(r.data))
      .catch(() => toast.error('Fetch failed', 'Could not load packed items.'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchItems, [filter]);

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
    try {
      await api.put(`/packed/${id}`, { status: newStatus });
      fetchItems();
      const s = STATUSES.find(s => s.value === newStatus);
      toast.info('Status updated', `Item moved to "${s?.label}".`);
    } catch {
      toast.error('Update failed', 'Could not update status.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this packed item?')) return;
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
    width: 'auto',
    borderRadius: 8,
    appearance: 'none',
  });

  return (
    <div className="flex" style={{ minHeight: '100vh', background: '#0a1e14' }}>
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-6 fade-up">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-6 rounded-full" style={{ background: '#f4c430' }} />
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#e8f5ef', letterSpacing: '-0.02em' }}>
                  Packed Items
                </h1>
              </div>
              <p style={{ color: '#52b788', fontSize: 14, paddingLeft: 14 }}>Track packing, sales and samples</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="cc-btn-primary flex items-center gap-2 px-5 py-3 rounded-xl text-sm"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Packed
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-5">
            {[
              { label: 'All Status', key: 'status', options: STATUSES },
              { label: 'All Types',  key: 'type',   options: PACKING_TYPES },
            ].map(({ label, key, options }) => (
              <select
                key={key}
                value={filter[key]}
                onChange={e => setFilter({ ...filter, [key]: e.target.value })}
                style={{
                  ...inputStyle,
                  width: 'auto',
                  padding: '8px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                }}
                className="cc-input"
              >
                <option value="">{label}</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ))}
          </div>

          {/* Form */}
          {showForm && (
            <div
              className="rounded-2xl p-6 mb-6 fade-up"
              style={{
                background: 'linear-gradient(145deg, #132d20, #0f2419)',
                border: '1px solid rgba(244,196,48,0.15)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
            >
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#e8f5ef', marginBottom: 20 }}>
                New Packed Entry
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    { label: 'Date', type: 'date', field: 'date', required: true },
                    { label: 'Label (optional)', type: 'text', field: 'label', placeholder: 'e.g. 500g Masala Jar' },
                    { label: 'Weight per Unit (grams)', type: 'number', field: 'weight_per_unit_grams', placeholder: 'e.g. 500', required: true, min: 1 },
                    { label: 'Quantity (units)', type: 'number', field: 'quantity', placeholder: 'e.g. 20', required: true, min: 1 },
                  ].map(({ label, type, field, required, placeholder, min }) => (
                    <div key={field}>
                      <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                      <input type={type} required={required} min={min} value={form[field]} placeholder={placeholder}
                        onChange={e => setForm({ ...form, [field]: e.target.value })}
                        className="cc-input" style={inputStyle} />
                    </div>
                  ))}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Packing Type</label>
                    <select value={form.packing_type} onChange={e => setForm({ ...form, packing_type: e.target.value })}
                      className="cc-input" style={inputStyle}>
                      {PACKING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                      className="cc-input" style={inputStyle}>
                      {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>

                {form.weight_per_unit_grams && form.quantity && (
                  <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-2"
                    style={{ background: 'rgba(244,196,48,0.08)', border: '1px solid rgba(244,196,48,0.15)' }}>
                    <span style={{ color: '#52b788', fontSize: 13 }}>Total weight:</span>
                    <span style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>
                      {((form.weight_per_unit_grams * form.quantity) / 1000).toFixed(3)} kg
                    </span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="submit" disabled={saving} className="cc-btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm">
                    {saving ? (
                      <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Saving…</>
                    ) : 'Save'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-5 py-2.5 rounded-xl text-sm"
                    style={{ color: '#52b788', fontFamily: 'DM Sans, sans-serif', border: '1px solid rgba(255,255,255,0.08)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table */}
          <div className="rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #132d20, #0f2419)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Date','Label','Type','Wt/Unit','Qty','Total kg','Status',''].map((h, i) => (
                    <th key={i}
                      className={`py-4 px-4 text-xs font-semibold uppercase tracking-widest ${[3,4,5].includes(i) ? 'text-right' : 'text-left'}`}
                      style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', background: 'rgba(0,0,0,0.15)' }}
                    >{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-16">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                      <span style={{ color: '#52b788' }}>Loading items…</span>
                    </div>
                  </td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#52b788" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-70">
                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
                      </svg>
                      <p style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>No packed items</p>
                      <p style={{ color: '#2d6a4f', fontSize: 13, marginTop: 4 }}>Start by adding your first packed entry</p>
                    </div>
                  </td></tr>
                ) : items.map((item, idx) => {
                  const ts = typeStyle[item.packing_type] || typeStyle.normal;
                  const ss = statusStyle[item.status] || statusStyle.in_shop;
                  return (
                    <tr key={item._id} className="table-row"
                      style={{ borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td className="px-4 py-3.5" style={{ color: '#7fb89a', fontSize: 13 }}>
                        {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-4 py-3.5 font-medium" style={{ color: '#e8f5ef', fontFamily: 'Syne, sans-serif', fontSize: 13 }}>
                        {item.label || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}`, fontFamily: 'Syne, sans-serif' }}>
                          {PACKING_TYPES.find(t => t.value === item.packing_type)?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right" style={{ color: '#7fb89a', fontSize: 13 }}>{item.weight_per_unit_grams}g</td>
                      <td className="px-4 py-3.5 text-right font-bold" style={{ color: '#e8f5ef', fontFamily: 'Syne, sans-serif' }}>{item.quantity}</td>
                      <td className="px-4 py-3.5 text-right font-bold" style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif' }}>{item.total_weight_kg?.toFixed(3)}</td>
                      <td className="px-4 py-3.5">
                        <select
                          value={item.status}
                          onChange={e => handleStatusChange(item._id, e.target.value)}
                          style={selectStyle(item.status, statusStyle)}
                        >
                          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => handleDelete(item._id)}
                          className="px-3 py-1.5 rounded-lg text-xs transition-all"
                          style={{ color: '#7fb89a', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Sans, sans-serif' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7fb89a'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                        >
                          Delete
                        </button>
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