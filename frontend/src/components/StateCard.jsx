export default function StatCard({ label, value, unit, icon, accent = 'gold', trend }) {
  const accents = {
    gold:   { bg: 'rgba(244,196,48,0.1)',  border: 'rgba(244,196,48,0.2)',  text: '#f4c430',  val: '#f4c430'  },
    green:  { bg: 'rgba(82,183,136,0.1)',  border: 'rgba(82,183,136,0.2)',  text: '#52b788',  val: '#95d5b2'  },
    blue:   { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.2)',  text: '#60a5fa',  val: '#93c5fd'  },
    red:    { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)',   text: '#f87171',  val: '#fca5a5'  },
    purple: { bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.2)',  text: '#c084fc',  val: '#d8b4fe'  },
  };
  const a = accents[accent] || accents.gold;

  return (
    <div
      className="stat-card rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #132d20, #0f2419)',
        border: `1px solid ${a.border}`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      {/* Glow */}
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none"
        style={{ background: a.bg, filter: 'blur(20px)', transform: 'translate(30%, -30%)' }}
      />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: '#52b788', fontFamily: 'Syne, sans-serif', letterSpacing: '0.1em' }}
          >
            {label}
          </span>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
            style={{ background: a.bg, color: a.text }}
          >
            {icon}
          </div>
        </div>

        <div className="flex items-end gap-2">
          <p
            className="text-3xl font-black leading-none"
            style={{ color: a.val, fontFamily: 'Syne, sans-serif' }}
          >
            {value ?? '—'}
          </p>
          {unit && (
            <span className="text-sm mb-0.5" style={{ color: '#52b788' }}>{unit}</span>
          )}
        </div>

        {trend && (
          <p className="text-xs mt-2" style={{ color: '#52b788' }}>{trend}</p>
        )}
      </div>
    </div>
  );
}