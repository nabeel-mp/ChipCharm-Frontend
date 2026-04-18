import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api     from '../api/axios';

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

const statusColors = {
  in_shop: 'bg-green-100 text-green-700',
  sold:    'bg-blue-100  text-blue-700',
  sample:  'bg-purple-100 text-purple-700',
};
const typeColors = {
  kg_pack: 'bg-orange-100 text-orange-700',
  jar:     'bg-yellow-100 text-yellow-700',
  normal:  'bg-gray-100   text-gray-600',
};

const emptyForm = {
  date: today(), packing_type: 'normal',
  weight_per_unit_grams: '', quantity: '',
  status: 'in_shop', label: ''
};

export default function PackedPage() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState({ status: '', type: '' });

  const fetchItems = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.status) params.append('status', filter.status);
    if (filter.type)   params.append('type',   filter.type);
    api.get(`/packed?${params}`)
      .then(r => setItems(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchItems, [filter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/packed', form);
      setShowForm(false);
      setForm(emptyForm);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    await api.put(`/packed/${id}`, { status: newStatus });
    fetchItems();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this packed item?')) return;
    await api.delete(`/packed/${id}`);
    fetchItems();
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 p-8 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Packed Items</h1>
              <p className="text-gray-400 text-sm">Track packing, sales and samples</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm
                         font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              + Add Packed
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-5">
            <select
              value={filter.status}
              onChange={e => setFilter({ ...filter, status: e.target.value })}
              className="border border-gray-200 rounded-xl text-sm px-3 py-2
                         focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">All Status</option>
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={filter.type}
              onChange={e => setFilter({ ...filter, type: e.target.value })}
              className="border border-gray-200 rounded-xl text-sm px-3 py-2
                         focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">All Types</option>
              {PACKING_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Add form */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-gray-100
                         shadow-sm p-6 mb-6"
            >
              <h2 className="font-semibold text-gray-900 mb-4">New Packed Entry</h2>
              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" required value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                               text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Packing Type
                  </label>
                  <select value={form.packing_type}
                    onChange={e => setForm({ ...form, packing_type: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                               text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    {PACKING_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight per Unit (grams)
                  </label>
                  <input type="number" min="1" required
                    value={form.weight_per_unit_grams}
                    onChange={e => setForm({ ...form, weight_per_unit_grams: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                               text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="e.g. 500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity (units)
                  </label>
                  <input type="number" min="1" required
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                               text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="e.g. 20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                               text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    {STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label (optional)
                  </label>
                  <input type="text" value={form.label}
                    onChange={e => setForm({ ...form, label: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5
                               text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="e.g. 500g Masala Jar"
                  />
                </div>
              </div>
              {/* Preview */}
              {form.weight_per_unit_grams && form.quantity && (
                <div className="bg-orange-50 rounded-xl px-4 py-3 mb-4 text-sm text-orange-700">
                  Total weight:{' '}
                  <strong>
                    {((form.weight_per_unit_grams * form.quantity) / 1000).toFixed(3)} kg
                  </strong>
                </div>
              )}
              <div className="flex gap-3">
                <button type="submit" disabled={saving}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm
                             font-semibold px-5 py-2.5 rounded-xl transition-colors
                             disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
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
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Label</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Wt/Unit</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Total kg</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading…</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">
                    No packed items found.
                  </td></tr>
                ) : items.map((item) => (
                  <tr key={item._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3.5 text-gray-600">
                      {new Date(item.date).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short'
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-gray-900 font-medium">
                      {item.label || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium
                                        ${typeColors[item.packing_type]}`}>
                        {PACKING_TYPES.find(t => t.value === item.packing_type)?.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-600">
                      {item.weight_per_unit_grams}g
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-5 py-3.5 text-right text-orange-600 font-semibold">
                      {item.total_weight_kg?.toFixed(3)}
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={item.status}
                        onChange={e => handleStatusChange(item._id, e.target.value)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium
                                    border-0 cursor-pointer focus:outline-none
                                    ${statusColors[item.status]}`}
                      >
                        {STATUSES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleDelete(item._id)}
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