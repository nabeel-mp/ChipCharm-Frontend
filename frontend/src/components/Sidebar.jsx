import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/ChipcharmLogo.png';

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
    to: '/stock', label: 'Stock', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="16"/>
      </svg>
    )
  },
  {
    to: '/packed', label: 'Packed', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    )
  },
  {
    to: '/boxes', label: 'Boxes', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
        <line x1="10" y1="12" x2="14" y2="12"/>
      </svg>
    )
  },
  {
    to: '/supplier-trips', label: 'Suppliers', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    )
  },
  {
    to: '/supplier-inventory', label: 'Sup. Stock', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    )
  },
  {
    to: '/finance', label: 'Finance', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    )
  },
  {
    to: '/counters', label: 'Counters', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    )
  },
];

// Mobile bottom nav shows only first 5
const mobileLinks = links.slice(0, 5);

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const roleColors = {
    owner:    '#f4c430',
    manager:  '#60a5fa',
    supplier: '#c084fc'
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col min-h-screen fixed top-0 left-0 z-30"
        style={{ background: 'linear-gradient(180deg, #0a2218 0%, #0d2b1e 60%, #0a1f16 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Logo */}
        <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white p-1 overflow-hidden"
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.35)' }}>
              <img src={logo} alt="ChipCharm Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#e8f5ef' }}>ChipCharm</p>
              <p style={{ fontSize: 10, color: '#52b788', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Inventory</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p style={{ fontSize: 10, color: '#52b788', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', paddingLeft: 12, marginBottom: 8, marginTop: 4 }}>
            Navigation
          </p>
          {links.map(({ to, label, icon }) => {
            const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
            return (
              <NavLink key={to} to={to} end={to === '/'}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={({ isActive: a }) => ({
                  background: a ? 'linear-gradient(90deg, rgba(244,196,48,0.12), rgba(244,196,48,0.04))' : 'transparent',
                  borderLeft: a ? '3px solid #f4c430' : '3px solid transparent',
                  color: a ? '#f4c430' : '#7fb89a',
                  fontFamily: 'DM Sans, sans-serif',
                  paddingLeft: 9,
                })}>
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
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #2d6a4f, #40916c)', color: '#e8f5ef', fontFamily: 'Syne, sans-serif' }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#e8f5ef', fontFamily: 'DM Sans, sans-serif' }}>
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] uppercase font-bold tracking-wider mt-0.5" style={{ color: roleColors[user?.role] || '#52b788' }}>
                {user?.role || 'Supplier'}
              </p>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200"
            style={{ color: '#7fb89a', fontFamily: 'DM Sans, sans-serif' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,57,43,0.12)'; e.currentTarget.style.color = '#e74c3c'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7fb89a'; }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 flex items-center justify-around px-1"
        style={{
          background: 'rgba(13, 43, 30, 0.97)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 10px)',
          paddingTop: '8px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
        }}>
        {mobileLinks.map(({ to, label, icon }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} end={to === '/'}
              className="flex flex-col items-center justify-center flex-1 min-w-0 transition-colors py-1"
              style={{ color: isActive ? '#f4c430' : '#7fb89a' }}>
              <span style={{ transform: isActive ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                {icon}
              </span>
              <span style={{ fontSize: '9px', fontFamily: 'DM Sans, sans-serif', fontWeight: isActive ? 600 : 500, marginTop: 3 }}>
                {label}
              </span>
            </NavLink>
          );
        })}
        {/* More menu for remaining links */}
        <div className="flex flex-col items-center justify-center flex-1 min-w-0 py-1 relative group">
          <div className="flex flex-col items-center" style={{ color: links.slice(5).some(l => location.pathname.startsWith(l.to)) ? '#f4c430' : '#7fb89a' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
            <span style={{ fontSize: '9px', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, marginTop: 3 }}>More</span>
          </div>
          <div className="absolute bottom-full right-0 mb-2 rounded-2xl overflow-hidden opacity-0 pointer-events-none group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all"
            style={{ background: '#0d2b1e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 -8px 32px rgba(0,0,0,0.5)', minWidth: 170 }}>
            {links.slice(5).map(({ to, label, icon }) => (
              <NavLink key={to} to={to}
                className="flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                style={{ color: location.pathname.startsWith(to) ? '#f4c430' : '#7fb89a', fontFamily: 'DM Sans, sans-serif' }}>
                {icon} {label}
              </NavLink>
            ))}
            <button onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm border-t"
              style={{ color: '#f87171', fontFamily: 'DM Sans, sans-serif', borderColor: 'rgba(255,255,255,0.06)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}