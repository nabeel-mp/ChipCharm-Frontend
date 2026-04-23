import { useEffect, useState } from 'react';
import Sidebar  from '../components/Sidebar';
import StatCard from '../components/StateCard';
import api      from '../api/axios';
import logo     from '../assets/ChipcharmLogo.png';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';

const PRODUCT_COLORS = {
  'Salted Banana Chips':  '#f4c430',
  'Spicy Banana Chips':   '#f87171',
  'Sweet Banana Chips':   '#fb923c',
  'Banana 4 Cut':         '#52b788',
  'Jaggery':              '#c084fc',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0d2b1e', border: '1px solid rgba(244,196,48,0.2)', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
      <p style={{ color: '#52b788', fontSize: 11, marginBottom: 4, fontFamily: 'Syne, sans-serif' }}>
        {new Date(label).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
      </p>
      <p style={{ color: '#f4c430', fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>
        {payload[0].value} <span style={{ fontSize: 12, color: '#52b788', fontWeight: 400 }}>kg</span>
      </p>
    </div>
  );
};

const icons = {
  store:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  factory: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></svg>,
  box:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  check:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  gift:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  truck:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  return:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>,
  package: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  layers:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
};

export default function DashboardPage() {
  const [data,         setData]         = useState(null);
  const [packedStock,  setPackedStock]  = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/summary'),
      api.get('/packed/available-stock'),
    ])
      .then(([dashRes, stockRes]) => {
        setData(dashRes.data);
        setPackedStock(stockRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const byStatus = s => data?.packed_summary?.find(p => p._id === s);
  const inShop       = byStatus('in_shop');
  const sold         = byStatus('sold');
  const sample       = byStatus('sample');
  const withSupplier = byStatus('with_supplier');
  const atCounter    = byStatus('delivered_to_counter');
  const returned     = byStatus('returned');
  const damaged      = byStatus('damaged');

  // Total packed units currently in shop (packets ready to sell)
  const totalPackedUnits = data?.packed_summary?.reduce((s, p) => {
    if (['in_shop', 'delivered_to_counter'].includes(p._id)) return s + p.total_units;
    return s;
  }, 0) ?? 0;

  // Total unpackaged (bulk stock in kg)
  const totalUnpackagedKg = data?.current_stock_kg ?? 0;

  return (
    <div className="flex" style={{ minHeight: '100vh', background: '#0a1e14' }}>
      <Sidebar />
      <main className="md:ml-64 flex-1 p-5 md:p-8 pb-28 md:pb-8 w-full max-w-[100vw] overflow-x-hidden">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-6 md:mb-8 fade-up flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-6 rounded-full" style={{ background: '#f4c430' }} />
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#e8f5ef', letterSpacing: '-0.02em' }}>
                  Dashboard
                </h1>
              </div>
              <p style={{ color: '#52b788', fontSize: 13, paddingLeft: 14 }}>
                Real-time inventory overview · {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'long' })}
              </p>
            </div>
            <div className="md:hidden w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 bg-white p-1 overflow-hidden"
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.35)' }}>
              <img src={logo} alt="ChipCharm Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 py-20 justify-center">
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4c430" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              <span style={{ color: '#52b788', fontFamily: 'DM Sans, sans-serif' }}>Loading data…</span>
            </div>
          ) : (
            <>
              {/* ── KEY STOCK OVERVIEW ── */}
              <div className="rounded-2xl p-5 mb-5"
                style={{ background: 'linear-gradient(135deg, rgba(244,196,48,0.08), rgba(82,183,136,0.06))', border: '1px solid rgba(244,196,48,0.2)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-5 rounded-full" style={{ background: '#f4c430' }} />
                  <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#e8f5ef', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Stock Overview
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Unpackaged Bulk */}
                  <div className="rounded-xl p-4 relative overflow-hidden"
                    style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(244,196,48,0.2)' }}>
                    <div className="absolute top-0 right-0 w-12 h-12 rounded-full pointer-events-none"
                      style={{ background: 'rgba(244,196,48,0.15)', filter: 'blur(12px)', transform: 'translate(30%,-30%)' }} />
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(244,196,48,0.15)', color: '#f4c430' }}>
                        {icons.layers}
                      </div>
                    </div>
                    <div style={{ color: '#52b788', fontSize: 10, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      Unpackaged Bulk
                    </div>
                    <div style={{ color: '#f4c430', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26 }}>
                      {totalUnpackagedKg.toFixed(1)}
                    </div>
                    <div style={{ color: '#52b788', fontSize: 11 }}>kg available</div>
                  </div>

                  {/* Packed Packets in Shop */}
                  <div className="rounded-xl p-4 relative overflow-hidden"
                    style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(82,183,136,0.2)' }}>
                    <div className="absolute top-0 right-0 w-12 h-12 rounded-full pointer-events-none"
                      style={{ background: 'rgba(82,183,136,0.15)', filter: 'blur(12px)', transform: 'translate(30%,-30%)' }} />
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(82,183,136,0.15)', color: '#52b788' }}>
                        {icons.package}
                      </div>
                    </div>
                    <div style={{ color: '#52b788', fontSize: 10, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      Packed Packets
                    </div>
                    <div style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26 }}>
                      {totalPackedUnits}
                    </div>
                    <div style={{ color: '#52b788', fontSize: 11 }}>units in stock</div>
                  </div>

                  {/* With Suppliers */}
                  <div className="rounded-xl p-4 relative overflow-hidden"
                    style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(96,165,250,0.2)' }}>
                    <div className="absolute top-0 right-0 w-12 h-12 rounded-full pointer-events-none"
                      style={{ background: 'rgba(96,165,250,0.15)', filter: 'blur(12px)', transform: 'translate(30%,-30%)' }} />
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>
                        {icons.truck}
                      </div>
                    </div>
                    <div style={{ color: '#52b788', fontSize: 10, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      With Suppliers
                    </div>
                    <div style={{ color: '#60a5fa', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26 }}>
                      {withSupplier?.total_units ?? 0}
                    </div>
                    <div style={{ color: '#52b788', fontSize: 11 }}>units out</div>
                  </div>

                  {/* Today Produced */}
                  <div className="rounded-xl p-4 relative overflow-hidden"
                    style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(192,132,252,0.2)' }}>
                    <div className="absolute top-0 right-0 w-12 h-12 rounded-full pointer-events-none"
                      style={{ background: 'rgba(192,132,252,0.15)', filter: 'blur(12px)', transform: 'translate(30%,-30%)' }} />
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(192,132,252,0.15)', color: '#c084fc' }}>
                        {icons.factory}
                      </div>
                    </div>
                    <div style={{ color: '#52b788', fontSize: 10, fontFamily: 'Syne, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      Today Produced
                    </div>
                    <div style={{ color: '#c084fc', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26 }}>
                      {data?.todays_produced_kg?.toFixed(1)}
                    </div>
                    <div style={{ color: '#52b788', fontSize: 11 }}>kg today</div>
                  </div>
                </div>
              </div>

              {/* Per-Product Packed Packets Breakdown */}
              {packedStock?.length > 0 && (
                <div className="rounded-2xl p-5 mb-5"
                  style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-5 rounded-full" style={{ background: '#52b788' }} />
                    <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#e8f5ef', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Unpackaged Stock by Product
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {packedStock.map(p => {
                      const color = PRODUCT_COLORS[p.product_type] || '#52b788';
                      const low = p.available_kg < 5;
                      return (
                        <div key={p.product_type} className="rounded-xl p-3 text-center"
                          style={{ background: `${color}08`, border: `1px solid ${low ? 'rgba(248,113,113,0.3)' : color + '20'}` }}>
                          <div style={{ color: '#7fb89a', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>
                            {p.product_type.replace(' Banana Chips', '').replace(' Chips', '')}
                          </div>
                          <div style={{ color: low ? '#f87171' : color, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20 }}>
                            {p.available_kg.toFixed(1)}
                          </div>
                          <div style={{ color: '#52b788', fontSize: 10 }}>kg bulk</div>
                          {low && <div style={{ color: '#f87171', fontSize: 10, marginTop: 2 }}>⚠ Low</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Packed Items by Product */}
              {data?.packed_by_product?.length > 0 && (
                <div className="rounded-2xl p-5 mb-5"
                  style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-5 rounded-full" style={{ background: '#f4c430' }} />
                    <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#e8f5ef', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Packed Packets by Product
                    </h2>
                  </div>
                  <div className="overflow-x-auto custom-scroll">
                    <table className="w-full text-sm min-w-[560px]">
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          {['Product', 'In Shop', 'At Counter', 'With Supplier', 'Sold', 'Sample'].map((h, i) => (
                            <th key={i} className={`py-2 px-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${i > 0 ? 'text-right' : 'text-left'}`}
                              style={{ color: '#52b788', fontFamily: 'Syne, sans-serif' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.packed_by_product.map(p => {
                          const color = PRODUCT_COLORS[p._id] || '#52b788';
                          return (
                            <tr key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                                  <span style={{ color: '#e8f5ef', fontSize: 12 }}>{p._id}</span>
                                </div>
                              </td>
                              {[p.in_shop, p.delivered_to_counter ?? 0, p.with_supplier, p.sold, p.sample].map((v, i) => (
                                <td key={i} className="px-3 py-3 text-right">
                                  <span style={{ color: v > 0 ? color : '#2d6a4f', fontFamily: 'Syne, sans-serif', fontWeight: v > 0 ? 700 : 400, fontSize: 13 }}>
                                    {v ?? 0}
                                  </span>
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Secondary stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <StatCard label="In Shop"   value={inShop?.total_units ?? 0}   unit="units" icon={icons.box}    accent="green"  />
                <StatCard label="Sold"      value={sold?.total_units ?? 0}     unit="units" icon={icons.check}  accent="purple" />
                <StatCard label="Samples"   value={sample?.total_units ?? 0}   unit="units" icon={icons.gift}   accent="red"    />
                <StatCard label="Returns"   value={(returned?.total_units ?? 0) + (damaged?.total_units ?? 0)} unit="units" icon={icons.return} accent="red" />
              </div>

              {/* Recent Returns */}
              {data?.recent_returns?.length > 0 && (
                <div className="rounded-2xl p-5 md:p-6 mb-6"
                  style={{ background: 'linear-gradient(145deg, #2b1010, #1f0d0d)', border: '1px solid rgba(239,68,68,0.15)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-5 rounded-full" style={{ background: '#f87171' }} />
                    <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#fca5a5' }}>
                      Recent Returns & Damage
                    </h2>
                    <span className="ml-auto px-2.5 py-1 rounded-lg text-xs font-bold"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', fontFamily: 'Syne, sans-serif' }}>
                      {data.recent_returns.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {data.recent_returns.map(item => (
                      <div key={item._id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                        style={{ background: 'rgba(0,0,0,0.2)' }}>
                        <div>
                          <span style={{ color: '#e8f5ef', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
                            {item.product_type}
                          </span>
                          {item.return_reason && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', fontFamily: 'Syne, sans-serif' }}>
                              {item.return_reason.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span style={{ color: item.status === 'damaged' ? '#f87171' : '#fb923c', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14 }}>
                            {item.quantity} units
                          </span>
                          <p style={{ color: '#7fb89a', fontSize: 10 }}>
                            {item.status === 'damaged' ? 'Damaged' : 'Returned'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7-Day Production Chart */}
              <div className="rounded-2xl p-5 md:p-6"
                style={{ background: 'linear-gradient(145deg, #132d20, #0f2419)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                  <div>
                    <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#e8f5ef' }}>
                      7-Day Production
                    </h2>
                    <p style={{ color: '#52b788', fontSize: 12, marginTop: 2 }}>Daily output in kilograms</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(244,196,48,0.1)', border: '1px solid rgba(244,196,48,0.2)' }}>
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#f4c430' }} />
                    <span style={{ color: '#f4c430', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>Production (kg)</span>
                  </div>
                </div>
                <div className="w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height={220} minWidth={300}>
                    <BarChart data={data?.weekly_production || []} barSize={24} margin={{ left: -20, right: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        tick={{ fontSize: 10, fill: '#52b788', fontFamily: 'DM Sans, sans-serif' }}
                        axisLine={false} tickLine={false} dy={8}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#52b788', fontFamily: 'DM Sans, sans-serif' }}
                        axisLine={false} tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(244,196,48,0.04)', radius: 8 }} />
                      <Bar dataKey="produced_kg" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#f4c430" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#e9a800" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}