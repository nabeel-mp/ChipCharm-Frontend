import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api     from '../api/axios';
import { useToast } from '../components/Toast';

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
  transition: 'all 0.2s',
  outline: 'none',
};

export default function StockPage() {
  const toast = useToast();
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ date: today(), produced_kg: '', notes: '' });
  const [saving, setSaving]     = useState(false);

  const fetchEntries = () => {
    setLoading(true);
    api.get('/stock')
      .then(r => setEntries(r.data))
      .catch(() => toast.error('Fetch failed', 'Could not load stock entries.'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchEntries, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/stock', form);
      setShowForm(false);
      setForm({ date: today(), produced_kg: '', notes: '' });
      fetchEntries();
      toast.success('Entry saved!', `${form.produced_kg} kg production recorded.`);
    } catch (err) {
      toast.error('Save failed', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
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
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-8 fade-up">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-6 rounded-full" style={{ background: '#f4c430' }} />
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#e8f5ef', letterSpacing: '-0.02em' }}>
                  Daily Stock
                </h1>
              </div>
              <p style={{ color: '#52b788', fontSize: 14, paddingLeft: 14 }}>Track daily chip production batches</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="cc-btn-primary flex items-center gap-2 px-5 py-3 rounded-xl text-sm"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Entry
            </button>
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
                New Production Entry
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</label>
                    <input type="date" required value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                      className="cc-input" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Produced (kg)</label>
                    <input type="number" step="0.1" min="0" required value={form.produced_kg}
                      onChange={e => setForm({ ...form, produced_kg: e.target.value })}
                      className="cc-input" style={inputStyle} placeholder="e.g. 50" />
                  </div>
                </div>
                <div className="mb-5">
                  <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notes (optional)</label>
                  <input type="text" value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="cc-input" style={inputStyle} placeholder="Any notes for today…" />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={saving} className="cc-btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm">
                    {saving ? (
                      <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Saving…</>
                    ) : 'Save Entry'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-5 py-2.5 rounded-xl text-sm transition-all"
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
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #132d20, #0f2419)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Date', 'Opening kg', 'Produced kg', 'Closing kg', 'Notes', ''].map((h, i) => (
                    <th key={i}
                      className={`py-4 px-5 text-xs font-semibold uppercase tracking-widest ${i > 0 && i < 4 ? 'text-right' : 'text-left'}`}
                      style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', background: 'rgba(0,0,0,0.15)' }}
                    >{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-16">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                      <span style={{ color: '#52b788' }}>Loading entries…</span>
                    </div>
                  </td></tr>
                ) : entries.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16">
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
                  <tr key={e._id} className="table-row"
                    style={{ borderBottom: idx < entries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td className="px-5 py-4" style={{ color: '#e8f5ef', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>
                      {new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-right" style={{ color: '#7fb89a' }}>{e.opening_stock_kg?.toFixed(2)}</td>
                    <td className="px-5 py-4 text-right font-bold" style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif' }}>{e.produced_kg?.toFixed(2)}</td>
                    <td className="px-5 py-4 text-right font-bold" style={{ color: '#52b788', fontFamily: 'Syne, sans-serif' }}>{e.closing_stock_kg?.toFixed(2)}</td>
                    <td className="px-5 py-4" style={{ color: '#2d6a4f', fontSize: 12 }}>{e.notes || '—'}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => handleDelete(e._id)}
                        className="px-3 py-1.5 rounded-lg text-xs transition-all"
                        style={{ color: '#7fb89a', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Sans, sans-serif' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7fb89a'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                      >
                        Delete
                      </button>
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