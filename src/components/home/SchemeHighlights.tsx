import React from 'react';
import { 
  HeartHandshake, 
  CheckCircle2, 
  ShieldCheck, 
  Clock,
  AlertCircle,
  ExternalLink, 
  ArrowRight,
  Info
} from 'lucide-react';
import { HealthScheme } from '../../types';

interface SchemeHighlightsProps {
  schemes: HealthScheme[];
  onExploreSchemes: () => void;
  onSelectScheme: (scheme: HealthScheme) => void;
}

export const SchemeHighlights: React.FC<SchemeHighlightsProps> = ({
  schemes,
  onExploreSchemes,
  onSelectScheme,
}) => {
  // Show top 2 primary schemes: PM-JAY and MJPJAY
  const topSchemes = schemes.slice(0, 2);

  return (
    <section className="py-16 bg-gradient-to-b from-white to-teal-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
              <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
              <span>Government of India & Maharashtra Healthcare Initiatives</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Government Health Scheme Assistance
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Shri Gajanan Hospital is a verified empaneled hospital providing 100% cashless treatment for eligible beneficiaries under Ayushman Bharat PM-JAY and MJPJAY.
            </p>
          </div>

          <button
            type="button"
            onClick={onExploreSchemes}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-800 bg-teal-100/70 hover:bg-teal-100 px-4 py-2 rounded-xl transition-all"
          >
            <span>All Schemes Directory</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Highlight Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {topSchemes.map((scheme) => (
            <div
              key={scheme.id}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-teal-200/80 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between relative overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 to-emerald-500" />

              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
                      {scheme.category} Scheme
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                      {scheme.name}
                    </h3>
                  </div>

                  <div className="shrink-0 text-right">
                    {scheme.hospital_acceptance_status === 'Accepted' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60 shadow-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Hospital Empaneled
                      </span>
                    )}
                    {scheme.hospital_acceptance_status === 'Under Verification' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200/60 shadow-xs">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Under Verification
                      </span>
                    )}
                    {scheme.hospital_acceptance_status === 'Not Empanelled' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/60 shadow-xs">
                        <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                        Not Empaneled
                      </span>
                    )}
                  </div>
                </div>

                {/* Coverage Banner */}
                <div className="my-4 p-4 rounded-2xl bg-teal-50/70 border border-teal-100 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                      Financial Protection
                    </p>
                    <p className="text-base font-extrabold text-slate-900">
                      {scheme.coverage_amount}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-lg bg-teal-600 text-white">
                    Cashless
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {scheme.description}
                </p>

                {/* Key Benefits */}
                <div className="space-y-2 mb-6">
                  <p className="text-xs font-bold text-slate-800">Core Benefits Covered:</p>
                  {scheme.benefits.slice(0, 3).map((benefit, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Info className="w-3.5 h-3.5" />
                  <span>Verified: {scheme.last_verified_date}</span>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={scheme.official_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    type="button"
                    onClick={() => onSelectScheme(scheme)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-xs"
                  >
                    View Eligibility & Docs
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Arogya Mitra Helpdesk Callout */}
        <div className="mt-8 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Need Help with Scheme Verification or Arogya Mitra Desk?
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Our hospital Arogya Mitra coordinators are stationed 24/7 at Ground Floor Reception to verify your ration card / Ayushman card.
              </p>
            </div>
          </div>

          <a
            href="tel:+912228456789"
            className="shrink-0 px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Call Scheme Desk: +91 22 2845 6789
          </a>
        </div>
      </div>
    </section>
  );
};
