import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { PRODUCT_TYPES } from './StockPage';
import { PACKING_TYPES } from './PackedPage';

const PRODUCT_COLORS = {
  'Salted Banana Chips': '#f4c430',
  'Spicy Banana Chips':  '#f87171',
  'Sweet Banana Chips':  '#fb923c',
  '4 Cut Banana Chips':  '#52b788', // Updated Name
  'Jaggery':             '#c084fc',
};

const STATUS_STYLES = {
  in_shop:              { bg: 'rgba(82,183,136,0.12)',  color: '#52b788',  label: 'In Shop'        },
  with_supplier:        { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa',  label: 'With Supplier'  },
  delivered_to_counter: { bg: 'rgba(251,146,60,0.12)',  color: '#fb923c',  label: 'At Counter'     },
  sold:                 { bg: 'rgba(168,85,247,0.12)',  color: '#c084fc',  label: 'Sold'           },
  sample:               { bg: 'rgba(244,196,48,0.12)',  color: '#f4c430',  label: 'Sample'         },
  returned:             { bg: 'rgba(239,68,68,0.12)',   color: '#f87171',  label: 'Returned'       },
  damaged:              { bg: 'rgba(239,68,68,0.12)',   color: '#f87171',  label: 'Damaged'        },
};

// SVG Icons
const Icons = {
  Box: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  List: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  Delete: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
    </svg>
  ),
  Info: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
};

export default function BoxesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [packedItems, setPackedItems] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filterProduct, setFilterProduct] = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [viewMode, setViewMode]           = useState('boxes'); // 'boxes' | 'list'

  const canManage = user?.role === 'manager' || user?.role === 'owner';

  const fetchItems = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterProduct) params.append('product_type', filterProduct);
    if (filterStatus)  params.append('status', filterStatus);
    api.get(`/packed?${params}`)
      .then(r => setPackedItems(r.data))
      .catch(() => toast.error('Fetch failed', 'Could not load packed items.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, [filterProduct, filterStatus]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this packed entry? Bulk stock will be restored.')) return;
    try {
      const res = await api.delete(`/packed/${id}`);
      fetchItems();
      toast.warning('Deleted', `${res.data.stock_restored_kg?.toFixed(3) || 0} kg restored to bulk stock.`);
    } catch {
      toast.error('Delete failed');
    }
  };

  const groupedByProduct = PRODUCT_TYPES.reduce((acc, pt) => {
    const items = packedItems.filter(i => i.product_type === pt);
    if (items.length > 0) acc[pt] = items;
    return acc;
  }, {});

  // NEW: Only calculate boxes for 'normal_500g'
  const getProductSummary = (items) => {
    const byType = {};
    for (const item of items) {
      const key = item.packing_type;
      if (!byType[key]) byType[key] = { total_units: 0, total_kg: 0, statuses: {} };
      byType[key].total_units += item.quantity;
      byType[key].total_kg   += item.total_weight_kg || 0;
      byType[key].statuses[item.status] = (byType[key].statuses[item.status] || 0) + item.quantity;
    }
    
    for (const key in byType) {
      if (key === 'normal_500g') {
        byType[key].boxes = Math.floor(byType[key].total_units / 18);
        byType[key].loose = byType[key].total_units % 18;
      } else {
        byType[key].boxes = 0;
        byType[key].loose = byType[key].total_units;
      }
    }
    return byType;
  };

  const totalUnits   = packedItems.reduce((s, i) => s + i.quantity, 0);
  const totalKg      = packedItems.reduce((s, i) => s + (i.total_weight_kg || 0), 0);
  const inShopUnits  = packedItems.filter(i => i.status === 'in_shop').reduce((s, i) => s + i.quantity, 0);
  
  // NEW: Overall box count ONLY counts normal_500g packets
  const normal500gUnits = packedItems.filter(i => i.packing_type === 'normal_500g').reduce((s, i) => s + i.quantity, 0);
  const totalBoxesOverall = Math.floor(normal500gUnits / 18);

  return (
    <div className="flex min-h-screen" style={{ background: '#0a1e14' }}>
      <Sidebar />
      <main className="flex-1 min-w-0 md:ml-64 p-4 sm:p-6 md:p-8 pb-28 md:pb-8 w-full max-w-full overflow-x-hidden">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-6 fade-up">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-6 md:h-8 rounded-full" style={{ background: '#fb923c' }} />
                <h1 className="font-syne font-extrabold text-[24px] md:text-[28px] text-[#e8f5ef] tracking-tight">
                  Boxes & Packed Items
                </h1>
              </div>
              <p className="text-[#52b788] text-[13px] pl-3.5 mt-1">
                All packed items — boxes auto-calculated for Normal 500g only
              </p>
            </div>

            {/* View toggle + info badge */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)', color: '#fb923c' }}>
                <Icons.Info />
                <span className="font-syne font-semibold">18 units = 1 box (500g Only)</span>
              </div>

              <div className="flex gap-1 p-1 rounded-xl w-full sm:w-auto bg-white/5 border border-white/10 shrink-0">
                {[
                  { id: 'boxes', label: 'By Product', icon: <Icons.Box /> },
                  { id: 'list',  label: 'Full List',  icon: <Icons.List /> }
                ].map(v => (
                  <button key={v.id} onClick={() => setViewMode(v.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95"
                    style={viewMode === v.id
                      ? { background: '#f4c430', color: '#0a1e14', fontFamily: 'Syne, sans-serif', fontWeight: 700 }
                      : { color: '#7fb89a', fontFamily: 'DM Sans, sans-serif' }}>
                    {v.icon}
                    <span className="hidden sm:inline md:hidden lg:inline">{v.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Banner */}
          {!loading && packedItems.length > 0 && (
            <div className="rounded-2xl p-4 sm:p-5 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 shadow-lg"
              style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.1), rgba(244,196,48,0.06))', border: '1px solid rgba(251,146,60,0.2)' }}>
              {[
                { label: 'Total Units',  value: totalUnits,                unit: 'packs',  color: '#fb923c' },
                { label: 'Total Boxes',  value: totalBoxesOverall,         unit: 'boxes',  color: '#f4c430' },
                { label: 'In Shop',      value: inShopUnits,               unit: 'units',  color: '#52b788' },
                { label: 'Total Weight', value: `${totalKg.toFixed(1)}`,    unit: 'kg',     color: '#f4c430' },
              ].map(s => (
                <div key={s.label} className="text-center bg-black/10 rounded-xl py-3 border border-white/5">
                  <div style={{ color: '#52b788', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {s.label}
                  </div>
                  <div className="flex items-baseline justify-center gap-1 mt-1">
                    <span style={{ color: s.color, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24 }}>{s.value}</span>
                    <span style={{ color: '#52b788', fontSize: 11 }}>{s.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative w-full sm:flex-1 -mx-4 px-4 sm:mx-0 sm:px-0">
              <style>{`.filter-scroll::-webkit-scrollbar { display: none; } .filter-scroll { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
              <div className="flex overflow-x-auto gap-2 pb-2 w-full snap-x filter-scroll">
                {[{ label: 'All Products', value: '' }, ...PRODUCT_TYPES.map(p => ({
                  label: p.replace(' Banana Chips', '').replace(' Chips', ''),
                  value: p
                }))].map(opt => (
                  <button key={opt.value} onClick={() => setFilterProduct(opt.value)}
                    className="snap-start whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-medium transition-all border shrink-0 active:scale-95"
                    style={filterProduct === opt.value
                      ? { background: `${PRODUCT_COLORS[opt.value] || '#f4c430'}20`, color: PRODUCT_COLORS[opt.value] || '#f4c430', borderColor: `${PRODUCT_COLORS[opt.value] || '#f4c430'}40` }
                      : { background: 'rgba(255,255,255,0.03)', color: '#7fb89a', borderColor: 'rgba(255,255,255,0.08)' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="w-full sm:w-auto outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8f5ef', borderRadius: 12, padding: '10px 14px', fontSize: 14, appearance: 'none', fontFamily: 'DM Sans, sans-serif' }}>
              <option value="">All Statuses</option>
              {Object.entries(STATUS_STYLES).map(([val, s]) => (
                <option key={val} value={val}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* ── BY PRODUCT VIEW ── */}
          {viewMode === 'boxes' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-20 gap-3 bg-[#132d20]/50 rounded-2xl border border-white/5">
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                  <span style={{ color: '#52b788' }}>Loading products…</span>
                </div>
              ) : Object.keys(groupedByProduct).length === 0 ? (
                <div className="flex flex-col items-center py-20 bg-[#132d20]/50 rounded-2xl border border-white/5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 opacity-50" style={{ background: 'rgba(251,146,60,0.1)' }}>
                    <Icons.Box />
                  </div>
                  <p className="text-[#52b788] font-syne font-semibold text-lg">No packed items found</p>
                  <p className="text-[#2d6a4f] text-sm mt-1">Go to Packed Items page to add entries.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedByProduct).map(([product, items]) => {
                    const color    = PRODUCT_COLORS[product] || '#52b788';
                    const summary  = getProductSummary(items);
                    const total    = items.reduce((s, i) => s + i.quantity, 0);
                    const totalKgP = items.reduce((s, i) => s + (i.total_weight_kg || 0), 0);
                    const totalBoxes = Object.values(summary).reduce((sum, d) => sum + d.boxes, 0);

                    return (
                      <div key={product} className="rounded-2xl overflow-hidden shadow-xl"
                        style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: `1px solid ${color}20` }}>

                        {/* Product header */}
                        <div className="px-4 py-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          style={{ background: `${color}08`, borderBottom: `1px solid ${color}15` }}>
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                            <h3 className="font-syne font-bold text-[#e8f5ef] text-[17px]">{product}</h3>
                          </div>
                          <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-6 w-full sm:w-auto bg-black/20 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                            <div className="text-center sm:text-right border-r border-white/5 sm:border-none pr-2 sm:pr-0">
                              <span className="block sm:inline text-[#fb923c] font-syne font-bold text-xl sm:text-[22px]">{totalBoxes}</span>
                              <span className="block sm:inline text-[#52b788] text-[10px] sm:text-xs sm:ml-1">boxes</span>
                            </div>
                            <div className="text-center sm:text-right border-r border-white/5 sm:border-none pr-2 sm:pr-0">
                              <span className="block sm:inline font-syne font-bold text-xl sm:text-[22px]" style={{ color }}>{total}</span>
                              <span className="block sm:inline text-[#52b788] text-[10px] sm:text-xs sm:ml-1">units</span>
                            </div>
                            <div className="text-center sm:text-right">
                              <span className="block sm:inline text-[#f4c430] font-syne font-bold text-lg sm:text-[18px]">{totalKgP.toFixed(2)}</span>
                              <span className="block sm:inline text-[#52b788] text-[10px] sm:text-xs sm:ml-1">kg</span>
                            </div>
                          </div>
                        </div>

                        {/* Packing type breakdown */}
                        <div className="p-4 sm:p-5 border-b border-white/5">
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {Object.entries(summary).map(([packType, data]) => {
                              const packLabel = PACKING_TYPES.find(t => t.value === packType)?.label || packType;
                              return (
                                <div key={packType} className="rounded-xl p-3 text-center"
                                  style={{ background: `${color}08`, border: `1px solid ${color}15` }}>
                                  <div style={{ color: '#7fb89a', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, marginBottom: 6 }}>
                                    {packLabel}
                                  </div>
                                  <div style={{ color, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22 }}>
                                    {data.total_units}
                                    <span style={{ fontSize: 10, fontWeight: 500, fontFamily: 'DM Sans' }}> units</span>
                                  </div>

                                  {/* AUTO BOXES DISPLAY - ONLY FOR NORMAL 500g */}
                                  {packType === 'normal_500g' && (
                                    <div className="mt-2 py-1.5 rounded-lg flex items-center justify-center gap-1 flex-wrap"
                                      style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                      <span style={{ color: '#f4c430', fontSize: 12, fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>
                                        {data.boxes} box{data.boxes !== 1 ? 'es' : ''}
                                      </span>
                                      {data.loose > 0 && (
                                        <span style={{ color: '#52b788', fontSize: 10 }}>+{data.loose} loose</span>
                                      )}
                                    </div>
                                  )}

                                  <div style={{ color: '#52b788', fontSize: 11, marginTop: 6 }}>{data.total_kg.toFixed(2)} kg</div>

                                  {/* Status mini breakdown */}
                                  <div className="flex flex-wrap gap-1 justify-center mt-3">
                                    {Object.entries(data.statuses).map(([st, qty]) => {
                                      const ss = STATUS_STYLES[st];
                                      return (
                                        <span key={st} className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                          style={{ background: ss?.bg, color: ss?.color, fontFamily: 'Syne, sans-serif' }}>
                                          {ss?.label}: {qty}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Recent entries — Desktop Table */}
                        <div className="bg-black/20">
                          <div className="hidden md:block rounded-b-xl overflow-hidden">
                            <table className="w-full text-xs">
                              <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                  {['Date', 'Type', 'Qty', 'Weight', 'Status', 'Destination', ''].map((h, i) => (
                                    <th key={i} className={`py-3 px-4 font-semibold uppercase tracking-wider whitespace-nowrap ${[2, 3].includes(i) ? 'text-right' : 'text-left'}`}
                                      style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', fontSize: 10 }}>
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((item, idx) => {
                                  const ss = STATUS_STYLES[item.status] || STATUS_STYLES.in_shop;
                                  const packLabel = PACKING_TYPES.find(t => t.value === item.packing_type)?.label || item.packing_type;
                                  return (
                                    <tr key={item._id} className="hover:bg-white/[0.03] transition-colors"
                                      style={{ borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#7fb89a' }}>
                                        {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="px-2 py-1 rounded text-[10px] font-semibold font-syne"
                                          style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                                          {packLabel}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-right font-bold text-[#e8f5ef] font-syne text-[14px]">{item.quantity}</td>
                                      <td className="px-4 py-3 text-right text-[#7fb89a]">{item.total_weight_kg?.toFixed(3)} kg</td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="px-2 py-1 rounded text-[10px] font-semibold font-syne"
                                          style={{ background: ss.bg, color: ss.color }}>
                                          {ss.label}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-[#2d6a4f] text-[12px]">
                                        {item.destination || item.supplier_name || '—'}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        {canManage && (
                                          <button onClick={() => handleDelete(item._id)}
                                            className="px-2.5 py-1.5 rounded-lg text-xs hover:bg-red-500/10 hover:text-red-400 transition-all border border-white/10 text-[#7fb89a]">
                                            <Icons.Delete />
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile Cards */}
                          <div className="md:hidden flex flex-col p-4 gap-3">
                            {items.map(item => {
                              const ss = STATUS_STYLES[item.status] || STATUS_STYLES.in_shop;
                              const packLabel = PACKING_TYPES.find(t => t.value === item.packing_type)?.label || item.packing_type;
                              return (
                                <div key={item._id} className="bg-black/40 rounded-xl p-3 border border-white/5 flex justify-between items-center gap-3">
                                  <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="text-[12px] text-[#7fb89a] font-dm">
                                        {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                      </div>
                                      <span className="px-2 py-0.5 rounded text-[9px] font-bold font-syne"
                                        style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-1 rounded text-[10px] font-bold font-syne"
                                        style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                                        {packLabel}
                                      </span>
                                      <span className="text-[#e8f5ef] font-syne font-bold text-[14px] ml-auto">
                                        {item.quantity} <span className="text-[10px] text-[#52b788] font-normal">units</span>
                                      </span>
                                    </div>
                                  </div>
                                  {canManage && (
                                    <button onClick={() => handleDelete(item._id)}
                                      className="p-2 rounded-lg bg-red-500/10 text-red-400 active:scale-95 transition-transform">
                                      <Icons.Delete />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── FULL LIST VIEW ── */}
          {viewMode === 'list' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-20 gap-3 bg-[#132d20]/50 rounded-2xl border border-white/5">
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                  <span style={{ color: '#52b788' }}>Loading list…</span>
                </div>
              ) : packedItems.length === 0 ? (
                <div className="flex flex-col items-center py-20 bg-[#132d20]/50 rounded-2xl border border-white/5">
                  <p className="text-[#52b788] font-syne font-semibold text-lg">No items found</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block rounded-2xl overflow-hidden border border-white/5 shadow-xl"
                    style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)' }}>
                    <table className="w-full text-sm min-w-[800px]">
                      <thead>
                        <tr className="border-b border-white/10 bg-black/20">
                          {['Date', 'Product', 'Packing', 'Wt/Unit', 'Qty', 'Boxes', 'Total kg', 'Status', 'Destination', ''].map((h, i) => (
                            <th key={i} className={`py-4 px-4 text-xs font-semibold uppercase tracking-widest ${[3, 4, 5, 6].includes(i) ? 'text-right' : 'text-left'}`}
                              style={{ color: '#52b788', fontFamily: 'Syne, sans-serif' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {packedItems.map((item, idx) => {
                          const color = PRODUCT_COLORS[item.product_type] || '#52b788';
                          const ss = STATUS_STYLES[item.status] || STATUS_STYLES.in_shop;
                          const packLabel = PACKING_TYPES.find(t => t.value === item.packing_type)?.label || item.packing_type;
                          const autoBoxes = item.packing_type === 'normal_500g' ? Math.floor(item.quantity / 18) : 0;
                          const looseUnits = item.packing_type === 'normal_500g' ? item.quantity % 18 : item.quantity;
                          return (
                            <tr key={item._id} className="hover:bg-white/[0.03] transition-colors"
                              style={{ borderBottom: idx < packedItems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                              <td className="px-4 py-3 whitespace-nowrap text-[#7fb89a] text-sm">
                                {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                                  <span className="text-[#e8f5ef] font-syne font-medium">{item.product_type}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="px-2.5 py-1.5 rounded-lg text-xs font-semibold font-syne"
                                  style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                                  {packLabel}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap text-[#7fb89a] text-sm">
                                {item.weight_per_unit_grams}g
                              </td>
                              <td className="px-4 py-3 text-right font-bold whitespace-nowrap text-[#e8f5ef] font-syne text-[15px]">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                {item.packing_type === 'normal_500g' ? (
                                  <>
                                    <span style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14 }}>
                                      {autoBoxes}
                                    </span>
                                    {looseUnits > 0 && (
                                      <span style={{ color: '#52b788', fontSize: 11 }}> +{looseUnits}</span>
                                    )}
                                  </>
                                ) : <span style={{ color: '#52b788', fontSize: 11 }}>—</span>}
                              </td>
                              <td className="px-4 py-3 text-right font-bold whitespace-nowrap text-[#f4c430] font-syne">
                                {item.total_weight_kg?.toFixed(3)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold font-syne"
                                  style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.color}30` }}>
                                  {ss.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-[#2d6a4f] text-xs">
                                {item.destination || item.supplier_name || '—'}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {canManage && (
                                  <button onClick={() => handleDelete(item._id)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-dm hover:bg-red-500/10 hover:text-red-400 transition-all border border-white/10 text-[#7fb89a]">
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

                  {/* Mobile Cards */}
                  <div className="md:hidden flex flex-col gap-3">
                    {packedItems.map(item => {
                      const color = PRODUCT_COLORS[item.product_type] || '#52b788';
                      const ss = STATUS_STYLES[item.status] || STATUS_STYLES.in_shop;
                      const packLabel = PACKING_TYPES.find(t => t.value === item.packing_type)?.label || item.packing_type;
                      const autoBoxes = item.packing_type === 'normal_500g' ? Math.floor(item.quantity / 18) : 0;
                      const looseUnits = item.packing_type === 'normal_500g' ? item.quantity % 18 : item.quantity;
                      return (
                        <div key={item._id} className="rounded-xl p-4 border border-white/5 relative shadow-lg"
                          style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)' }}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="font-syne font-bold text-[#e8f5ef] text-[15px] mb-2">
                                {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="flex flex-wrap gap-2 items-center">
                                <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/20 border border-white/5 text-xs text-[#e8f5ef] font-syne">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                                  {item.product_type.replace(' Banana Chips', '').replace(' Chips', '')}
                                </span>
                                <span className="px-2 py-1 rounded text-[11px] font-bold font-syne"
                                  style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                                  {packLabel}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {canManage && (
                                <button onClick={() => handleDelete(item._id)}
                                  className="p-2 rounded-lg bg-red-500/10 text-red-400 active:scale-95 transition-transform shrink-0">
                                  <Icons.Delete />
                                </button>
                              )}
                              <span className="px-2 py-1 rounded-lg text-[10px] font-bold font-syne"
                                style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.color}30` }}>
                                {ss.label}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-2 bg-black/20 rounded-xl p-3 border border-white/5">
                            <div className="text-center">
                              <span className="block text-[10px] text-[#52b788] uppercase font-syne mb-1">Wt/Unit</span>
                              <span className="text-[#7fb89a] text-[13px] font-dm">{item.weight_per_unit_grams}g</span>
                            </div>
                            <div className="text-center border-l border-white/5">
                              <span className="block text-[10px] text-[#52b788] uppercase font-syne mb-1">Units</span>
                              <span className="text-[#e8f5ef] text-sm font-bold font-syne">{item.quantity}</span>
                            </div>
                            <div className="text-center border-l border-white/5">
                              <span className="block text-[10px] text-[#f4c430] uppercase font-syne mb-1">Boxes</span>
                              <span className="text-[#f4c430] text-sm font-bold font-syne">
                                {item.packing_type === 'normal_500g' ? (
                                  <>{autoBoxes}{looseUnits > 0 && <span className="text-[10px] text-[#52b788]">+{looseUnits}</span>}</>
                                ) : '—'}
                              </span>
                            </div>
                            <div className="text-center border-l border-white/5">
                              <span className="block text-[10px] text-[#f4c430] uppercase font-syne mb-1">kg</span>
                              <span className="text-[#f4c430] text-sm font-bold font-syne">{item.total_weight_kg?.toFixed(3)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}