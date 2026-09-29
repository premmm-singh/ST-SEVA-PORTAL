import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/auth/password/reset-request', { email });
      setSuccess(res.data.message);
    } catch (err) {
      setError('Unable to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 py-12 px-4 sm:px-8 bg-slate-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="bg-[#0B4D9C] text-white p-5 border-b-2 border-amber-400">
          <h2 className="text-lg font-bold">Password Recovery</h2>
          <p className="text-xs text-blue-100 mt-0.5">Government Portal Account Security</p>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-700">{success}</p>
              <Link to="/login" className="inline-block bg-[#0B4D9C] text-white text-xs font-bold px-4 py-2 rounded">
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 border border-red-200 p-2.5 rounded text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <p className="text-xs text-slate-600">
                Enter your registered official or student email address. A time-limited reset link will be dispatched.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@stseva.gov.in"
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0B4D9C] hover:bg-[#083D7C] text-white font-bold py-2.5 rounded text-sm transition"
              >
                {loading ? 'Dispatching Link...' : 'Send Recovery Link'}
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
