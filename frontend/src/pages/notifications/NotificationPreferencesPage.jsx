import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sliders, 
  MessageSquare, 
  Smartphone, 
  Mail, 
  Bell, 
  Globe, 
  Moon, 
  Save, 
  Check, 
  AlertCircle,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import notificationService from '../../services/notificationService';

const NotificationPreferencesPage = () => {
  const [preferences, setPreferences] = useState({
    sms_enabled: true,
    whatsapp_enabled: true,
    email_enabled: true,
    in_app_enabled: true,
    preferred_language: 'EN',
    dnd_start_hour: 21,
    dnd_end_hour: 7
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        setLoading(true);
        const data = await notificationService.getPreferences();
        setPreferences({
          sms_enabled: data.sms_enabled,
          whatsapp_enabled: data.whatsapp_enabled,
          email_enabled: data.email_enabled,
          in_app_enabled: data.in_app_enabled,
          preferred_language: data.preferred_language || 'EN',
          dnd_start_hour: data.dnd_start_hour ?? 21,
          dnd_end_hour: data.dnd_end_hour ?? 7
        });
      } catch (err) {
        console.error('Failed to load preferences:', err);
        setError('Could not load preferences. Using default settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrefs();
  }, []);

  const handleToggle = (field) => {
    setPreferences(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await notificationService.updatePreferences(preferences);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setError('Unable to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const languages = [
    { code: 'EN', label: 'English', sub: 'Standard Portal Language' },
    { code: 'HI', label: 'हिन्दी (Hindi)', sub: 'राजभाषा' },
    { code: 'SANTALI', label: 'ᱥᱟᱱᱛᱟᱲᱤ (Santali / Ol Chiki)', sub: 'Jharkhand Scheduled Tribal Language' },
    { code: 'HO', label: 'Ho (वारंग क्षिति)', sub: 'Kolhan Tribal Regional Language' },
    { code: 'MUNDARI', label: 'Mundari (ᱢᱩᱱᱰᱟᱨᱤ)', sub: 'Chotanagpur Tribal Language' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/notifications"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#005696] transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Notification Center
          </Link>
        </div>

        {/* Header Banner */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-[#005696] rounded-xl border border-blue-100">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Communication & Language Preferences
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Customize delivery channels, TRAI DND quiet hours, and indigenous tribal language rendering.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            Your communication preferences and DND hours have been saved successfully.
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Multi-Channel Toggles */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
              <Smartphone className="w-4 h-4 text-[#005696]" />
              Multi-Channel Delivery Toggles (F-91)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* WhatsApp Toggle */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Interactive WhatsApp</h3>
                    <p className="text-[11px] text-slate-500">Official verified green badge bot updates</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.whatsapp_enabled}
                    onChange={() => handleToggle('whatsapp_enabled')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* SMS Toggle */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 text-[#005696] rounded-lg">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Statutory CDAC / NIC SMS</h3>
                    <p className="text-[11px] text-slate-500">TRAI DLT registered transactional alerts</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.sms_enabled}
                    onChange={() => handleToggle('sms_enabled')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005696]"></div>
                </label>
              </div>

              {/* Email Toggle */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 text-purple-700 rounded-lg">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Transactional Email</h3>
                    <p className="text-[11px] text-slate-500">Official sanction orders & UTR receipts</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.email_enabled}
                    onChange={() => handleToggle('email_enabled')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* In-App Toggle */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 text-amber-700 rounded-lg">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">In-App Notification Bell</h3>
                    <p className="text-[11px] text-slate-500">Real-time alerts inside ST Seva Portal</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.in_app_enabled}
                    onChange={() => handleToggle('in_app_enabled')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Preferred Language */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
              <Globe className="w-4 h-4 text-[#005696]" />
              Preferred Notification Language (F-86)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {languages.map((lang) => (
                <label
                  key={lang.code}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-start justify-between ${
                    preferences.preferred_language === lang.code
                      ? 'border-[#005696] bg-blue-50/60 ring-1 ring-[#005696]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900">{lang.label}</div>
                    <div className="text-[11px] text-slate-500">{lang.sub}</div>
                  </div>
                  <input
                    type="radio"
                    name="preferred_language"
                    value={lang.code}
                    checked={preferences.preferred_language === lang.code}
                    onChange={() => setPreferences(prev => ({ ...prev, preferred_language: lang.code }))}
                    className="mt-1 text-[#005696] focus:ring-[#005696]"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Section 3: TRAI DND Quiet Hours */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-600" />
                TRAI DND Quiet Hours Window
              </h2>
              <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                TRAI Compliant
              </span>
            </div>

            <p className="text-xs text-slate-600">
              During quiet hours, routine alerts are held in queue. Critical defect cutoff deadlines and payment releases bypass quiet hours.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Start Hour (Evening DND)
                </label>
                <select
                  value={preferences.dnd_start_hour}
                  onChange={(e) => setPreferences(prev => ({ ...prev, dnd_start_hour: parseInt(e.target.value) }))}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#005696] bg-white font-semibold"
                >
                  <option value={20}>8:00 PM (20:00)</option>
                  <option value={21}>9:00 PM (21:00) - Statutory Default</option>
                  <option value={22}>10:00 PM (22:00)</option>
                  <option value={23}>11:00 PM (23:00)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  End Hour (Morning Resume)
                </label>
                <select
                  value={preferences.dnd_end_hour}
                  onChange={(e) => setPreferences(prev => ({ ...prev, dnd_end_hour: parseInt(e.target.value) }))}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#005696] bg-white font-semibold"
                >
                  <option value={6}>6:00 AM (06:00)</option>
                  <option value={7}>7:00 AM (07:00) - Statutory Default</option>
                  <option value={8}>8:00 AM (08:00)</option>
                  <option value={9}>9:00 AM (09:00)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-2">
            <Link
              to="/notifications"
              className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || loading}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#005696] hover:bg-[#00477D] disabled:opacity-50 rounded-lg shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Preferences...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotificationPreferencesPage;
