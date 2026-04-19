import { useEffect, useState } from 'react';
import Sidebar  from '../components/Sidebar';
import StatCard from '../components/StateCard';
import api      from '../api/axios';
import logo     from '../assets/ChipcharmLogo.png';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0d2b1e',
      border: '1px solid rgba(244,196,48,0.2)',
      borderRadius: 12,
      padding: '10px 14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
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
  store: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  factory: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></svg>,
  box: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  check: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  gift: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  folder: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>,
  weight: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><path d="M6.5 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-11z"/></svg>,
};

export default function DashboardPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/summary')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const byStatus = s => data?.packed_summary?.find(p => p._id === s);
  const inShop = byStatus('in_shop');
  const sold   = byStatus('sold');
  const sample = byStatus('sample');

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
            
            {/* Top Right Logo (Visible on mobile, hidden on md+) */}
            <div 
              className="md:hidden w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 bg-white p-1 overflow-hidden"
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.35)' }}
            >
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
              {/* Primary stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <StatCard label="Current Stock"   value={data?.current_stock_kg?.toFixed(1)}  unit="kg"    icon={icons.store}   accent="gold"   />
                <StatCard label="Today Produced"  value={data?.todays_produced_kg?.toFixed(1)} unit="kg"    icon={icons.factory} accent="blue"   />
                <StatCard label="In Shop"         value={inShop?.total_units ?? 0}             unit="units" icon={icons.box}     accent="green"  />
                <StatCard label="Sold"            value={sold?.total_units ?? 0}               unit="units" icon={icons.check}   accent="purple" />
              </div>

              {/* Secondary stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <StatCard label="Samples Given"  value={sample?.total_units ?? 0}               unit="units" icon={icons.gift}   accent="red"   />
                <StatCard label="Opening Stock"  value={data?.opening_stock_kg?.toFixed(1)}     unit="kg"    icon={icons.folder} accent="gold"  />
                <StatCard label="In Shop (kg)"   value={inShop?.total_kg?.toFixed(1) ?? '0.0'} unit="kg"    icon={icons.weight} accent="green" />
              </div>

              {/* Chart */}
              <div
                className="rounded-2xl p-5 md:p-6"
                style={{
                  background: 'linear-gradient(145deg, #132d20, #0f2419)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                  <div>
                    <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#e8f5ef' }}>
                      7-Day Production
                    </h2>
                    <p style={{ color: '#52b788', fontSize: 12, marginTop: 2 }}>Daily output in kilograms</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(244,196,48,0.1)', border: '1px solid rgba(244,196,48,0.2)' }}>
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
                        axisLine={false}
                        tickLine={false}
                        dy={8}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#52b788', fontFamily: 'DM Sans, sans-serif' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(244,196,48,0.04)', radius: 8 }} />
                      <Bar
                        dataKey="produced_kg"
                        fill="url(#barGrad)"
                        radius={[6, 6, 0, 0]}
                      />
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