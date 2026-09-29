import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Smartphone,
  Shield,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Globe,
  Clock,
  History
} from 'lucide-react';
import api from '../../services/api';

const ActiveSessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, historyRes] = await Promise.all([
        api.get('/sessions/active'),
        api.get('/sessions/history')
      ]);
      setSessions(sessionsRes.data);
      setHistory(historyRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRevokeOne = async (id) => {
    try {
      const res = await api.delete(`/sessions/${id}`);
      setMsg(res.data.message);
      await loadData();
    } catch (e) {
      alert('Failed to revoke session');
    }
  };

  const handleRevokeOthers = async () => {
    if (!window.confirm('Are you sure you want to sign out from all other devices?')) return;
    try {
      const res = await api.delete('/sessions/revoke-others/all');
      setMsg(res.data.message);
      await loadData();
    } catch (e) {
      alert('Failed to revoke other sessions');
    }
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Multi-Device Session & Security Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Features 9, 10, 13 & 143: Monitor logged-in hardware, IP locations, and revoke untrusted devices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sessions.length > 1 && (
            <button
              onClick={handleRevokeOthers}
              className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-300 text-xs font-bold px-3 py-1.5 rounded transition flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Revoke All Other Devices</span>
            </button>
          )}
          <button
            onClick={loadData}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded transition flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3.5 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Active Sessions List */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Laptop className="w-4 h-4 text-[#0B4D9C]" />
          <span>Currently Active Sessions ({sessions.length})</span>
        </h2>

        <div className="space-y-3">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="p-4 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 hover:bg-slate-50 transition"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#0B4D9C] flex items-center justify-center shrink-0">
                  {sess.device_name?.toLowerCase().includes('mobile') ? (
                    <Smartphone className="w-5 h-5" />
                  ) : (
                    <Laptop className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{sess.device_name}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      Active
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Globe className="w-3 h-3 text-slate-400" />
                      <span>{sess.ip_address}</span>
                    </span>
                    <span>•</span>
                    <span>{sess.location_estimate}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Last active: {new Date(sess.last_active_at).toLocaleTimeString('en-IN')}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => handleRevokeOne(sess.id)}
                  className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded font-semibold transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Terminate Session</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Login Activity History (Feature 13) */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-[#0B4D9C]" />
          <span>Recent Login Activity History (Audit Trail)</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Auth Method</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Device</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">Estimated Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                    {new Date(h.created_at).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-700 capitalize">
                    {h.auth_method.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      h.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {h.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {h.device_summary}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">
                    {h.ip_address}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {h.location}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActiveSessionsPage;
