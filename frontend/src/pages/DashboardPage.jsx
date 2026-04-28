import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import logo from '../assets/ChipcharmLogo.png';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const SAMPLE_KEY = 'chipcharm_samples';

const PRODUCT_TYPES = [
  'Salted Banana Chips',
  'Spicy Banana Chips',
  'Sweet Banana Chips',
  '4 Cut Banana Chips',
  'Jaggery',
];

const PRODUCT_COLORS = {
  'Salted Banana Chips': '#f4c430',
  'Spicy Banana Chips': '#f87171',
  'Sweet Banana Chips': '#fb923c',
  '4 Cut Banana Chips': '#52b788',
  Jaggery: '#c084fc',
};

const SECTION_STYLE = {
  background: 'linear-gradient(145deg, #132d20, #0f2419)',
  border: '1px solid rgba(255,255,255,0.06)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
};

const ICONS = {
  weight: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 20h12" />
      <path d="M8 20V10a4 4 0 0 1 8 0v10" />
      <path d="M10 10a2 2 0 1 1 4 0" />
    </svg>
  ),
  packet: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4l-9-5.19" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  todayPacked: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M9 15h6" />
    </svg>
  ),
  produced: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M17 18h1" />
      <path d="M12 18h1" />
      <path d="M7 18h1" />
    </svg>
  ),
  sample: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  ),
  sold: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  returned: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
    </svg>
  ),
};

const startOfToday = () => new Date().toISOString().split('T')[0];

const getLast7Dates = () => {
  const dates = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

const formatShortDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

const getProductShortName = (productType) =>
  productType.replace(' Banana Chips', '').replace(' Chips', '');

const loadReservedSamples = () => {
  try {
    const samples = JSON.parse(localStorage.getItem(SAMPLE_KEY) || '[]');
    return Array.isArray(samples) ? samples.filter((sample) => sample.status === 'reserved') : [];
  } catch {
    return [];
  }
};

const getUnsoldReturnedUnits = (trips, productType = null) =>
  trips.reduce((sum, trip) => {
    return sum + (trip.returned_items || []).reduce((itemSum, item) => {
      if (item.reason !== 'unsold') return itemSum;
      if (productType && item.product_type !== productType) return itemSum;
      return itemSum + (Number(item.quantity) || 0);
    }, 0);
  }, 0);

const ChartTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#0d2b1e',
        border: '1px solid rgba(244,196,48,0.2)',
        borderRadius: 12,
        padding: '10px 14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <p style={{ color: '#52b788', fontSize: 11, marginBottom: 4, fontFamily: 'Syne, sans-serif' }}>
        {new Date(label).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
      </p>
      <p style={{ color: '#f4c430', fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>
        {payload[0].value}{' '}
        <span style={{ fontSize: 12, color: '#52b788', fontWeight: 400 }}>{unit}</span>
      </p>
    </div>
  );
};

function SectionTitle({ accent, title, subtitle = '' }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 rounded-full" style={{ background: accent }} />
          <h2
            style={{
              color: '#e8f5ef',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </h2>
        </div>
        {subtitle && (
          <p style={{ color: '#52b788', fontSize: 12, marginTop: 6, paddingLeft: 20 }}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function OverviewCard({ label, value, unit, icon, color, hint }) {
  return (
    <div
      className="rounded-2xl p-4 md:p-5 relative overflow-hidden"
      style={{ ...SECTION_STYLE, border: `1px solid ${color}33` }}
    >
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none"
        style={{ background: `${color}20`, filter: 'blur(20px)', transform: 'translate(30%,-30%)' }}
      />
      <div className="relative">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
          style={{ background: `${color}20`, color }}
        >
          {icon}
        </div>
        <div
          style={{
            color: '#52b788',
            fontSize: 10,
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 6,
          }}
        >
          {label}
        </div>
        <div className="flex items-end gap-2">
          <span style={{ color, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32 }}>
            {value}
          </span>
          <span style={{ color: '#52b788', fontSize: 12, marginBottom: 4 }}>{unit}</span>
        </div>
        <div style={{ color: '#7fb89a', fontSize: 12, marginTop: 8 }}>{hint}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [bulkStock, setBulkStock] = useState([]);
  const [packedEntries, setPackedEntries] = useState([]);
  const [sales, setSales] = useState([]);
  const [supplierTrips, setSupplierTrips] = useState([]);
  const [reservedSamples, setReservedSamples] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = startOfToday();
    const from = getLast7Dates()[0];

    Promise.all([
      api.get('/dashboard/summary'),
      api.get('/packed/available-stock'),
      api.get('/packed'),
      api.get(`/sales?from=${from}&to=${today}`),
      api.get('/supplier-trips'),
    ])
      .then(([summaryRes, bulkRes, packedRes, salesRes, tripsRes]) => {
        setDashboardData(summaryRes.data);
        setBulkStock(bulkRes.data);
        setPackedEntries(packedRes.data);
        setSales(salesRes.data);
        setSupplierTrips(tripsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const syncReservedSamples = () => setReservedSamples(loadReservedSamples());

    syncReservedSamples();
    window.addEventListener('storage', syncReservedSamples);
    window.addEventListener('focus', syncReservedSamples);

    return () => {
      window.removeEventListener('storage', syncReservedSamples);
      window.removeEventListener('focus', syncReservedSamples);
    };
  }, []);

  const today = startOfToday();
  const last7Dates = useMemo(() => getLast7Dates(), []);

  const byStatus = (status) => dashboardData?.packed_summary?.find((item) => item._id === status);

  const inShop = byStatus('in_shop');
  const sold = byStatus('sold');
  const sample = byStatus('sample');
  const returned = byStatus('returned');
  const damaged = byStatus('damaged');

  const todayPackedPackets = packedEntries
    .filter((item) => item.date?.split('T')[0] === today)
    .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const todayProducedKg = Number(dashboardData?.todays_produced_kg ?? 0);
  const totalAvailablePackets = Number(inShop?.total_units ?? 0) + getUnsoldReturnedUnits(supplierTrips);

  const currentPackedWeightKg = (dashboardData?.packed_summary || []).reduce((sum, item) => {
    if (['in_shop', 'delivered_to_counter', 'with_supplier', 'sample'].includes(item._id)) {
      return sum + (Number(item.total_weight_kg) || 0);
    }
    return sum;
  }, 0);

  const reservedSampleWeightKg = reservedSamples.reduce(
    (sum, sampleItem) => sum + (Number(sampleItem.amount_kg) || 0),
    0
  );

  const totalCurrentStockWeightKg = Math.max(
    0,
    Number(dashboardData?.current_stock_kg ?? 0) + currentPackedWeightKg - reservedSampleWeightKg
  );

  const sampleWeightByProduct = PRODUCT_TYPES.map((productType) => {
    const totalWeightKg = packedEntries
      .filter((item) => item.product_type === productType && item.status === 'sample')
      .reduce((sum, item) => sum + (Number(item.total_weight_kg) || 0), 0);

    return {
      productType,
      totalWeightKg,
      color: PRODUCT_COLORS[productType] || '#52b788',
    };
  }).filter((item) => item.totalWeightKg > 0);

  const soldAndReturnByProduct = PRODUCT_TYPES.map((productType) => {
    const soldUnits = packedEntries
      .filter((item) => item.product_type === productType && item.status === 'sold')
      .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    const returnedUnits = packedEntries
      .filter((item) => item.product_type === productType && ['returned', 'damaged'].includes(item.status))
      .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    return {
      productType,
      soldUnits,
      returnedUnits,
      color: PRODUCT_COLORS[productType] || '#52b788',
    };
  }).filter((item) => item.soldUnits > 0 || item.returnedUnits > 0);

  const weeklyProduction = last7Dates.map((date) => {
    const match = (dashboardData?.weekly_production || []).find((item) => item.date?.split('T')[0] === date);
    return {
      date,
      produced_kg: Number(match?.produced_kg ?? 0),
    };
  });

  const weeklySales = last7Dates.map((date) => {
    const units = sales.reduce((sum, sale) => {
      if (sale.date?.split('T')[0] !== date) return sum;
      return sum + (sale.items || []).reduce((itemSum, item) => itemSum + (Number(item.quantity) || 0), 0);
    }, 0);

    return {
      date,
      sold_units: units,
    };
  });

  const packedByProductRows = (dashboardData?.packed_by_product || []).map((item) => ({
    ...item,
    in_shop: Number(item.in_shop ?? 0) + getUnsoldReturnedUnits(supplierTrips, item._id),
  }));

  return (
    <div className="flex" style={{ minHeight: '100vh', background: '#0a1e14' }}>
      <Sidebar />
      <main className="md:ml-64 flex-1 p-5 md:p-8 pb-28 md:pb-8 w-full max-w-[100vw] overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 md:mb-8 fade-up flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-6 rounded-full" style={{ background: '#f4c430' }} />
                <h1
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 800,
                    fontSize: 28,
                    color: '#e8f5ef',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Dashboard
                </h1>
              </div>
              <p style={{ color: '#52b788', fontSize: 13, paddingLeft: 14 }}>
                Current stock, packed movement, samples, sales and 7-day performance
              </p>
            </div>
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
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              <span style={{ color: '#52b788', fontFamily: 'DM Sans, sans-serif' }}>Loading dashboard...</span>
            </div>
          ) : (
            <>
              <div className="rounded-3xl p-5 md:p-6 mb-6" style={SECTION_STYLE}>
                <SectionTitle
                  accent="#f4c430"
                  title="Real-Time Overview"
                  subtitle="Live snapshot of current stock, packing and today's activity"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <OverviewCard
                    label="Total Stock Weight"
                    value={totalCurrentStockWeightKg.toFixed(1)}
                    unit="kg"
                    icon={ICONS.weight}
                    color="#f4c430"
                    hint="Bulk stock plus current packed stock"
                  />
                  <OverviewCard
                    label="Available Packets"
                    value={totalAvailablePackets}
                    unit="units"
                    icon={ICONS.packet}
                    color="#52b788"
                    hint="Exact in-shop packets ready now"
                  />
                  <OverviewCard
                    label="Today Produced"
                    value={todayProducedKg.toFixed(1)}
                    unit="kg"
                    icon={ICONS.produced}
                    color="#c084fc"
                    hint="Production recorded today"
                  />
                  <OverviewCard
                    label="Today Packed"
                    value={todayPackedPackets}
                    unit="units"
                    icon={ICONS.todayPacked}
                    color="#60a5fa"
                    hint="Packets created in today's packing log"
                  />
                </div>
              </div>

              <div className="rounded-3xl p-5 md:p-6 mb-6" style={SECTION_STYLE}>
                <SectionTitle
                  accent="#52b788"
                  title="Unpackaged Stock by Product"
                  subtitle="Bulk stock currently available for packing"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {bulkStock.map((item) => {
                    const color = PRODUCT_COLORS[item.product_type] || '#52b788';
                    const low = Number(item.available_kg) < 5;
                    return (
                      <div
                        key={item.product_type}
                        className="rounded-2xl p-4 text-center"
                        style={{
                          background: `${color}08`,
                          border: `1px solid ${low ? 'rgba(248,113,113,0.35)' : `${color}24`}`,
                        }}
                      >
                        <div
                          style={{
                            color: '#9ad8bf',
                            fontSize: 12,
                            fontFamily: 'Syne, sans-serif',
                            fontWeight: 700,
                            marginBottom: 10,
                            lineHeight: 1.3,
                          }}
                        >
                          {getProductShortName(item.product_type)}
                        </div>
                        <div style={{ color: low ? '#f87171' : color, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28 }}>
                          {Number(item.available_kg).toFixed(1)}
                        </div>
                        <div style={{ color: '#52b788', fontSize: 11, marginTop: 4 }}>kg bulk</div>
                        {low && <div style={{ color: '#f87171', fontSize: 11, marginTop: 8 }}>Low stock</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl p-5 md:p-6 mb-6" style={SECTION_STYLE}>
                <SectionTitle
                  accent="#f4c430"
                  title="Packed Packets by Product"
                  subtitle="Current packed movement split by status"
                />
                <div className="overflow-x-auto custom-scroll">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {['Product', 'In Shop', 'At Counter', 'With Supplier', 'Sold', 'Sample'].map((heading, index) => (
                          <th
                            key={heading}
                            className={`py-3 px-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${index > 0 ? 'text-right' : 'text-left'}`}
                            style={{ color: '#52b788', fontFamily: 'Syne, sans-serif' }}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {packedByProductRows.map((item) => {
                        const color = PRODUCT_COLORS[item._id] || '#52b788';
                        return (
                          <tr key={item._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                                <span style={{ color: '#e8f5ef', fontSize: 13 }}>{item._id}</span>
                              </div>
                            </td>
                            {[item.in_shop, item.delivered_to_counter ?? 0, item.with_supplier, item.sold, item.sample].map((value, index) => (
                              <td key={`${item._id}-${index}`} className="px-3 py-3 text-right">
                                <span
                                  style={{
                                    color: value > 0 ? color : '#2d6a4f',
                                    fontFamily: 'Syne, sans-serif',
                                    fontWeight: value > 0 ? 700 : 400,
                                    fontSize: 14,
                                  }}
                                >
                                  {value ?? 0}
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

              <div className="rounded-3xl p-5 md:p-6 mb-6" style={SECTION_STYLE}>
                <SectionTitle
                  accent="#c084fc"
                  title="Sample Weight by Product"
                  subtitle="Weight currently marked as sample stock"
                />
                {sampleWeightByProduct.length === 0 ? (
                  <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>No sample weight recorded</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {sampleWeightByProduct.map((item) => (
                      <div
                        key={item.productType}
                        className="rounded-2xl p-4 text-center"
                        style={{ background: `${item.color}08`, border: `1px solid ${item.color}24` }}
                      >
                        <div style={{ color: '#9ad8bf', fontSize: 12, fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 10 }}>
                          {getProductShortName(item.productType)}
                        </div>
                        <div style={{ color: item.color, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28 }}>
                          {item.totalWeightKg.toFixed(2)}
                        </div>
                        <div style={{ color: '#52b788', fontSize: 11, marginTop: 4 }}>kg sample</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl p-5 md:p-6 mb-6" style={SECTION_STYLE}>
                <SectionTitle
                  accent="#fb923c"
                  title="Sold and Return Totals"
                  subtitle="Overall sold units and returned or damaged units"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <OverviewCard
                    label="Sold Units"
                    value={Number(sold?.total_units ?? 0)}
                    unit="units"
                    icon={ICONS.sold}
                    color="#c084fc"
                    hint="Total sold packet units"
                  />
                  <OverviewCard
                    label="Return Units"
                    value={Number(returned?.total_units ?? 0) + Number(damaged?.total_units ?? 0)}
                    unit="units"
                    icon={ICONS.returned}
                    color="#f87171"
                    hint="Returned and damaged packet units"
                  />
                </div>
                <div className="overflow-x-auto custom-scroll">
                  <table className="w-full text-sm min-w-[520px]">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {['Product', 'Sold Units', 'Return Units'].map((heading, index) => (
                          <th
                            key={heading}
                            className={`py-3 px-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${index > 0 ? 'text-right' : 'text-left'}`}
                            style={{ color: '#52b788', fontFamily: 'Syne, sans-serif' }}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {soldAndReturnByProduct.map((item) => (
                        <tr key={item.productType} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                              <span style={{ color: '#e8f5ef', fontSize: 13 }}>{item.productType}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span style={{ color: '#c084fc', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14 }}>
                              {item.soldUnits}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span style={{ color: '#f87171', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14 }}>
                              {item.returnedUnits}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="rounded-3xl p-5 md:p-6" style={SECTION_STYLE}>
                  <SectionTitle
                    accent="#f4c430"
                    title="7-Day Production"
                    subtitle="Daily production weight for the last 7 days"
                  />
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={weeklyProduction} barSize={24} margin={{ left: -20, right: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatShortDate}
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
                      <Tooltip content={<ChartTooltip unit="kg" />} cursor={{ fill: 'rgba(244,196,48,0.04)' }} />
                      <Bar dataKey="produced_kg" fill="url(#productionGrad)" radius={[7, 7, 0, 0]} />
                      <defs>
                        <linearGradient id="productionGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f4c430" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#e9a800" stopOpacity={0.55} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-3xl p-5 md:p-6" style={SECTION_STYLE}>
                  <SectionTitle
                    accent="#60a5fa"
                    title="7-Day Sales"
                    subtitle="Daily sold packet units for the last 7 days"
                  />
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={weeklySales} barSize={24} margin={{ left: -20, right: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatShortDate}
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
                      <Tooltip content={<ChartTooltip unit="units" />} cursor={{ fill: 'rgba(96,165,250,0.04)' }} />
                      <Bar dataKey="sold_units" fill="url(#salesGrad)" radius={[7, 7, 0, 0]} />
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity={0.55} />
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
