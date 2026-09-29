import React, { useState } from 'react';
import { MapPin, X, Loader2, CheckCircle2, Navigation, AlertCircle } from 'lucide-react';

export default function PhysicalInspectionModal({ isOpen, onClose, defaultInstitution, onConfirm, isProcessing }) {
  const [institutionName, setInstitutionName] = useState(defaultInstitution || 'Birsa Institute of Technology (BIT) Sindri');
  const [latitude, setLatitude] = useState(23.6521);
  const [longitude, setLongitude] = useState(86.4718);
  const [locationAddress, setLocationAddress] = useState('Campus Spot Verification, Dhanbad - 828123');
  const [studentPresent, setStudentPresent] = useState(true);
  const [hostelRoomVerified, setHostelRoomVerified] = useState(true);
  const [summary, setSummary] = useState('On-site inspection completed. Student physically verified in department lecture hall and verified room allotment in ST hostel.');
  const [photoUrl, setPhotoUrl] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!summary.trim() || summary.trim().length < 5) {
      setError('Please provide detailed field inspection findings.');
      return;
    }
    setError('');
    onConfirm({
      institution_name: institutionName,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      location_address: locationAddress,
      student_present: studentPresent,
      hostel_room_verified: hostelRoomVerified,
      inspection_summary: summary.trim(),
      photo_url: photoUrl.trim() || undefined
    });
  };

  const handleCaptureGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
        },
        () => {
          // Fallback to default Jharkhand ITDA coordinates
          setLatitude(23.3441);
          setLongitude(85.3096);
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop-animate">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden modal-content-animate">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 to-indigo-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <MapPin className="w-6 h-6 text-purple-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Field Spot Inspection Report</h3>
              <p className="text-purple-200 text-xs">Feature 56: Physical verification of tribal schools & hostels</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-colors"
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
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Inspected Educational Institution
            </label>
            <input
              type="text"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  GPS Latitude
                </label>
                <button
                  type="button"
                  onClick={handleCaptureGps}
                  className="text-[10px] text-purple-700 font-bold hover:underline flex items-center gap-0.5"
                >
                  <Navigation className="w-2.5 h-2.5" />
                  Capture
                </button>
              </div>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                GPS Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Student Present in Classroom?</span>
              <input
                type="checkbox"
                checked={studentPresent}
                onChange={(e) => setStudentPresent(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-800">Hostel Room & Bed Verified?</span>
              <input
                type="checkbox"
                checked={hostelRoomVerified}
                onChange={(e) => setHostelRoomVerified(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Field Welfare Inspector Summary & Findings <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg resize-none"
              placeholder="Record spot-check observation regarding candidate attendance, faculty verification, and hostel records..."
              required
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2 text-xs font-bold text-white bg-purple-800 hover:bg-purple-900 rounded-lg shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting Report...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Submit Inspection Report</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
