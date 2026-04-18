import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/',       label: 'Dashboard',    icon: '📊' },
  { to: '/stock',  label: 'Daily Stock',  icon: '🏭' },
  { to: '/packed', label: 'Packed Items', icon: '📦' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col
                      min-h-screen fixed top-0 left-0 z-30">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center
                        justify-center text-white font-bold text-sm">
          CC
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">ChipCharm</p>
          <p className="text-xs text-gray-400">Inventory</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
               font-medium transition-colors
               ${isActive
                 ? 'bg-orange-50 text-orange-600'
                 : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center
                          justify-center text-orange-600 font-semibold text-xs">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 text-sm text-red-500
                     hover:bg-red-50 rounded-xl transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}