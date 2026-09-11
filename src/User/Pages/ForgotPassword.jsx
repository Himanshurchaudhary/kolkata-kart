import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const ForgotPassword = () => {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/user/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Something went wrong.');
        return;
      }
      setSuccess(true);
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">

        {success ? (
          <div className="flex flex-col items-center text-center py-4">
            <CheckCircle size={56} className="text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Sent!</h2>
            <p className="text-gray-500 text-sm mb-6">
              We've sent a password reset link to <strong>{email}</strong>. Please check your inbox.
            </p>
            <a
              href="/"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-full text-sm transition-colors duration-200 text-center block"
            >
              Back to Home
            </a>
          </div>

        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Forgot Password?</h2>
            <p className="text-gray-500 text-sm mb-6">
              Enter your registered email and we'll send you a reset link.
            </p>

            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="Enter your registered email"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 rounded-full text-sm transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              )}
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <a
              href="/"
              className="block text-center text-sm text-gray-500 hover:text-green-600 mt-5 transition"
            >
              ← Back to Home
            </a>
          </>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;