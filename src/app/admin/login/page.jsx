'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLoginMutation } from '../../../services/api';
import { useTheme } from '../../providers';

export default function AdminLoginPage() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [login, { isLoading }] = useLoginMutation();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login({ email, password }).unwrap();
      if (res?.token) {
        localStorage.setItem('nv_token', res.token);
        router.push('/admin/dashboard');
      } else {
        setError('Login failed');
      }
    } catch (err) {
      setError(err?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: colors.background }}>
      <div className="w-full max-w-md rounded-2xl shadow-lg p-6 sm:p-8" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold" style={{ color: colors.text }}>Admin Login</h1>
          <p className="text-sm mt-1" style={{ color: colors.mutedText }}>Sign in to manage categories and menu</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg px-4 py-3 text-sm"
              style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-4 py-3 text-sm"
              style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <div className="text-sm" style={{ color: '#ef4444' }}>{error}</div>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full font-semibold py-3 rounded-lg transition-colors"
            style={{ background: colors.green500, color: '#fff' }}
          >
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}


