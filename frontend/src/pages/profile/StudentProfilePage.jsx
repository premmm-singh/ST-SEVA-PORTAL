import React, { useState, useEffect } from 'react';
import {
  User,
  GraduationCap,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Fingerprint
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const StudentProfilePage = () => {
  const { user, fetchProfile } = useAuth();
  const sp = user?.student_profile;

  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    gender: 'Male',
    category: 'Scheduled Tribe (ST)',
    sub_caste: '',
    father_name: '',
    mother_name: '',
    annual_family_income: '',
    address_line1: '',
    address_line2: '',
    district: '',
    state: '',
    pincode: '',
    bank_name: '',
    bank_account_number: '',
    bank_ifsc: '',
    bank_branch: '',
    institution_name: '',
    institution_code_aishe: '',
    course_name: '',
    current_year_of_study: 1
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Aadhaar eKYC modal state
  const [showAadhaarModal, setShowAadhaarModal] = useState(false);
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [aadhaarStep, setAadhaarStep] = useState('input'); // 'input', 'otp'
  const [aadhaarLoading, setAadhaarLoading] = useState(false);

  useEffect(() => {
    if (sp) {
      setFormData({
        full_name: sp.full_name || '',
        dob: sp.dob ? sp.dob.slice(0, 10) : '',
        gender: sp.gender || 'Male',
        category: sp.category || 'Scheduled Tribe (ST)',
        sub_caste: sp.sub_caste || '',
        father_name: sp.father_name || '',
        mother_name: sp.mother_name || '',
        annual_family_income: sp.annual_family_income || '',
        address_line1: sp.address_line1 || '',
        address_line2: sp.address_line2 || '',
        district: sp.district || '',
        state: sp.state || '',
        pincode: sp.pincode || '',
        bank_name: sp.bank_name || '',
        bank_account_number: '', // Left blank unless updating
        bank_ifsc: sp.bank_ifsc || '',
        bank_branch: sp.bank_branch || '',
        institution_name: sp.institution_name || '',
        institution_code_aishe: sp.institution_code_aishe || '',
        course_name: sp.course_name || '',
        current_year_of_study: sp.current_year_of_study || 1
      });
    }
  }, [sp]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        ...formData,
        annual_family_income: formData.annual_family_income ? parseFloat(formData.annual_family_income) : null,
        current_year_of_study: parseInt(formData.current_year_of_study, 10) || 1
      };
      if (!formData.bank_account_number) {
        delete payload.bank_account_number;
      }
      await api.put('/profile/student', payload);
      await fetchProfile();
      setSuccessMsg('ST Student Profile successfully updated with encrypted credentials.');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save profile. Please check fields.');
    } finally {
      setSaving(false);
    }
  };

  const handleInitAadhaar = async () => {
    if (!/^\d{12}$/.test(aadhaarInput)) {
      alert('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    setAadhaarLoading(true);
    try {
      await api.post('/auth/aadhaar/ekyc-init', { aadhaar_number: aadhaarInput });
      setAadhaarStep('otp');
    } catch (err) {
      alert('Aadhaar OTP request failed');
    } finally {
      setAadhaarLoading(false);
    }
  };

  const handleVerifyAadhaar = async () => {
    setAadhaarLoading(true);
    try {
      await api.post('/auth/aadhaar/ekyc-verify', {
        aadhaar_number: aadhaarInput,
        otp_code: aadhaarOtp
      });
      await fetchProfile();
      setShowAadhaarModal(false);
      setSuccessMsg('Aadhaar eKYC verified and securely linked!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to verify Aadhaar OTP');
    } finally {
      setAadhaarLoading(false);
    }
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-8 max-w-7xl mx-auto w-full">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#0B4D9C] text-white flex items-center justify-center text-xl font-bold border-2 border-amber-400">
            {sp?.full_name ? sp.full_name[0] : 'S'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{sp?.full_name || 'ST Scholar Profile'}</h1>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                {sp?.category || 'Scheduled Tribe (ST)'}
              </span>
              <span>•</span>
              <span>Mobile: {user?.mobile_masked || 'Registered'}</span>
              <span>•</span>
              <span>Role: Student / Beneficiary</span>
            </div>
          </div>
        </div>

        {/* Aadhaar eKYC Verification Badge */}
        <div>
          {user?.is_verified ? (
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 px-3.5 py-1.5 rounded-lg text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Aadhaar eKYC Verified (UIDAI Vault)</span>
            </div>
          ) : (
            <button
              onClick={() => setShowAadhaarModal(true)}
              className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
            >
              <Fingerprint className="w-4 h-4 text-amber-700" />
              <span>Link Aadhaar eKYC (Required for DBT)</span>
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 bg-emerald-50 text-emerald-800 border border-emerald-200 p-3.5 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 bg-red-50 text-red-700 border border-red-200 p-3.5 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quick Action Navigation for Scholarship Applications */}
      <div className="bg-gradient-to-r from-[#0d3b66] to-[#005696] text-white rounded-xl p-5 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <span>🎓</span> ST Scholarship & Fellowship Portal
          </h2>
          <p className="text-xs text-blue-100 mt-0.5">
            Manage your submissions, track approval timeline, or apply for centrally sponsored schemes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/applications"
            className="px-4 py-2 bg-white text-[#0d3b66] text-xs font-bold rounded-lg hover:bg-blue-50 transition shadow-sm"
          >
            My Applications
          </a>
          <a
            href="/applications/new"
            className="px-4 py-2 bg-[#ff6600] text-white text-xs font-bold rounded-lg hover:bg-[#e05a00] transition shadow-sm"
          >
            + Apply for Scheme
          </a>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Section 1: Demographics & Identity */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-5">
            <User className="w-5 h-5 text-[#0B4D9C]" />
            <h2 className="text-base font-bold text-slate-800">1. Demographics & Tribal Category Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Social Category</label>
              <input
                type="text"
                disabled
                value="Scheduled Tribe (ST)"
                className="w-full rounded border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sub-Caste / Tribe Name</label>
              <input
                type="text"
                name="sub_caste"
                value={formData.sub_caste}
                onChange={handleChange}
                placeholder="e.g. Munda, Santhal, Gond, Bhil, Oraon"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Annual Family Income (₹)</label>
              <input
                type="number"
                name="annual_family_income"
                value={formData.annual_family_income}
                onChange={handleChange}
                placeholder="e.g. 150000"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Domicile & Address */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-5">
            <h2 className="text-base font-bold text-slate-800">2. Permanent Domicile & Communication Address</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Address Line 1</label>
              <input
                type="text"
                name="address_line1"
                value={formData.address_line1}
                onChange={handleChange}
                placeholder="Village / House / Ward No."
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">State / UT</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="e.g. Jharkhand, Odisha, MP"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">District</label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                placeholder="e.g. Ranchi, Khunti, Mayurbhanj"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code</label>
              <input
                type="text"
                name="pincode"
                maxLength={6}
                value={formData.pincode}
                onChange={handleChange}
                placeholder="e.g. 834001"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Bank Account for DBT (AES-256 Protected) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-[#0B4D9C]" />
              <h2 className="text-base font-bold text-slate-800">3. Direct Benefit Transfer (DBT) Bank Account Details</h2>
            </div>
            <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
              AES-256 Vault Encryption Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                placeholder="e.g. State Bank of India"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Account Number {sp?.bank_account_masked ? `(Currently: ${sp.bank_account_masked})` : ''}
              </label>
              <input
                type="text"
                name="bank_account_number"
                value={formData.bank_account_number}
                onChange={handleChange}
                placeholder={sp?.bank_account_masked ? 'Leave blank to retain existing' : 'Enter Account Number'}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                name="bank_ifsc"
                value={formData.bank_ifsc}
                onChange={handleChange}
                placeholder="e.g. SBIN0000118"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Academic Details */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-5">
            <GraduationCap className="w-5 h-5 text-[#0B4D9C]" />
            <h2 className="text-base font-bold text-slate-800">4. Academic & AISHE Institute Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Institution / College Name</label>
              <input
                type="text"
                name="institution_name"
                value={formData.institution_name}
                onChange={handleChange}
                placeholder="e.g. Birsa Institute of Technology (BIT) Sindri"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">AISHE Code</label>
              <input
                type="text"
                name="institution_code_aishe"
                value={formData.institution_code_aishe}
                onChange={handleChange}
                placeholder="e.g. C-44281"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Course & Branch</label>
              <input
                type="text"
                name="course_name"
                value={formData.course_name}
                onChange={handleChange}
                placeholder="e.g. B.Tech Computer Science & Engineering"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Year of Study</label>
              <select
                name="current_year_of_study"
                value={formData.current_year_of_study}
                onChange={handleChange}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
                <option value={5}>5th Year (Post-Grad / Integrated)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#0B4D9C] hover:bg-[#083D7C] text-white font-bold px-8 py-3 rounded-lg shadow-sm hover:shadow transition flex items-center gap-2 text-sm"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Encrypting & Saving...' : 'Save & Update Profile'}</span>
          </button>
        </div>
      </form>

      {/* Aadhaar eKYC Sandbox Modal */}
      {showAadhaarModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-300">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-[#0B4D9C]" />
              <span>UIDAI Aadhaar eKYC Verification</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Sandbox verification linking your Aadhaar vault token to your scholarship profile.
            </p>

            <div className="mt-4 space-y-4">
              {aadhaarStep === 'input' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">12-Digit Aadhaar Number</label>
                  <input
                    type="text"
                    maxLength={12}
                    value={aadhaarInput}
                    onChange={(e) => setAadhaarInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456789012"
                    className="w-full rounded border border-slate-300 px-3 py-2 text-center text-lg font-mono tracking-widest"
                  />
                  <button
                    onClick={handleInitAadhaar}
                    disabled={aadhaarLoading || aadhaarInput.length !== 12}
                    className="w-full mt-4 bg-[#0B4D9C] text-white font-bold py-2.5 rounded text-sm disabled:bg-slate-300"
                  >
                    {aadhaarLoading ? 'Requesting UIDAI OTP...' : 'Send UIDAI OTP'}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 mb-3">
                    Sandbox UIDAI OTP is <span className="font-bold font-mono">123456</span>.
                  </div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Enter 6-Digit UIDAI OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={aadhaarOtp}
                    onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full rounded border border-slate-300 px-3 py-2 text-center text-lg font-mono tracking-widest"
                  />
                  <button
                    onClick={handleVerifyAadhaar}
                    disabled={aadhaarLoading || aadhaarOtp.length !== 6}
                    className="w-full mt-4 bg-emerald-700 text-white font-bold py-2.5 rounded text-sm disabled:bg-slate-300"
                  >
                    {aadhaarLoading ? 'Validating against Vault...' : 'Confirm Aadhaar eKYC'}
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowAadhaarModal(false)}
                className="w-full text-center text-xs text-slate-500 hover:underline pt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfilePage;
