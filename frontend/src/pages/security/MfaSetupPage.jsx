import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Lock,
  Unlock
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MfaSetupPage = () => {
  const { user, fetchProfile } = useAuth();
  const [setupData, setSetupData] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [copiedKey, setCopiedKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const initSetup = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/security/mfa/setup');
      setSetupData(res.data);
    } catch (e) {
      setErrorMsg('Failed to initialize MFA setup.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableMfa = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/security/mfa/enable', { totp_code: totpCode });
      setBackupCodes(res.data.backup_codes);
      setSuccessMsg(res.data.message);
      await fetchProfile();
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || 'Invalid 6-digit code. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!window.confirm('Are you sure you want to disable Two-Factor Authentication?')) return;
    setLoading(true);
    try {
      await api.post('/security/mfa/disable', {});
      await fetchProfile();
      setSetupData(null);
      setBackupCodes([]);
      setSuccessMsg('MFA has been disabled.');
    } catch (e) {
      alert('Failed to disable MFA');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Two-Factor Authentication (TOTP MFA)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Feature 148: Protect your officer or student portal with Google Authenticator RFC 6238 time-based OTP.
          </p>
        </div>
        <div>
          {user?.has_mfa ? (
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>MFA Active & Protected</span>
            </span>
          ) : (
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-700" />
              <span>MFA Not Configured</span>
            </span>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3.5 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-3.5 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main MFA Content */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        {user?.has_mfa ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-emerald-900">Your account is secured with Two-Factor Authentication</h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Whenever you sign in, an additional 6-digit verification code from your authenticator app will be required.
                </p>
              </div>
            </div>

            {backupCodes.length > 0 && (
              <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase">Emergency Recovery Backup Codes</h4>
                <p className="text-xs text-slate-600">
                  Save these 5 one-time recovery codes in a secure location. You can use each code once if you lose access to your authenticator app:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-sm pt-2">
                  {backupCodes.map((code, idx) => (
                    <div key={idx} className="bg-white p-2 border border-slate-300 rounded text-center font-bold text-[#0B4D9C]">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={handleDisableMfa}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded text-xs transition"
              >
                Disable Two-Factor Authentication
              </button>
            </div>
          </div>
        ) : !setupData ? (
          <div className="text-center py-6 space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-[#0B4D9C] flex items-center justify-center mx-auto border border-blue-200">
              <KeyRound className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Set Up Google Authenticator</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enhance your account security using any standard TOTP authenticator app like Google Authenticator, Microsoft Authenticator, or Authy.
              </p>
            </div>
            <button
              onClick={initSetup}
              disabled={loading}
              className="bg-[#0B4D9C] hover:bg-[#083D7C] text-white font-bold px-6 py-2.5 rounded text-sm transition shadow-sm"
            >
              {loading ? 'Initializing Secret...' : 'Begin Setup Wizard'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* QR Code */}
              <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                <img
                  src={setupData.qr_code_base64}
                  alt="MFA QR Code"
                  className="w-48 h-48 rounded border border-slate-300 shadow-sm"
                />
                <span className="text-xs text-slate-500 mt-2 font-medium">Scan with Authenticator App</span>
              </div>

              {/* Instructions & Secret Key */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">1. Scan the QR code or enter code manually</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Open Google Authenticator on your mobile device and tap "Scan a QR code".
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Secret Key (Manual Entry)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={setupData.secret}
                      className="flex-1 bg-slate-100 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-xs text-slate-800 select-all"
                    />
                    <button
                      onClick={() => copyToClipboard(setupData.secret)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all duration-200 ${
                        copiedKey
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-copy-flash scale-105'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border border-transparent'
                      }`}
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600 animate-checkmark-draw" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Form to Confirm Code */}
                <form onSubmit={handleEnableMfa} className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-slate-800">2. Verify 6-digit code from App</h3>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 849201"
                    className="w-full rounded border border-slate-300 px-3 py-2 text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
                  />

                  <button
                    type="submit"
                    disabled={loading || totpCode.length !== 6}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold py-2.5 rounded text-sm transition shadow-sm"
                  >
                    {loading ? 'Activating...' : 'Verify Code & Enable MFA'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MfaSetupPage;
