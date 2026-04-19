import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import logo from '../assets/ChipcharmLogo.png';

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const toast      = useToast();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!', 'Logged in successfully.');
      navigate('/');
    } catch {
      toast.error('Login failed', 'Invalid email or password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #071510 0%, #0d2b1e 50%, #0a1e14 100%)' }}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(244,196,48,0.06) 0%, transparent 70%)', top: '-10%', right: '-5%' }} />
        <div className="absolute w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(64,145,108,0.08) 0%, transparent 70%)', bottom: '-10%', left: '-5%' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }} />
      </div>

      <div className="relative w-full max-w-sm fade-up">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white p-1.5 mb-4 overflow-hidden"
            style={{
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <img src={logo} alt="ChipCharm Logo" className="w-full h-full object-contain" />
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: '#e8f5ef', letterSpacing: '-0.02em' }}>
            ChipCharm
          </h1>
          <p style={{ color: '#52b788', fontSize: 14, marginTop: 4 }}>Inventory Management System</p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: 'linear-gradient(145deg, rgba(19,45,32,0.9), rgba(13,27,20,0.9))',
            border: '1px solid rgba(244,196,48,0.12)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20, color: '#e8f5ef', marginBottom: 24 }}>
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#95d5b2', marginBottom: 8, fontFamily: 'DM Sans, sans-serif' }}>
                Email address
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="cc-input w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e8f5ef',
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'all 0.2s',
                }}
                placeholder="admin@chipcharm.com"
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#95d5b2', marginBottom: 8, fontFamily: 'DM Sans, sans-serif' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="cc-input w-full px-4 py-3 rounded-xl text-sm pr-12"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e8f5ef',
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'all 0.2s',
                    width: '100%',
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#52b788' }}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="cc-btn-primary w-full py-3.5 rounded-xl text-sm mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign In →'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: '#2d6a4f' }}>
          ChipCharm © {new Date().getFullYear()} · Inventory System
        </p>
      </div>
    </div>
  );
}