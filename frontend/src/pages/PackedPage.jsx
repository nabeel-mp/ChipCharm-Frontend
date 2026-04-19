import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
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
  transition: 'border-color 0.2s ease',
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
    minWidth: '110px',
    borderRadius: 8,
    appearance: 'none',
  });

  return (
    <div className="flex min-h-screen" style={{ background: '#0a1e14' }}>
      <Sidebar />
      
      {/* Main content wrapper: 
        - Responsive margin for sidebar (md:ml-64)
        - Responsive padding (p-4 to p-8)
        - min-w-0 prevents flex items from overflowing their container
      */}
      <main className="flex-1 min-w-0 md:ml-64 p-4 sm:p-6 md:p-8 pb-28 md:pb-8 w-full max-w-full overflow-x-hidden">
        <div className="max-w-6xl mx-auto w-full">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8 fade-up">
            <div className="w-full sm:w-auto">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-6 rounded-full shrink-0" style={{ background: '#f4c430' }} />
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(20px, 4vw, 26px)', color: '#e8f5ef', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  Packed Items
                </h1>
              </div>
              <p style={{ color: '#52b788', fontSize: 13, paddingLeft: 14 }}>Track packing, sales and samples</p>
            </div>
            
            <button
              onClick={() => setShowForm(!showForm)}
              className="cc-btn-primary w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 sm:py-3 rounded-xl text-sm font-medium shrink-0 transition-transform active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {showForm ? 'Close Form' : 'Add Packed'}
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full">
            {[
              { label: 'All Statuses', key: 'status', options: STATUSES },
              { label: 'All Types',    key: 'type',   options: PACKING_TYPES },
            ].map(({ label, key, options }) => (
              <div key={key} className="w-full sm:w-48 relative">
                <select
                  value={filter[key]}
                  onChange={e => setFilter({ ...filter, [key]: e.target.value })}
                  style={{ ...inputStyle, padding: '12px 14px', borderRadius: 10, fontSize: 13, appearance: 'none' }}
                  className="cc-input w-full cursor-pointer"
                >
                  <option value="">{label}</option>
                  {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {/* Custom dropdown arrow to replace native appearance */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#52b788]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          {showForm && (
            <div
              className="rounded-2xl p-5 sm:p-6 mb-8 fade-up"
              style={{
                background: 'linear-gradient(145deg, #132d20, #0f2419)',
                border: '1px solid rgba(244,196,48,0.15)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
            >
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#e8f5ef', marginBottom: 20 }}>
                New Packed Entry
              </h2>
              <form onSubmit={handleSubmit}>
                {/* Responsive Grid: 1 col on mobile, 2 on tablet, 3 on desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                  {[
                    { label: 'Date', type: 'date', field: 'date', required: true },
                    { label: 'Label (optional)', type: 'text', field: 'label', placeholder: 'e.g. 500g Masala Jar' },
                    { label: 'Weight/Unit (g)', type: 'number', field: 'weight_per_unit_grams', placeholder: 'e.g. 500', required: true, min: 1 },
                    { label: 'Quantity (units)', type: 'number', field: 'quantity', placeholder: 'e.g. 20', required: true, min: 1 },
                  ].map(({ label, type, field, required, placeholder, min }) => (
                    <div key={field} className="w-full">
                      <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                      <input type={type} required={required} min={min} value={form[field]} placeholder={placeholder}
                        onChange={e => setForm({ ...form, [field]: e.target.value })}
                        className="cc-input" style={inputStyle} />
                    </div>
                  ))}
                  
                  {/* Select Fields embedded within the same grid */}
                  <div className="w-full">
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Packing Type</label>
                    <select value={form.packing_type} onChange={e => setForm({ ...form, packing_type: e.target.value })} className="cc-input" style={{...inputStyle, appearance: 'none'}}>
                      {PACKING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="w-full">
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="cc-input" style={{...inputStyle, appearance: 'none'}}>
                      {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Total Weight Indicator */}
                {form.weight_per_unit_grams && form.quantity && (
                  <div className="rounded-xl px-4 py-3 mb-5 flex items-center flex-wrap gap-2"
                    style={{ background: 'rgba(244,196,48,0.08)', border: '1px solid rgba(244,196,48,0.15)' }}>
                    <span style={{ color: '#52b788', fontSize: 13 }}>Total calculated weight:</span>
                    <span style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>
                      {((form.weight_per_unit_grams * form.quantity) / 1000).toFixed(3)} kg
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-6 py-3.5 sm:py-3 rounded-xl text-sm font-medium transition-all w-full sm:w-auto text-center hover:bg-white/5 active:scale-95"
                    style={{ color: '#52b788', fontFamily: 'DM Sans, sans-serif', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="cc-btn-primary flex items-center justify-center gap-2 px-8 py-3.5 sm:py-3 rounded-xl text-sm font-medium w-full sm:w-auto active:scale-95">
                    {saving ? (
                      <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Saving…</>
                    ) : 'Save Entry'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table Container - Enclosed overflow specifically for mobile screens */}
          <div className="rounded-2xl w-full flex flex-col"
            style={{
              background: 'linear-gradient(145deg, #132d20, #0f2419)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}
          >
            <div className="overflow-x-auto w-full custom-scroll" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full text-sm min-w-[850px] text-left">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Date','Label','Type','Wt/Unit','Qty','Total kg','Status',''].map((h, i) => (
                      <th key={i}
                        className={`py-4 px-4 text-xs font-semibold uppercase tracking-widest whitespace-nowrap ${[3,4,5].includes(i) ? 'text-right' : 'text-left'}`}
                        style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', background: 'rgba(0,0,0,0.15)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-16">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                        <span style={{ color: '#52b788' }}>Loading items…</span>
                      </div>
                    </td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-20 px-4">
                      <div className="flex flex-col items-center">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#52b788" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-70">
                          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
                        </svg>
                        <p style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 16 }}>No packed items found</p>
                        <p style={{ color: '#2d6a4f', fontSize: 14, marginTop: 6, textAlign: 'center' }}>Start by adding your first packed entry or adjust filters.</p>
                      </div>
                    </td></tr>
                  ) : items.map((item) => {
                    const ts = typeStyle[item.packing_type] || typeStyle.normal;
                    return (
                      <tr key={item._id} className="table-row hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap" style={{ color: '#7fb89a', fontSize: 13 }}>
                          {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-4 font-medium whitespace-nowrap" style={{ color: '#e8f5ef', fontFamily: 'Syne, sans-serif', fontSize: 13 }}>
                          {item.label || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-block"
                            style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}`, fontFamily: 'Syne, sans-serif' }}>
                            {PACKING_TYPES.find(t => t.value === item.packing_type)?.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap" style={{ color: '#7fb89a', fontSize: 13 }}>
                          {item.weight_per_unit_grams}g
                        </td>
                        <td className="px-4 py-4 text-right font-bold whitespace-nowrap" style={{ color: '#e8f5ef', fontFamily: 'Syne, sans-serif' }}>
                          {item.quantity}
                        </td>
                        <td className="px-4 py-4 text-right font-bold whitespace-nowrap" style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif' }}>
                          {item.total_weight_kg?.toFixed(3)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap relative">
                           {/* Wrapping select to contain fixed widths without breaking table constraints */}
                           <div className="w-[120px]">
                              <select
                                value={item.status}
                                onChange={e => handleStatusChange(item._id, e.target.value)}
                                style={selectStyle(item.status, statusStyle)}
                                className="focus:ring-2 focus:ring-[#f4c430]/50"
                              >
                                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                              </select>
                           </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <button onClick={() => handleDelete(item._id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                            style={{ color: '#7fb89a', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Sans, sans-serif' }}
                            title="Delete Item"
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

        </div>
      </main>
    </div>
  );
}