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
  padding: '12px 14px',
  fontSize: 15,
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.2s ease',
};

const PRODUCT_COLORS = {
  'Salted Banana Chips': '#f4c430',
  'Spicy Banana Chips':  '#f87171',
  'Sweet Banana Chips':  '#fb923c',
  'Banana 4 Cut':        '#52b788',
  'Jaggery':             '#c084fc',
};

// SVG Icons
const Icons = {
  Current: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  History: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
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
    <div className="flex min-h-screen bg-[#0a1e14]">
      <Sidebar />
      <main className="flex-1 min-w-0 md:ml-64 p-4 sm:p-6 md:p-8 pb-28 md:pb-8 w-full max-w-full overflow-x-hidden">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-6 fade-up">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-6 md:h-8 rounded-full" style={{ background: '#60a5fa' }} />
                <h1 className="font-syne font-extrabold text-[24px] md:text-[28px] text-[#e8f5ef] tracking-tight">
                  Supplier Inventory
                </h1>
              </div>
              <p className="text-[#52b788] text-[13px] pl-3.5 mt-1">Track what each supplier holds & their daily history</p>
            </div>
            
            {/* View toggle */}
            <div className="flex gap-1 p-1 rounded-xl w-full sm:w-auto bg-white/5 border border-white/10 shrink-0">
              {[
                { id: 'current', label: 'Current Stock', icon: <Icons.Current /> },
                { id: 'history', label: 'Daily History', icon: <Icons.History /> },
              ].map(v => (
                <button key={v.id} onClick={() => setView(v.id)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95"
                  style={view === v.id
                    ? { background: '#f4c430', color: '#0a1e14', fontFamily: 'Syne, sans-serif', fontWeight: 700 }
                    : { color: '#7fb89a', fontFamily: 'DM Sans, sans-serif' }}>
                  {v.icon}
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            {[
              { label: 'Active Suppliers', value: totalPendingSuppliers, color: '#60a5fa' },
              { label: 'Total Units Out', value: totalItemsOut, color: '#fb923c' },
              { label: 'Pending Trips', value: trips.filter(t => t.status === 'pending').length, color: totalPendingSuppliers > 0 ? '#f87171' : '#52b788' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 sm:p-5 shadow-lg"
                style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: '#52b788', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                <div style={{ color: s.color, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, marginTop: 4 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* ── CURRENT STOCK VIEW ── */}
          {view === 'current' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-20 gap-3 bg-[#132d20]/50 rounded-2xl border border-white/5">
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                  <span className="text-[#52b788] text-sm">Loading current stock…</span>
                </div>
              ) : Object.keys(currentInv).length === 0 ? (
                <div className="flex flex-col items-center py-20 bg-[#132d20]/50 rounded-2xl border border-white/5">
                  <Icons.Check className="mb-4 opacity-50 w-12 h-12 text-[#52b788]" />
                  <p className="text-[#52b788] font-syne font-semibold text-lg">All returns completed</p>
                  <p className="text-[#2d6a4f] text-sm mt-1">No suppliers currently holding stock.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(currentInv).map(([supplierName, data]) => {
                    const itemsList = Object.values(data.items).filter(i => i.total_qty > 0);
                    const totalUnits = itemsList.reduce((s, i) => s + i.total_qty, 0);
                    const pendingTrips = data.trips.filter(t => t.status === 'pending');
                    return (
                      <div key={supplierName} className="rounded-2xl p-4 sm:p-5 shadow-xl"
                        style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(251,146,60,0.2)' }}>
                        
                        {/* Supplier header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-white/5 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>
                              <Icons.User />
                            </div>
                            <div>
                              <h3 className="font-syne font-bold text-[#e8f5ef] text-[18px]">
                                {supplierName}
                              </h3>
                              <p style={{ color: '#7fb89a', fontSize: 13, marginTop: 2 }}>
                                {pendingTrips.length} pending trip{pendingTrips.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right bg-black/20 sm:bg-transparent p-3 sm:p-0 rounded-xl flex sm:block items-center justify-between">
                            <div className="sm:hidden text-[11px] text-[#52b788] font-syne uppercase tracking-widest font-bold">Total Units</div>
                            <div>
                              <span style={{ color: '#fb923c', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24 }}>{totalUnits}</span>
                              <span className="hidden sm:block text-[#52b788] text-[11px] uppercase tracking-wider font-syne font-bold">Total Units</span>
                            </div>
                          </div>
                        </div>

                        {/* Items grid */}
                        {itemsList.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
                            {itemsList.map((item, i) => {
                              const color = PRODUCT_COLORS[item.product_type] || '#52b788';
                              const packLabel = PACKING_TYPES.find(t => t.value === item.packing_type)?.label || item.packing_type;
                              return (
                                <div key={i} className="rounded-xl p-3 sm:p-4 text-center sm:text-left"
                                  style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                                  <div style={{ color: '#7fb89a', fontSize: 12, fontFamily: 'Syne, sans-serif', fontWeight: 600, marginBottom: 4, lineHeight: 1.2 }}>
                                    {item.product_type.replace(' Banana Chips', '').replace(' Chips', '')}
                                  </div>
                                  <div style={{ color: '#7fb89a', fontSize: 11, marginBottom: 6 }}>{packLabel}</div>
                                  <div className="flex items-baseline justify-center sm:justify-start gap-1">
                                    <span style={{ color, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24 }}>{item.total_qty}</span>
                                    <span style={{ color: '#52b788', fontSize: 11 }}>units</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p style={{ color: '#2d6a4f', fontSize: 13, marginBottom: 16 }}>No items currently with supplier (all returned)</p>
                        )}

                        {/* Trip dates */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-[#52b788] font-syne uppercase tracking-widest font-bold mr-1">From Trips:</span>
                          {pendingTrips.slice(0, 5).map(t => (
                            <span key={t._id} className="px-2.5 py-1.5 rounded-lg text-[11px] font-dm"
                              style={{ background: 'rgba(255,255,255,0.04)', color: '#7fb89a', border: '1px solid rgba(255,255,255,0.06)' }}>
                              {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
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
              <div className="flex flex-col sm:flex-row gap-3 mb-6 items-stretch sm:items-center">
                <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)}
                  className="w-full sm:w-1/3 outline-none" style={{ ...inputStyle, appearance: 'none' }}>
                  <option value="">All Suppliers</option>
                  {supplierNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <div className="flex items-center gap-2 w-full sm:w-2/3">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#52b788] font-syne font-bold uppercase tracking-wider"></span>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                      className="w-full pl-[50px] outline-none" style={inputStyle} />
                  </div>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#52b788] font-syne font-bold uppercase tracking-wider"></span>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                      className="w-full pl-[36px] outline-none" style={inputStyle} />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20 gap-3 bg-[#132d20]/50 rounded-2xl border border-white/5">
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                  <span className="text-[#52b788] text-sm">Loading history…</span>
                </div>
              ) : historyData.length === 0 ? (
                <div className="flex flex-col items-center py-20 bg-[#132d20]/50 rounded-2xl border border-white/5">
                  <Icons.History className="mb-4 opacity-50 w-12 h-12 text-[#52b788]" />
                  <p className="text-[#52b788] font-syne font-semibold text-lg">No trip history found</p>
                  <p className="text-[#2d6a4f] text-sm mt-1">Adjust your date or supplier filters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historyData.map(trip => (
                    <div key={trip._id} className="rounded-2xl p-4 sm:p-5 shadow-lg"
                      style={{
                        background: 'linear-gradient(145deg, #132d20, #0f2419)',
                        border: trip.status === 'pending' ? '1px solid rgba(251,146,60,0.2)' : '1px solid rgba(82,183,136,0.15)',
                      }}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                            <span className="font-syne font-bold text-[#e8f5ef] text-[17px]">
                              {trip.supplier_name}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5"
                              style={trip.status === 'pending'
                                ? { background: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.25)', fontFamily: 'Syne, sans-serif' }
                                : { background: 'rgba(82,183,136,0.12)', color: '#52b788', border: '1px solid rgba(82,183,136,0.25)', fontFamily: 'Syne, sans-serif' }}>
                              {trip.status === 'pending' ? <><Icons.Clock /> Pending</> : <><Icons.Check /> Completed</>}
                            </span>
                          </div>
                          <p style={{ color: '#7fb89a', fontSize: 13 }}>
                            {new Date(trip.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        {trip.status === 'completed' && trip.cash_collected > 0 && (
                          <div className="bg-[#f4c430]/10 border border-[#f4c430]/20 px-4 py-2 rounded-xl text-center">
                            <div className="text-[10px] text-[#52b788] font-syne font-bold uppercase tracking-widest">Cash</div>
                            <div className="text-[#f4c430] font-syne font-bold text-[18px]">₹{trip.cash_collected}</div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Carried out */}
                        {trip.carried_out?.length > 0 && (
                          <div className="rounded-xl p-3.5" style={{ background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.1)' }}>
                            <p className="text-[11px] text-[#60a5fa] font-syne font-bold uppercase tracking-widest mb-3">Carried Out</p>
                            <div className="space-y-2">
                              {trip.carried_out.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                  <span style={{ color: '#95d5b2' }}>
                                    {item.product_type.replace(' Banana Chips', '')} <span className="opacity-50 mx-0.5">•</span> {PACKING_TYPES.find(t => t.value === item.packing_type)?.label}
                                  </span>
                                  <span style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>×{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Returned */}
                        {trip.returned_items?.length > 0 && (
                          <div className="rounded-xl p-3.5" style={{ background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.1)' }}>
                            <p className="text-[11px] text-[#fb923c] font-syne font-bold uppercase tracking-widest mb-3">Returned</p>
                            <div className="space-y-2">
                              {trip.returned_items.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                  <span style={{ color: '#95d5b2' }}>
                                    {item.product_type.replace(' Banana Chips', '')} <span className="opacity-50 mx-0.5">•</span> {PACKING_TYPES.find(t => t.value === item.packing_type)?.label}
                                  </span>
                                  <span style={{ color: '#fb923c', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>×{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Net (carried - returned) for pending trips */}
                        {trip.status === 'pending' && trip.carried_out?.length > 0 && (
                          <div className="rounded-xl p-3.5 sm:col-span-2" style={{ background: 'rgba(244,196,48,0.05)', border: '1px solid rgba(244,196,48,0.1)' }}>
                            <p className="text-[11px] text-[#f4c430] font-syne font-bold uppercase tracking-widest mb-3">Currently Holding (Net)</p>
                            <div className="flex flex-wrap gap-2">
                              {trip.carried_out.map((co, i) => {
                                const returned = trip.returned_items?.find(r => r.product_type === co.product_type && r.packing_type === co.packing_type)?.quantity || 0;
                                const net = co.quantity - returned;
                                if (net <= 0) return null;
                                const color = PRODUCT_COLORS[co.product_type] || '#52b788';
                                return (
                                  <span key={i} className="px-3 py-1.5 rounded-lg text-xs"
                                    style={{ background: `${color}12`, color, border: `1px solid ${color}25`, fontFamily: 'DM Sans, sans-serif' }}>
                                    {co.product_type.replace(' Banana Chips', '')} <span className="opacity-50 mx-1">×</span> <strong className="font-syne font-bold text-[14px]">{net}</strong>
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