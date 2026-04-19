import { useEffect, useState } from 'react';
import Sidebar  from '../components/Sidebar';
import StatCard from '../components/StateCard';
import api      from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';

export default function DashboardPage() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/summary')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const byStatus = (status) =>
    data?.packed_summary?.find(p => p._id === status);

  const inShop  = byStatus('in_shop');
  const sold    = byStatus('sold');
  const sample  = byStatus('sample');

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 p-8 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-gray-400 text-sm mb-8">Real-time stock overview</p>

          {loading ? (
            <p className="text-gray-400">Loading…</p>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  label="Current Stock"
                  value={data?.current_stock_kg?.toFixed(1)}
                  unit="kg"
                  icon="🏪"
                  color="orange"
                />
                <StatCard
                  label="Today Produced"
                  value={data?.todays_produced_kg?.toFixed(1)}
                  unit="kg"
                  icon="🏭"
                  color="blue"
                />
                <StatCard
                  label="In Shop"
                  value={inShop?.total_units ?? 0}
                  unit="units"
                  icon="📦"
                  color="green"
                />
                <StatCard
                  label="Sold"
                  value={sold?.total_units ?? 0}
                  unit="units"
                  icon="✅"
                  color="purple"
                />
              </div>

              {/* Secondary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <StatCard
                  label="Samples Given"
                  value={sample?.total_units ?? 0}
                  unit="units"
                  icon="🎁"
                  color="red"
                />
                <StatCard
                  label="Opening Stock"
                  value={data?.opening_stock_kg?.toFixed(1)}
                  unit="kg"
                  icon="📂"
                  color="orange"
                />
                <StatCard
                  label="In Shop (kg)"
                  value={inShop?.total_kg?.toFixed(1) ?? '0.0'}
                  unit="kg"
                  icon="⚖️"
                  color="green"
                />
              </div>

              {/* Chart */}
              <div className="bg-white rounded-2xl border border-gray-100
                              shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">
                  7-Day Production (kg)
                </h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data?.weekly_production || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={d =>
                        new Date(d).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short'
                        })
                      }
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <Tooltip
                      formatter={(v) => [`${v} kg`, 'Produced']}
                      labelFormatter={d =>
                        new Date(d).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'long', year: 'numeric'
                        })
                      }
                    />
                    <Bar dataKey="produced_kg" fill="#f97316" radius={[4, 4, 0, 0]} />
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