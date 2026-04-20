import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

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

const emptyForm = { name: '', type: 'counter', location: '', contact: '' };

export default function CountersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [counters, setCounters] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [saving, setSaving]     = useState(false);
  const [editId, setEditId]     = useState(null);

  const canManage = user?.role === 'manager' || user?.role === 'owner';

  const fetchCounters = () => {
    setLoading(true);
    api.get('/counters')
      .then(r => setCounters(r.data))
      .catch(() => toast.error('Fetch failed', 'Could not load counters.'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchCounters, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/counters/${editId}`, form);
        toast.success('Counter updated!', `${form.name} has been updated.`);
      } else {
        await api.post('/counters', form);
        toast.success('Counter added!', `${form.name} has been added.`);
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
      fetchCounters();
    } catch (err) {
      toast.error('Save failed', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (counter) => {
    setForm({ name: counter.name, type: counter.type, location: counter.location || '', contact: counter.contact || '' });
    setEditId(counter._id);
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}"?`)) return;
    try {
      await api.delete(`/counters/${id}`);
      fetchCounters();
      toast.warning('Counter removed', `${name} has been removed.`);
    } catch {
      toast.error('Delete failed', 'Could not remove this counter.');
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#0a1e14' }}>
      <Sidebar />
      <main className="flex-1 min-w-0 md:ml-64 p-4 sm:p-6 md:p-8 pb-28 md:pb-8 w-full max-w-full overflow-x-hidden">
        <div className="max-w-4xl mx-auto w-full">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8 fade-up">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-6 rounded-full" style={{ background: '#f4c430' }} />
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#e8f5ef', letterSpacing: '-0.02em' }}>
                  Counters & Shops
                </h1>
              </div>
              <p style={{ color: '#52b788', fontSize: 13, paddingLeft: 14 }}>Manage roadside counters and shop locations</p>
            </div>
            {canManage && (
              <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }}
                className="cc-btn-primary w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 sm:py-3 rounded-xl text-sm font-medium shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  {showForm && !editId ? (<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>) : (<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>)}
                </svg>
                {showForm && !editId ? 'Cancel' : 'Add Counter'}
              </button>
            )}
          </div>

          {/* Form */}
          {showForm && canManage && (
            <div className="rounded-2xl p-5 sm:p-6 mb-8 fade-up"
              style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(244,196,48,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#e8f5ef', marginBottom: 20 }}>
                {editId ? 'Edit Counter / Shop' : 'New Counter / Shop'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Name *</label>
                    <input type="text" required value={form.name} placeholder="e.g. MG Road Counter"
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="cc-input" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Type</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                      className="cc-input" style={{ ...inputStyle, appearance: 'none' }}>
                      <option value="counter">Roadside Counter</option>
                      <option value="shop">Shop</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Location</label>
                    <input type="text" value={form.location} placeholder="e.g. Near Bus Stand, Main Road"
                      onChange={e => setForm({ ...form, location: e.target.value })}
                      className="cc-input" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#52b788', marginBottom: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>Contact</label>
                    <input type="text" value={form.contact} placeholder="Phone number or owner name"
                      onChange={e => setForm({ ...form, contact: e.target.value })}
                      className="cc-input" style={inputStyle} />
                  </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                    className="px-6 py-3.5 sm:py-3 rounded-xl text-sm font-medium w-full sm:w-auto text-center"
                    style={{ color: '#52b788', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'DM Sans, sans-serif' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="cc-btn-primary flex items-center justify-center gap-2 px-8 py-3.5 sm:py-3 rounded-xl text-sm font-medium w-full sm:w-auto">
                    {saving ? (<><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Saving…</>) : editId ? 'Update' : 'Add Counter'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Counters Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2">
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
              <span style={{ color: '#52b788' }}>Loading counters…</span>
            </div>
          ) : counters.length === 0 ? (
            <div className="flex flex-col items-center py-20">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#52b788" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-70">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <p style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 16 }}>No counters yet</p>
              <p style={{ color: '#2d6a4f', fontSize: 14, marginTop: 6 }}>Add your first roadside counter or shop above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {counters.map(counter => (
                <div key={counter._id} className="rounded-2xl p-5 relative overflow-hidden stat-card"
                  style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
                  {/* Type badge */}
                  <div className="absolute top-4 right-4">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                      style={counter.type === 'counter'
                        ? { background: 'rgba(244,196,48,0.12)', color: '#f4c430', border: '1px solid rgba(244,196,48,0.25)', fontFamily: 'Syne, sans-serif' }
                        : { background: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)', fontFamily: 'Syne, sans-serif' }
                      }>
                      {counter.type === 'counter' ? 'Counter' : 'Shop'}
                    </span>
                  </div>

                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: counter.type === 'counter' ? 'rgba(244,196,48,0.1)' : 'rgba(96,165,250,0.1)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke={counter.type === 'counter' ? '#f4c430' : '#60a5fa'}
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {counter.type === 'counter'
                        ? <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>
                        : <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></>
                      }
                    </svg>
                  </div>

                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e8f5ef', fontSize: 16, marginBottom: 6 }}>
                    {counter.name}
                  </h3>
                  {counter.location && (
                    <div className="flex items-start gap-2 mb-2">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#52b788" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span style={{ color: '#7fb89a', fontSize: 13 }}>{counter.location}</span>
                    </div>
                  )}
                  {counter.contact && (
                    <div className="flex items-center gap-2 mb-4">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#52b788" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.4 2.82h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <span style={{ color: '#7fb89a', fontSize: 13 }}>{counter.contact}</span>
                    </div>
                  )}

                  {canManage && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleEdit(counter)}
                        className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                        style={{ color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.05)', fontFamily: 'DM Sans, sans-serif' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.12)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(counter._id, counter.name)}
                        className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                        style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', fontFamily: 'DM Sans, sans-serif' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}>
                        Remove
                      </button>
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