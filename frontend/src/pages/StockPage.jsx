import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api     from '../api/axios';
import { useToast } from '../components/Toast';
import { useAuth }  from '../context/AuthContext';
import logo    from '../assets/ChipcharmLogo.png';

const today = () => new Date().toISOString().split('T')[0];

export const PRODUCT_TYPES = [
  'Salted Banana Chips',
  'Spicy Banana Chips',
  'Sweet Banana Chips',
  'Banana 4 Cut',
  'Jaggery'
];

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#e8f5ef',
  fontFamily: 'DM Sans, sans-serif',
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 14,
  width: '100%',
  transition: 'all 0.2s',
  outline: 'none',
};

export default function StockPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ date: today(), product_type: PRODUCT_TYPES[0], produced_kg: '', notes: '' });
  const [saving, setSaving]     = useState(false);
  const [filterType, setFilterType] = useState('');

  // Only managers and owners can add or delete stock entries
  const canManage = user?.role === 'manager' || user?.role === 'owner';

  const fetchEntries = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.append('product_type', filterType);

    api.get(`/stock?${params}`)
      .then(r => setEntries(r.data))
      .catch(() => toast.error('Fetch failed', 'Could not load stock entries.'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchEntries, [filterType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/stock', form);
      setShowForm(false);
      setForm({ date: today(), product_type: PRODUCT_TYPES[0], produced_kg: '', notes: '' });
      fetchEntries();
      toast.success('Entry saved!', `${form.produced_kg} kg production recorded.`);
    } catch (err) {
      toast.error('Save failed', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await api.delete(`/stock/${id}`);
      fetchEntries();
      toast.warning('Entry deleted', 'Stock entry has been removed.');
    } catch {
      toast.error('Delete failed', 'Could not delete this entry.');
    }
  };

  return (
    <div className="flex" style={{ minHeight: '100vh', background: '#0a1e14' }}>
      <Sidebar />
      <main className="md:ml-64 flex-1 p-5 md:p-8 pb-28 md:pb-8 w-full max-w-[100vw] overflow-x-hidden">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-6 md:mb-8 fade-up">
            <div className="flex justify-between items-start md:items-center mb-5 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-6 rounded-full" style={{ background: '#f4c430' }} />
                  <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#e8f5ef', letterSpacing: '-0.02em' }}>
                    Daily Stock
                  </h1>
                </div>
                <p style={{ color: '#52b788', fontSize: 13, paddingLeft: 14 }}>Track daily chip production batches</p>
              </div>

              {/* Top Right Logo (Visible on mobile) & Desktop Add Button */}
              <div className="flex items-center gap-3">
                <div 
                  className="md:hidden w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 bg-white p-1 overflow-hidden"
                  style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.35)' }}
                >
                  <img src={logo} alt="ChipCharm Logo" className="w-full h-full object-contain" />
                </div>

                {/* Desktop Add Button */}
                {canManage && (
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="hidden md:flex cc-btn-primary items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm whitespace-nowrap"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      {showForm ? (
                        <>
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </>
                      ) : (
                        <>
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </>
                      )}
                    </svg>
                    {showForm ? 'Close' : 'Add Entry'}
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Add Button */}
            {canManage && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="md:hidden cc-btn-primary w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm shadow-lg mb-5"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  {showForm ? (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </>
                  ) : (
                    <>
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </>
                  )}
                </svg>
                {showForm ? 'Close Form' : 'Add Entry'}
              </button>
            )}

            {/* Product Filter Tabs (Modern Pill Design) */}
            <div className="relative w-full mt-2">
              <style>{`.filter-scroll::-webkit-scrollbar { display: none; }`}</style>
              <div 
                className="flex overflow-x-auto gap-2.5 pb-2 w-full snap-x filter-scroll" 
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {[{ label: 'All Products', value: '' }, ...PRODUCT_TYPES.map(p => ({ label: p, value: p }))].map((opt) => {
                  const isActive = filterType === opt.value;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setFilterType(opt.value)}
                      className={`snap-start whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                        isActive
                          ? 'bg-[#f4c430] text-[#0a1e14] border-[#f4c430] shadow-[0_0_15px_rgba(244,196,48,0.2)]'
                          : 'bg-[rgba(255,255,255,0.03)] text-[#7fb89a] border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[#e8f5ef]'
                      }`}
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form */}
          {showForm && canManage && (
            <div
              className="rounded-2xl p-5 md:p-6 mb-6 fade-up"
              style={{
                background: 'linear-gradient(145deg, #132d20, #0f2419)',
                border: '1px solid rgba(244,196,48,0.15)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
            >
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#e8f5ef', marginBottom: 20 }}>
                New Production Entry
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</label>
                    <input type="date" required value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                      className="cc-input" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Product Type</label>
                    <select 
                      value={form.product_type} 
                      onChange={e => setForm({ ...form, product_type: e.target.value })} 
                      className="cc-input" 
                      style={{ ...inputStyle, appearance: 'none' }}
                    >
                      {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Produced (kg)</label>
                    <input type="number" step="0.1" min="0" required value={form.produced_kg}
                      onChange={e => setForm({ ...form, produced_kg: e.target.value })}
                      className="cc-input" style={inputStyle} placeholder="e.g. 50" />
                  </div>
                </div>
                <div className="mb-6">
                  <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notes (optional)</label>
                  <input type="text" value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="cc-input" style={inputStyle} placeholder="Any notes for today…" />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button type="submit" disabled={saving} className="cc-btn-primary flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 rounded-xl text-sm w-full sm:w-auto">
                    {saving ? (
                      <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Saving…</>
                    ) : 'Save Entry'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-5 py-3.5 sm:py-3 rounded-xl text-sm transition-all w-full sm:w-auto text-center"
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

          {/* Table Container */}
          <div
            className="rounded-2xl overflow-x-auto w-full custom-scroll"
            style={{
              background: 'linear-gradient(145deg, #132d20, #0f2419)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}
          >
            <table className="w-full text-sm min-w-[750px]">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Date', 'Product', 'Opening kg', 'Produced kg', 'Closing kg', 'Notes', ''].map((h, i) => (
                    <th key={i}
                      className={`py-4 px-5 text-xs font-semibold uppercase tracking-widest whitespace-nowrap ${[2, 3, 4].includes(i) ? 'text-right' : 'text-left'}`}
                      style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', background: 'rgba(0,0,0,0.15)' }}
                    >{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-16">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                      <span style={{ color: '#52b788' }}>Loading entries…</span>
                    </div>
                  </td></tr>
                ) : entries.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#52b788" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-70">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                        <path d="M9 14h6"/><path d="M9 10h6"/>
                      </svg>
                      <p style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>No entries yet</p>
                      <p style={{ color: '#2d6a4f', fontSize: 13, marginTop: 4 }}>Add your first production entry above</p>
                    </div>
                  </td></tr>
                ) : entries.map((e, idx) => (
                  <tr key={e._id} className="table-row hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: idx < entries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td className="px-5 py-4 whitespace-nowrap" style={{ color: '#e8f5ef', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>
                      {new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap" style={{ color: '#e8f5ef', fontSize: 13 }}>{e.product_type}</td>
                    <td className="px-5 py-4 text-right whitespace-nowrap" style={{ color: '#7fb89a' }}>{e.opening_stock_kg?.toFixed(2)}</td>
                    <td className="px-5 py-4 text-right font-bold whitespace-nowrap" style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif' }}>{e.produced_kg?.toFixed(2)}</td>
                    <td className="px-5 py-4 text-right font-bold whitespace-nowrap" style={{ color: '#52b788', fontFamily: 'Syne, sans-serif' }}>{e.closing_stock_kg?.toFixed(2)}</td>
                    <td className="px-5 py-4 whitespace-nowrap truncate max-w-[150px]" style={{ color: '#2d6a4f', fontSize: 12 }}>{e.notes || '—'}</td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      {canManage && (
                        <button onClick={() => handleDelete(e._id)}
                          className="px-3 py-1.5 rounded-lg text-xs transition-all"
                          style={{ color: '#7fb89a', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Sans, sans-serif' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7fb89a'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}