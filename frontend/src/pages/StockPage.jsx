import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api     from '../api/axios';

const today = () => new Date().toISOString().split('T')[0];

export default function StockPage() {
  const [entries, setEntries]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ date: today(), produced_kg: '', notes: '' });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const fetchEntries = () => {
    setLoading(true);
    api.get('/stock')
      .then(r => setEntries(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchEntries, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/stock', form);
      setShowForm(false);
      setForm({ date: today(), produced_kg: '', notes: '' });
      fetchEntries();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    await api.delete(`/stock/${id}`);
    fetchEntries();
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 p-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Daily Stock</h1>
              <p className="text-gray-400 text-sm">Track daily chip production</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm
                         font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              + Add Entry
            </button>
          </div>

          {/* Add form */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-gray-100
                         shadow-sm p-6 mb-6"
            >
              <h2 className="font-semibold text-gray-900 mb-4">New Production Entry</h2>
              {error && (
                <p className="text-red-500 text-sm mb-3">{error}</p>
              )}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                               text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produced (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={form.produced_kg}
                    onChange={e => setForm({ ...form, produced_kg: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                               text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="e.g. 50"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Any notes for today…"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm
                             font-semibold px-5 py-2.5 rounded-xl transition-colors
                             disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Entry'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2.5"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold
                                 text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold
                                 text-gray-500 uppercase tracking-wider">Opening (kg)</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold
                                 text-gray-500 uppercase tracking-wider">Produced (kg)</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold
                                 text-gray-500 uppercase tracking-wider">Closing (kg)</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold
                                 text-gray-500 uppercase tracking-wider">Notes</th>
                  <th className="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                    Loading…
                  </td></tr>
                ) : entries.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                    No entries yet. Add your first production entry.
                  </td></tr>
                ) : entries.map((e) => (
                  <tr key={e._id} className="border-b border-gray-50 hover:bg-gray-50
                                             transition-colors">
                    <td className="px-5 py-4 text-gray-900 font-medium">
                      {new Date(e.date).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-4 text-right text-gray-600">
                      {e.opening_stock_kg?.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-right text-orange-600 font-semibold">
                      {e.produced_kg?.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-right text-green-600 font-semibold">
                      {e.closing_stock_kg?.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">{e.notes || '—'}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleDelete(e._id)}
                        className="text-red-400 hover:text-red-600 text-xs"
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