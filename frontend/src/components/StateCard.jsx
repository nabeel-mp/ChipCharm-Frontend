export default function StatCard({ label, value, unit, color = 'orange', icon }) {
  const colors = {
    orange: 'bg-orange-50 text-orange-600',
    green:  'bg-green-50  text-green-600',
    blue:   'bg-blue-50   text-blue-600',
    red:    'bg-red-50    text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </span>
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center
                          text-base ${colors[color]}`}>
          {icon}
        </span>
      </div>
      <p className="text-3xl font-bold text-gray-900">
        {value ?? '—'}
        {unit && (
          <span className="text-base font-normal text-gray-400 ml-1">{unit}</span>
        )}
      </p>
    </div>
  );
}