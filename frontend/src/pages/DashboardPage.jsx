import { useEffect, useState } from 'react';
import Sidebar  from '../components/Sidebar';
import StatCard from '../components/StateCard';
import api      from '../api/axios';
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
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-8 fade-up">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-6 rounded-full" style={{ background: '#f4c430' }} />
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#e8f5ef', letterSpacing: '-0.02em' }}>
                Dashboard
              </h1>
            </div>
            <p style={{ color: '#52b788', fontSize: 14, paddingLeft: 14 }}>
              Real-time inventory overview · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' })}
            </p>
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <StatCard label="Current Stock"   value={data?.current_stock_kg?.toFixed(1)}  unit="kg"    icon="🏪" accent="gold"   />
                <StatCard label="Today Produced"  value={data?.todays_produced_kg?.toFixed(1)} unit="kg"    icon="🏭" accent="blue"   />
                <StatCard label="In Shop"         value={inShop?.total_units ?? 0}             unit="units" icon="📦" accent="green"  />
                <StatCard label="Sold"            value={sold?.total_units ?? 0}               unit="units" icon="✅" accent="purple" />
              </div>

              {/* Secondary stats */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <StatCard label="Samples Given"  value={sample?.total_units ?? 0}               unit="units" icon="🎁" accent="red"   />
                <StatCard label="Opening Stock"  value={data?.opening_stock_kg?.toFixed(1)}     unit="kg"    icon="📂" accent="gold"  />
                <StatCard label="In Shop (kg)"   value={inShop?.total_kg?.toFixed(1) ?? '0.0'} unit="kg"    icon="⚖️" accent="green" />
              </div>

              {/* Chart */}
              <div
                className="rounded-2xl p-6"
                style={{
                  background: 'linear-gradient(145deg, #132d20, #0f2419)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                }}
              >
                <div className="flex items-center justify-between mb-6">
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

                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data?.weekly_production || []} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      tick={{ fontSize: 11, fill: '#52b788', fontFamily: 'DM Sans, sans-serif' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#52b788', fontFamily: 'DM Sans, sans-serif' }}
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
            </>
          )}
        </div>
      </main>
    </div>
  );
}