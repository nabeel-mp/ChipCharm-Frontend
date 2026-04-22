import { useEffect, useState, useCallback } from 'react';
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

const PRODUCT_COLORS = {
  'Salted Banana Chips': '#f4c430',
  'Spicy Banana Chips':  '#f87171',
  'Sweet Banana Chips':  '#fb923c',
  'Banana 4 Cut':        '#52b788',
  'Jaggery':             '#c084fc',
};

export default function SupplierInventoryPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(today());
  const [supplierNames, setSupplierNames] = useState([]);
  const [view, setView] = useState('current'); // 'current' | 'history'

  const fetchTrips = useCallback(() => {
    setLoading(true);
    api.get('/supplier-trips')
      .then(r => {
        setTrips(r.data);
        const names = [...new Set(r.data.map(t => t.supplier_name))].sort();
        setSupplierNames(names);
      })
      .catch(() => toast.error('Failed to load supplier trips'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  // Build per-supplier current inventory (pending trips)
  const supplierCurrentInventory = () => {
    const pending = trips.filter(t => t.status === 'pending');
    const bySupplier = {};
    for (const trip of pending) {
      if (!bySupplier[trip.supplier_name]) {
        bySupplier[trip.supplier_name] = { items: {}, trips: [] };
      }
      bySupplier[trip.supplier_name].trips.push(trip);
      for (const item of (trip.carried_out || [])) {
        const key = `${item.product_type}|||${item.packing_type}`;
        if (!bySupplier[trip.supplier_name].items[key]) {
          bySupplier[trip.supplier_name].items[key] = {
            product_type: item.product_type,
            packing_type: item.packing_type,
            total_qty: 0
          };
        }
        bySupplier[trip.supplier_name].items[key].total_qty += item.quantity;
      }
      // Subtract returned items
      for (const item of (trip.returned_items || [])) {
        const key = `${item.product_type}|||${item.packing_type}`;
        if (bySupplier[trip.supplier_name].items[key]) {
          bySupplier[trip.supplier_name].items[key].total_qty -= item.quantity;
        }
      }
    }
    return bySupplier;
  };

  // Build daily history for a specific supplier
  const supplierHistory = () => {
    let filtered = trips;
    if (selectedSupplier) filtered = filtered.filter(t => t.supplier_name === selectedSupplier);
    filtered = filtered.filter(t => {
      const d = new Date(t.date);
      return d >= new Date(dateFrom) && d <= new Date(dateTo + 'T23:59:59');
    });
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const currentInv = supplierCurrentInventory();
  const historyData = supplierHistory();

  // Summary stats
  const totalPendingSuppliers = Object.keys(currentInv).length;
  const totalItemsOut = Object.values(currentInv).reduce((s, sup) => {
    return s + Object.values(sup.items).reduce((ss, i) => ss + Math.max(0, i.total_qty), 0);
  }, 0);

  return (
    <div className="flex min-h-screen" style={{ background: '#0a1e14' }}>
      <Sidebar />
      <main className="flex-1 min-w-0 md:ml-64 p-4 sm:p-6 md:p-8 pb-28 md:pb-8 w-full max-w-full overflow-x-hidden">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 fade-up">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-6 rounded-full" style={{ background: '#60a5fa' }} />
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#e8f5ef', letterSpacing: '-0.02em' }}>
                  Supplier Inventory
                </h1>
              </div>
              <p style={{ color: '#52b788', fontSize: 13, paddingLeft: 14 }}>Track what each supplier currently holds & daily history</p>
            </div>
            {/* View toggle */}
            <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { id: 'current', label: 'Current Stock' },
                { id: 'history', label: 'Daily History' },
              ].map(v => (
                <button key={v.id} onClick={() => setView(v.id)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={view === v.id
                    ? { background: '#f4c430', color: '#0a1e14', fontFamily: 'Syne, sans-serif', fontWeight: 700 }
                    : { color: '#7fb89a', fontFamily: 'DM Sans, sans-serif' }}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Suppliers with Stock', value: totalPendingSuppliers, color: '#60a5fa' },
              { label: 'Total Units Out', value: totalItemsOut, color: '#fb923c' },
              { label: 'Pending Returns', value: trips.filter(t => t.status === 'pending').length, color: totalPendingSuppliers > 0 ? '#f87171' : '#52b788' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4"
                style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: '#52b788', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                <div style={{ color: s.color, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, marginTop: 4 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* ── CURRENT STOCK VIEW ── */}
          {view === 'current' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-20 gap-2">
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                  <span style={{ color: '#52b788' }}>Loading…</span>
                </div>
              ) : Object.keys(currentInv).length === 0 ? (
                <div className="flex flex-col items-center py-20">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#52b788" strokeWidth="1.5" className="mb-4 opacity-60">
                    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                  <p style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 16 }}>All returns completed</p>
                  <p style={{ color: '#2d6a4f', fontSize: 14, marginTop: 6 }}>No suppliers currently holding stock.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(currentInv).map(([supplierName, data]) => {
                    const itemsList = Object.values(data.items).filter(i => i.total_qty > 0);
                    const totalUnits = itemsList.reduce((s, i) => s + i.total_qty, 0);
                    const pendingTrips = data.trips.filter(t => t.status === 'pending');
                    return (
                      <div key={supplierName} className="rounded-2xl p-5"
                        style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(251,146,60,0.2)', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
                        {/* Supplier header */}
                        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                          <div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                                style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa', fontFamily: 'Syne, sans-serif' }}>
                                {supplierName[0]?.toUpperCase()}
                              </div>
                              <div>
                                <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e8f5ef', fontSize: 17 }}>
                                  {supplierName}
                                </h3>
                                <p style={{ color: '#7fb89a', fontSize: 12 }}>
                                  {pendingTrips.length} pending trip{pendingTrips.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div style={{ color: '#fb923c', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24 }}>{totalUnits}</div>
                            <div style={{ color: '#52b788', fontSize: 12 }}>total units</div>
                          </div>
                        </div>

                        {/* Items grid */}
                        {itemsList.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                            {itemsList.map((item, i) => {
                              const color = PRODUCT_COLORS[item.product_type] || '#52b788';
                              const packLabel = PACKING_TYPES.find(t => t.value === item.packing_type)?.label || item.packing_type;
                              return (
                                <div key={i} className="rounded-xl p-3"
                                  style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                                  <div style={{ color: '#7fb89a', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, marginBottom: 4 }}>
                                    {item.product_type.replace(' Banana Chips', '').replace(' Chips', '')}
                                  </div>
                                  <div style={{ color: '#7fb89a', fontSize: 11, marginBottom: 4 }}>{packLabel}</div>
                                  <div style={{ color, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20 }}>{item.total_qty}</div>
                                  <div style={{ color: '#52b788', fontSize: 10 }}>units</div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p style={{ color: '#2d6a4f', fontSize: 13, marginBottom: 12 }}>No items currently with supplier (all returned)</p>
                        )}

                        {/* Trip dates */}
                        <div className="flex flex-wrap gap-2">
                          {pendingTrips.slice(0, 5).map(t => (
                            <span key={t._id} className="px-2.5 py-1 rounded-lg text-xs"
                              style={{ background: 'rgba(255,255,255,0.04)', color: '#7fb89a', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Sans, sans-serif' }}>
                              Trip: {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </span>
                          ))}
                          {pendingTrips.length > 5 && (
                            <span style={{ color: '#52b788', fontSize: 12, padding: '4px 8px' }}>+{pendingTrips.length - 5} more</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── HISTORY VIEW ── */}
          {view === 'history' && (
            <div>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-6 items-center">
                <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)}
                  style={{ ...inputStyle, width: 'auto', padding: '8px 14px', fontSize: 13, appearance: 'none', minWidth: 180 }}>
                  <option value="">All Suppliers</option>
                  {supplierNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  <span style={{ color: '#52b788', fontSize: 13 }}>From</span>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    style={{ ...inputStyle, width: 'auto', padding: '8px 12px', fontSize: 13 }} />
                  <span style={{ color: '#52b788', fontSize: 13 }}>To</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    style={{ ...inputStyle, width: 'auto', padding: '8px 12px', fontSize: 13 }} />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20 gap-2">
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                  <span style={{ color: '#52b788' }}>Loading…</span>
                </div>
              ) : historyData.length === 0 ? (
                <div className="flex flex-col items-center py-20">
                  <p style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 16 }}>No trip history found</p>
                  <p style={{ color: '#2d6a4f', fontSize: 14, marginTop: 6 }}>Adjust filters to see more records.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyData.map(trip => (
                    <div key={trip._id} className="rounded-2xl p-4"
                      style={{
                        background: 'linear-gradient(145deg, #132d20, #0f2419)',
                        border: trip.status === 'pending' ? '1px solid rgba(251,146,60,0.2)' : '1px solid rgba(82,183,136,0.15)',
                      }}>
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#e8f5ef', fontSize: 15 }}>
                              {trip.supplier_name}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold"
                              style={trip.status === 'pending'
                                ? { background: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.25)', fontFamily: 'Syne, sans-serif' }
                                : { background: 'rgba(82,183,136,0.12)', color: '#52b788', border: '1px solid rgba(82,183,136,0.25)', fontFamily: 'Syne, sans-serif' }}>
                              {trip.status === 'pending' ? '⏳ Pending' : '✓ Completed'}
                            </span>
                          </div>
                          <p style={{ color: '#7fb89a', fontSize: 12, marginTop: 2 }}>
                            {new Date(trip.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        {trip.status === 'completed' && trip.cash_collected > 0 && (
                          <div style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18 }}>
                            ₹{trip.cash_collected}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Carried out */}
                        {trip.carried_out?.length > 0 && (
                          <div className="rounded-xl p-3" style={{ background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.1)' }}>
                            <p style={{ color: '#60a5fa', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Carried Out</p>
                            <div className="space-y-1.5">
                              {trip.carried_out.map((item, i) => (
                                <div key={i} className="flex justify-between items-center">
                                  <span style={{ color: '#95d5b2', fontSize: 12 }}>
                                    {item.product_type.replace(' Banana Chips', '')} · {PACKING_TYPES.find(t => t.value === item.packing_type)?.label}
                                  </span>
                                  <span style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14 }}>×{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Returned */}
                        {trip.returned_items?.length > 0 && (
                          <div className="rounded-xl p-3" style={{ background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.1)' }}>
                            <p style={{ color: '#fb923c', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Returned</p>
                            <div className="space-y-1.5">
                              {trip.returned_items.map((item, i) => (
                                <div key={i} className="flex justify-between items-center">
                                  <span style={{ color: '#95d5b2', fontSize: 12 }}>
                                    {item.product_type.replace(' Banana Chips', '')} · {PACKING_TYPES.find(t => t.value === item.packing_type)?.label}
                                  </span>
                                  <span style={{ color: '#fb923c', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14 }}>×{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Net (carried - returned) for pending trips */}
                        {trip.status === 'pending' && trip.carried_out?.length > 0 && (
                          <div className="rounded-xl p-3 sm:col-span-2" style={{ background: 'rgba(244,196,48,0.05)', border: '1px solid rgba(244,196,48,0.1)' }}>
                            <p style={{ color: '#f4c430', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Currently Holding</p>
                            <div className="flex flex-wrap gap-2">
                              {trip.carried_out.map((co, i) => {
                                const returned = trip.returned_items?.find(r => r.product_type === co.product_type && r.packing_type === co.packing_type)?.quantity || 0;
                                const net = co.quantity - returned;
                                if (net <= 0) return null;
                                const color = PRODUCT_COLORS[co.product_type] || '#52b788';
                                return (
                                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs"
                                    style={{ background: `${color}12`, color, border: `1px solid ${color}25`, fontFamily: 'DM Sans, sans-serif' }}>
                                    {co.product_type.replace(' Banana Chips', '')} × <strong>{net}</strong>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}