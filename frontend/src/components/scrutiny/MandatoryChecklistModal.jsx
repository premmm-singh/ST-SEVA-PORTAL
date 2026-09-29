import React, { useState } from 'react';
import { ShieldCheck, CheckSquare, Square, AlertTriangle, X, Loader2, Award } from 'lucide-react';

export default function MandatoryChecklistModal({
  isOpen,
  onClose,
  scrutinyLevel, // L1_SCRUTINY, L2_VERIFICATION, L3_SANCTION
  decision,      // RECOMMENDED, APPROVED, SANCTIONED
  applicationNumber,
  onConfirm,
  isProcessing
}) {
  const [checklist, setChecklist] = useState({
    caste_verified: true,
    income_verified: true,
    domicile_verified: true,
    bonafide_verified: true,
    dbt_eligible: true,
    duplicate_check_passed: true
  });
  const [remarks, setRemarks] = useState(
    decision === 'SANCTIONED'
      ? 'Final scholarship entitlement sanctioned by State Directorate. Dispatched to PFMS DBT.'
      : decision === 'APPROVED'
      ? 'DWO District Welfare Office verified all credentials against state revenue registries. Approved for sanction.'
      : 'L1 Scrutiny Assistant verified documents. Recommended for DWO approval.'
  );

  if (!isOpen) return null;

  const toggleCheck = (field) => {
    setChecklist((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const allChecked = Object.values(checklist).every(Boolean);

  const checklistItems = [
    { key: 'caste_verified', label: 'ST Caste Certificate verified via Jharsewa / e-District Revenue Registry.' },
    { key: 'income_verified', label: 'Annual Family Income verified within scheme cap with valid 1-year certificate.' },
    { key: 'domicile_verified', label: 'Domicile / Residential status confirmed within Scheduled Tribal Area.' },
    { key: 'bonafide_verified', label: 'Active Bonafide & mandatory 75% attendance confirmed by Head of Institution.' },
    { key: 'dbt_eligible', label: 'Bank Account Aadhaar-seeded and verified for Direct Benefit Transfer (DBT).' },
    { key: 'duplicate_check_passed', label: 'Multi-vector duplicate scan completed with zero uncleared collisions.' }
  ];

  const levelTitles = {
    L1_SCRUTINY: 'Level-1 Scrutiny Assistant Recommendation',
    L2_VERIFICATION: 'Level-2 District Welfare Officer (DWO) Approval',
    L3_SANCTION: 'Level-3 State Directorate Sanction Order'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop-animate">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden modal-content-animate">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <ShieldCheck className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {levelTitles[scrutinyLevel] || 'Statutory Scrutiny Sign-Off'}
              </h3>
              <p className="text-blue-200 text-xs">Application #{applicationNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start space-x-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <p>
              <span className="font-bold">Feature 58 Statutory Requirement:</span> You must explicitly verify and affirm all 6 statutory compliance prerequisites before applying your official digital seal.
            </p>
          </div>

          {/* Checklist items */}
          <div className="space-y-2.5">
            {checklistItems.map((item) => {
              const isChecked = checklist[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() => toggleCheck(item.key)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                    isChecked
                      ? 'bg-blue-50/60 border-blue-300 text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <button type="button" className="mt-0.5 flex-shrink-0">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-blue-900" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  <span className="text-xs font-semibold select-none leading-relaxed">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Official Officer Remarks & Justification
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg resize-none"
              placeholder="Record official verification notes..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500">
            {Object.values(checklist).filter(Boolean).length} of 6 Items Verified
          </span>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!allChecked || isProcessing}
              onClick={() => onConfirm(checklist, remarks)}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm flex items-center space-x-1.5 transition-all disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing Digitally...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
                  <span>Apply Digital Seal ({decision})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
