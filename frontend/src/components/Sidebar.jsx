import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  {
    to: '/', label: 'Dashboard', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    )
  },
  {
    to: '/stock', label: 'Daily Stock', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="16"/>
      </svg>
    )
  },
  {
    to: '/packed', label: 'Packed Items', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    )
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside
      className="w-64 flex flex-col min-h-screen fixed top-0 left-0 z-30"
      style={{
        background: 'linear-gradient(180deg, #0a2218 0%, #0d2b1e 60%, #0a1f16 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #f4c430 0%, #e9a800 100%)',
              boxShadow: '0 4px 16px rgba(244,196,48,0.35)',
            }}
          >
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, color: '#0d2b1e' }}>
              CC
            </span>
          </div>
          <div>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#e8f5ef', letterSpacing: '0.01em' }}>
              ChipCharm
            </p>
            <p style={{ fontSize: 11, color: '#52b788', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Inventory
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        <p style={{ fontSize: 10, color: '#52b788', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', paddingLeft: 12, marginBottom: 8 }}>
          Navigation
        </p>
        {links.map(({ to, label, icon }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={({ isActive: a }) => ({
                background: a ? 'linear-gradient(90deg, rgba(244,196,48,0.12), rgba(244,196,48,0.04))' : 'transparent',
                borderLeft: a ? '3px solid #f4c430' : '3px solid transparent',
                color: a ? '#f4c430' : '#7fb89a',
                fontFamily: 'DM Sans, sans-serif',
                paddingLeft: 9,
              })}
            >
              <span style={{ opacity: isActive ? 1 : 0.7 }}>{icon}</span>
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-2"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #2d6a4f, #40916c)', color: '#e8f5ef', fontFamily: 'Syne, sans-serif' }}
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: '#e8f5ef', fontFamily: 'DM Sans, sans-serif' }}>
              {user?.name || 'User'}
            </p>
            <p className="text-xs truncate" style={{ color: '#52b788' }}>
              {user?.email || ''}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200"
          style={{ color: '#7fb89a', fontFamily: 'DM Sans, sans-serif' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,57,43,0.12)'; e.currentTarget.style.color = '#e74c3c'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7fb89a'; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}