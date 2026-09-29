import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, AlertCircle, ArrowRight, UserPlus, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    mobile_number: '',
    email: '',
    password: '',
    confirm_password: '',
    aadhaar_number: '',
    consent_aadhaar: true
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { fetchProfile } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      setErrorMsg('Passwords do not match');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(formData.mobile_number)) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }
    if (formData.aadhaar_number && !/^\d{12}$/.test(formData.aadhaar_number)) {
      setErrorMsg('Aadhaar number must be exactly 12 numerical digits');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        full_name: formData.full_name,
        mobile_number: formData.mobile_number,
        email: formData.email || null,
        password: formData.password,
        aadhaar_number: formData.aadhaar_number || null,
        consent_aadhaar: formData.consent_aadhaar
      });

      localStorage.setItem('st_access_token', res.data.access_token);
      localStorage.setItem('st_refresh_token', res.data.refresh_token);
      await fetchProfile();
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 py-10 px-4 sm:px-8 bg-slate-100 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-[#0B4D9C] text-white p-6 border-b-2 border-amber-400">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">ST Scholar Registration</h2>
              <p className="text-xs text-blue-100 mt-1">
                Scheduled Tribe Fellowship & Scholarship Verification Portal
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <UserPlus className="w-6 h-6 text-amber-300" />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Legal Name (as per Certificate / Aadhaar) *
            </label>
            <input
              type="text"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              placeholder="e.g. Ramesh Kumar Birhor"
              className="block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                10-Digit Mobile Number *
              </label>
              <input
                type="tel"
                name="mobile_number"
                required
                maxLength={10}
                value={formData.mobile_number}
                onChange={handleChange}
                placeholder="9876543210"
                className="block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="student@example.com"
                className="block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password *
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 8 characters"
                className="block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirm_password"
                required
                minLength={8}
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Re-enter password"
                className="block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Aadhaar Number (12 Digits - Optional for Sandbox)
            </label>
            <input
              type="text"
              name="aadhaar_number"
              maxLength={12}
              value={formData.aadhaar_number}
              onChange={handleChange}
              placeholder="123456789012"
              className="block w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Protected by AES-256 government cryptographic vault. Stored as encrypted tokens only.
            </p>
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              name="consent_aadhaar"
              id="consent_aadhaar"
              checked={formData.consent_aadhaar}
              onChange={handleChange}
              className="mt-1 h-4 w-4 text-[#0B4D9C] focus:ring-[#0B4D9C] border-slate-300 rounded"
            />
            <label htmlFor="consent_aadhaar" className="text-xs text-slate-600 leading-tight">
              I consent to the Ministry of Tribal Affairs verifying my Scheduled Tribe (ST) category and identity against national registries for scholarship eligibility.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B4D9C] hover:bg-[#083D7C] text-white font-bold py-3 rounded text-sm transition shadow-sm flex items-center justify-center gap-2 mt-4"
          >
            <span>{loading ? 'Creating Account...' : 'Complete ST Scholar Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center text-xs text-slate-600 pt-2">
            <span>Already registered? </span>
            <Link to="/login" className="text-[#0B4D9C] font-bold hover:underline">
              Log In Here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
