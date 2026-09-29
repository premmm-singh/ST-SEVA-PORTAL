import React, { useState, useEffect } from 'react';
import { ShieldCheck, Building2, CheckCircle2, AlertCircle, Save, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const OfficerProfilePage = () => {
  const { user, fetchProfile } = useAuth();
  const op = user?.officer_profile;

  const [formData, setFormData] = useState({
    full_name: '',
    designation: '',
    department: '',
    state: '',
    district: '',
    office_address: '',
    employee_id: '',
    assigned_schemes: []
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const allSchemes = [
    { id: 'ST_PRE_MATRIC', name: 'Pre-Matric Scholarship for ST Students (Class IX & X)' },
    { id: 'ST_POST_MATRIC', name: 'Post-Matric Scholarship for ST Students (Higher Secondary & College)' },
    { id: 'NATIONAL_FELLOWSHIP_ST', name: 'National Fellowship and Scholarship for Higher Education of ST Students' },
    { id: 'TOP_CLASS_EDUCATION_ST', name: 'National Overseas Scholarship for ST Students' },
  ];

  useEffect(() => {
    if (op) {
      setFormData({
        full_name: op.full_name || '',
        designation: op.designation || '',
        department: op.department || '',
        state: op.state || '',
        district: op.district || '',
        office_address: op.office_address || '',
        employee_id: op.employee_id || '',
        assigned_schemes: op.assigned_schemes || []
      });
    }
  }, [op]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleScheme = (schemeId) => {
    setFormData((prev) => {
      const current = prev.assigned_schemes || [];
      if (current.includes(schemeId)) {
        return { ...prev, assigned_schemes: current.filter((id) => id !== schemeId) };
      }
      return { ...prev, assigned_schemes: [...current, schemeId] };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.put('/profile/officer', formData);
      await fetchProfile();
      setSuccessMsg('Verification Officer Profile successfully updated.');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-8 max-w-7xl mx-auto w-full">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#072C5B] text-white flex items-center justify-center text-xl font-bold border-2 border-blue-400">
            {op?.full_name ? op.full_name[0] : 'O'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{op?.full_name || 'Verification Officer'}</h1>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                {op?.designation || 'District Welfare Officer'}
              </span>
              <span>•</span>
              <span>District: {op?.district || 'Ranchi'}, {op?.state || 'Jharkhand'}</span>
              <span>•</span>
              <span>Emp ID: {op?.employee_id || 'JH-DWO-2018-042'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-300 px-3.5 py-1.5 rounded-lg text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Active Verification Jurisdiction</span>
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

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-5">
            <Building2 className="w-5 h-5 text-[#0B4D9C]" />
            <h2 className="text-base font-bold text-slate-800">Officer Designation & Official Jurisdictions</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Designation</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="e.g. District Welfare Officer (DWO)"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Employee / Officer ID</label>
              <input
                type="text"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned District</label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Office Address</label>
              <textarea
                name="office_address"
                rows={2}
                value={formData.office_address}
                onChange={handleChange}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4D9C]"
              />
            </div>
          </div>
        </div>

        {/* Assigned Schemes Selection */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-5">
            <Award className="w-5 h-5 text-[#0B4D9C]" />
            <h2 className="text-base font-bold text-slate-800">Assigned ST Scholarship & Fellowship Schemes</h2>
          </div>

          <div className="space-y-3">
            {allSchemes.map((scheme) => {
              const isChecked = formData.assigned_schemes.includes(scheme.id);
              return (
                <div
                  key={scheme.id}
                  onClick={() => toggleScheme(scheme.id)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                    isChecked
                      ? 'border-[#0B4D9C] bg-blue-50/60'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="h-4 w-4 text-[#0B4D9C] focus:ring-[#0B4D9C] border-slate-300 rounded"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">{scheme.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">Scheme Code: {scheme.id}</div>
                    </div>
                  </div>
                  {isChecked && (
                    <span className="text-[10px] font-bold bg-[#0B4D9C] text-white px-2 py-0.5 rounded">
                      Authorized
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#0B4D9C] hover:bg-[#083D7C] text-white font-bold px-8 py-3 rounded-lg shadow-sm hover:shadow transition flex items-center gap-2 text-sm"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Updating...' : 'Save Officer Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default OfficerProfilePage;
