'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, KeyRound, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [keyphrase, setKeyphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyphrase }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user session
        localStorage.setItem('wealthbuddy_user', JSON.stringify(data.user));
        router.push('/');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-card p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">WealthBuddy AI</h1>
          <p className="text-gray-400">Enter your keyphrase to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="keyphrase" className="block text-sm font-medium text-gray-300 mb-3">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-4 h-4" />
                <span>Keyphrase</span>
              </div>
            </label>
            <input
              type="text"
              id="keyphrase"
              value={keyphrase}
              onChange={(e) => setKeyphrase(e.target.value)}
              className="modern-input w-full"
              placeholder="Enter your keyphrase (e.g., 'test')"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="glass-card bg-red-500/10 border-red-500/20 p-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !keyphrase.trim()}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 loading-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-5 h-5" />
                <span>Login</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 glass-card bg-blue-500/10 border-blue-500/20 p-4">
          <div className="text-center">
            <p className="text-blue-400 text-sm font-medium mb-2">💡 For Testing</p>
            <p className="text-gray-400 text-sm">
              Use keyphrase: <code className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded font-mono">test</code>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            Secure access to your financial dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
