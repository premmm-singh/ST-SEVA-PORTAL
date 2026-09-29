import React, { useState } from 'react';
import { AlertCircle, Calendar, X, Loader2, Send } from 'lucide-react';

const DEFECT_CATEGORIES = [
  { value: 'INCORRECT_FEE_RECEIPT', label: 'Incorrect or Blurry Fee Receipt' },
  { value: 'UNREADABLE_MARK_SHEET', label: 'Unreadable / Missing Marksheet' },
  { value: 'ATTENDANCE_MISMATCH', label: 'Attendance Discrepancy / Below 75%' },
  { value: 'HOSTEL_CERTIFICATE_MISSING', label: 'Hosteller Certificate Missing or Unverified' },
  { value: 'COURSE_MISMATCH', label: 'Course / Year of Study Mismatch' },
  { value: 'INCOMPLETE_BONAFIDE', label: 'Incomplete Bonafide / Roll No Record' },
  { value: 'OTHER_DISCREPANCY', label: 'Other Documentary Defect' }
];

export default function DefectReturnModal({ isOpen, onClose, applicationNumber, onConfirm, isProcessing }) {
  const [defectCategory, setDefectCategory] = useState('INCORRECT_FEE_RECEIPT');
  const [defectDescription, setDefectDescription] = useState('');
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!defectDescription.trim() || defectDescription.trim().length < 5) {
      setError('Please provide specific instructions for the student.');
      return;
    }
    setError('');
    onConfirm({
      defect_category: defectCategory,
      defect_description: defectDescription.trim(),
      correction_deadline_days: parseInt(deadlineDays, 10)
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop-animate">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden modal-content-animate">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <AlertCircle className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Return with Defect Notice</h3>
              <p className="text-amber-100 text-xs">Application #{applicationNumber}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg text-amber-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Defect Category <span className="text-red-500">*</span>
            </label>
            <select
              value={defectCategory}
              onChange={(e) => setDefectCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
            >
              {DEFECT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Correction Instructions for Scholar <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={defectDescription}
              onChange={(e) => setDefectDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
              placeholder="Clearly state which document or field is defective and what the student must re-upload or correct..."
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              This message will appear on the student's dashboard and trigger an SMS alert.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Correction Deadline (Days Allowed)
            </label>
            <div className="flex items-center space-x-3">
              {[5, 7, 10, 14].map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDeadlineDays(d)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    deadlineDays === d
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-lg shadow-sm flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Issuing Notice...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Return to Student</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
