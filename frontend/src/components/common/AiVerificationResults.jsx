import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, AlertTriangle, BookOpen, Sparkles, HelpCircle } from 'lucide-react';
import CountUpNumber from './CountUpNumber';

/**
 * AI Verification Results Component (Specification #7)
 * - Integrity score: number counts up from 0 to final value (800ms, ease-out)
 * - Score circle: SVG stroke animates from 0 to score percentage (1000ms ease-out)
 * - Verdict badge: scale + fade in (500ms, delay 200ms after score completes)
 * - SHAP bars: each bar grows from 0 to final width, staggered 80ms apart
 * - Source citation chips: fade-in staggered (50ms apart)
 */
export default function AiVerificationResults({
  score = 96,
  verdict = 'VERIFIED_GENUINE',
  verdictLabel = 'Statutory Integrity Verified',
  shapFeatures = [
    { feature: 'DigiLocker ST Caste Certificate Authenticity', impact: 0.38, positive: true },
    { feature: 'Annual Family Income Below ₹2.5 Lakh Threshold', impact: 0.26, positive: true },
    { feature: 'Institutional Biometric Attendance (82.4% > 75%)', impact: 0.20, positive: true },
    { feature: 'Aadhaar NPCI Active Bank Seeding Confirmation', impact: 0.12, positive: true },
    { feature: 'Zero Prior Disbursal Duplicate Collision in Cohort', impact: 0.08, positive: true },
  ],
  sources = [
    'MoTA Pre/Post-Matric Guidelines Sec 4.2',
    'State Revenue Dept Gazette Notification 2024',
    'DigiLocker SHA-256 Issuer Registry',
    'PFMS Bank Seeding Verification API'
  ],
  className = ''
}) {
  const [showVerdict, setShowVerdict] = useState(false);
  const radius = 42;
  const circumference = 2 * Math.PI * radius; // ~263.89
  const strokeDashoffset = circumference - (score / 100) * circumference;

  useEffect(() => {
    // Verdict badge: delay 200ms after score completes (800ms + 200ms = 1000ms)
    const timer = setTimeout(() => {
      setShowVerdict(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#005696] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#005696]" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
              AI Verification & Explainable ML Assessment
            </h3>
            <p className="text-[11px] text-slate-500">
              Grounded in official rules • Supervised SHAP feature attribution
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold bg-blue-50 text-[#005696] px-2 py-0.5 rounded border border-blue-200">
          MoTA AI Engine v2.4
        </span>
      </div>

      {/* Main Score Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Animated Circular Meter (1000ms ease-out) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50/70 rounded-2xl border border-slate-200/60">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#E2E8F0"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Animated Progress Circle (1000ms easeOut) */}
              <motion.circle
                cx="50"
                cy="50"
                r={radius}
                stroke={score >= 85 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444'}
                strokeWidth="8"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.0, ease: 'easeOut' }}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Centered Number Counter (800ms) */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline">
                <CountUpNumber value={score} duration={800} />
                <span className="text-base font-semibold text-slate-400 ml-0.5">%</span>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Integrity Index
              </span>
            </div>
          </div>

          {/* Verdict Badge: Scale + Fade in (500ms, delay 200ms after score) */}
          <div className="mt-3 min-h-[30px] flex items-center justify-center">
            {showVerdict ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs ${
                  score >= 85
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : score >= 60
                    ? 'bg-amber-50 text-amber-800 border border-amber-300'
                    : 'bg-red-50 text-red-800 border border-red-300'
                }`}
              >
                {score >= 85 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>{verdictLabel}</span>
              </motion.div>
            ) : (
              <div className="h-6 w-32 skeleton-shimmer rounded-full" />
            )}
          </div>
        </div>

        {/* SHAP Feature Importance Bars (Staggered 80ms) */}
        <div className="md:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Key Contributing Decision Factors (SHAP)
            </span>
            <span className="text-[10px] text-slate-400">Relative Weight</span>
          </div>

          <div className="space-y-2.5">
            {shapFeatures.map((item, idx) => {
              const widthPercent = Math.min(Math.round(item.impact * 100 * 2.2), 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium truncate pr-2">
                      {item.feature}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-600">
                      +{Math.round(item.impact * 100)}%
                    </span>
                  </div>

                  {/* Staggered Animated Bar */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        item.positive ? 'bg-[#005696]' : 'bg-rose-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPercent}%` }}
                      transition={{
                        duration: 0.6,
                        delay: idx * 0.08,
                        ease: 'easeOut'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Source Citation Chips (Staggered 50ms apart) */}
      <div className="pt-2 border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Official Grounded Citations & Legal Stubs
        </span>
        <div className="flex flex-wrap gap-2">
          {sources.map((src, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.25,
                delay: 0.4 + i * 0.05,
                ease: 'easeOut'
              }}
              className="inline-flex items-center space-x-1 text-[11px] font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-default"
            >
              <BookOpen className="w-3 h-3 text-[#005696]" />
              <span>{src}</span>
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}
