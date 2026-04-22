import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import LoginPage       from './pages/LoginPage';
import DashboardPage   from './pages/DashboardPage';
import StockPage       from './pages/StockPage';
import PackedPage      from './pages/PackedPage';
import CountersPage    from './pages/CountersPage';
import BoxesPage       from './pages/BoxesPage';
import SupplierTripsPage from './pages/SupplierTripsPage';
import FinancePage     from './pages/FinancePage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/stock"          element={<ProtectedRoute><StockPage /></ProtectedRoute>} />
            <Route path="/packed"         element={<ProtectedRoute><PackedPage /></ProtectedRoute>} />
            <Route path="/boxes"          element={<ProtectedRoute><BoxesPage /></ProtectedRoute>} />
            <Route path="/supplier-trips" element={<ProtectedRoute><SupplierTripsPage /></ProtectedRoute>} />
            <Route path="/finance"        element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />
            <Route path="/counters"       element={<ProtectedRoute><CountersPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}