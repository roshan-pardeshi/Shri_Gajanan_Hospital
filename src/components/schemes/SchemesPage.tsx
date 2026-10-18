import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Search, 
  Filter, 
  ShieldCheck, 
  Clock, 
  ExternalLink, 
  FileCheck2, 
  Phone, 
  X, 
  AlertCircle, 
  CheckCircle2,
  HelpCircle,
  Building
} from 'lucide-react';
import { HealthScheme } from '../../types';

interface SchemesPageProps {
  schemes: HealthScheme[];
  selectedScheme?: HealthScheme | null;
  onClearSelectedScheme?: () => void;
}

export const SchemesPage: React.FC<SchemesPageProps> = ({
  schemes,
  selectedScheme: initialSelectedScheme,
  onClearSelectedScheme,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [acceptanceFilter, setAcceptanceFilter] = useState<string>('all');
  const [activeModalScheme, setActiveModalScheme] = useState<HealthScheme | null>(initialSelectedScheme || null);

  const filteredSchemes = schemes.filter((s) => {
    if (!s.is_published) return false;
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    if (acceptanceFilter !== 'all' && s.hospital_acceptance_status !== acceptanceFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchCode = s.code.toLowerCase().includes(q);
      const matchDesc = s.description.toLowerCase().includes(q);
      return matchName || matchCode || matchDesc;
    }
    return true;
  });

  return (
    <section className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100/90 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200">
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            <span>Official Government Healthcare Schemes & Cashless Assistance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Government Health Schemes Directory
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Verified guidance for patients seeking cashless coverage under Central and Maharashtra state healthcare initiatives. Check hospital empanelment status, document requirements, and official application portals.
          </p>
        </div>

        {/* Official Transparency Disclaimer Alert */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 mb-8 flex items-start gap-3.5 text-xs text-amber-900 leading-relaxed shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-950">
              Official Disclaimer on Eligibility & Cashless Benefits:
            </p>
            <p>
              Final scheme eligibility and cashless procedure pre-authorizations are governed strictly by the guidelines of the National Health Authority (NHA) and State Health Assurance Society (SHAS), Maharashtra. Shri Gajanan Hospital displays verified hospital empanelment status, but does not determine beneficiary inclusion. Patients must undergo biometric / OTP verification at the hospital Arogya Mitra Helpdesk. No advance deposit is required for verified cashless admissions.
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-card mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Search Input */}
            <div className="relative md:col-span-6">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search scheme name, e.g. PM-JAY, MJPJAY, CGHS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            {/* Category Filter */}
            <div className="md:col-span-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                <option value="all">All Scheme Categories</option>
                <option value="Central">Central Govt Schemes</option>
                <option value="Maharashtra State">Maharashtra State Schemes</option>
                <option value="Special Assistance">Special Assistance / Grants</option>
              </select>
            </div>

            {/* Hospital Empanelment Status Filter */}
            <div className="md:col-span-3">
              <select
                value={acceptanceFilter}
                onChange={(e) => setAcceptanceFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                <option value="all">All Empanelment Status</option>
                <option value="Accepted">Accepted at Shri Gajanan Hospital</option>
                <option value="Under Verification">Under Renewal / Verification</option>
              </select>
            </div>
          </div>
        </div>

        {/* Schemes Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredSchemes.map((scheme) => {
            const isAccepted = scheme.hospital_acceptance_status === 'Accepted';

            return (
              <div
                key={scheme.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
                        {scheme.category}
                      </span>
                      <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                        {scheme.name}
                      </h3>
                    </div>

                    <div className="shrink-0 text-right">
                      {isAccepted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Accepted Here
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Under Verification
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Coverage Banner */}
                  <div className="my-4 p-4 rounded-2xl bg-teal-50/70 border border-teal-100 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                        Cashless Coverage
                      </p>
                      <p className="text-base font-extrabold text-slate-900">
                        {scheme.coverage_amount}
                      </p>
                    </div>
                    {scheme.helpline_number && (
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-semibold">Toll-Free</p>
                        <p className="text-xs font-bold text-teal-700">{scheme.helpline_number}</p>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {scheme.description}
                  </p>

                  {/* Summary of Required Documents */}
                  <div className="mb-4 space-y-1.5">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5 text-teal-600" />
                      Required Documents (Mandatory for Admission):
                    </p>
                    <ul className="text-xs text-slate-600 space-y-1 pl-5 list-disc">
                      {scheme.required_documents.slice(0, 3).map((doc, dIdx) => (
                        <li key={dIdx}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer of Card */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-400">
                    Source: <span className="font-semibold text-slate-600">{scheme.official_source}</span>
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
                      onClick={() => setActiveModalScheme(scheme)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-xs"
                    >
                      View Eligibility & Guide
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dedicated Scheme Details Modal */}
        {activeModalScheme && (
          <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveModalScheme(null);
                  if (onClearSelectedScheme) onClearSelectedScheme();
                }}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <span className="text-xs font-bold text-teal-600 uppercase tracking-wide bg-teal-50 px-2.5 py-1 rounded">
                  {activeModalScheme.category} Scheme
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-2">
                  {activeModalScheme.name}
                </h3>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Hospital Status: {activeModalScheme.hospital_acceptance_status}
                  </span>
                  <span className="text-xs text-slate-400">
                    Last Verified: {activeModalScheme.last_verified_date}
                  </span>
                </div>
              </div>

              {/* Financial Cover */}
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100 mb-6">
                <p className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                  Coverage Limit
                </p>
                <p className="text-lg font-black text-slate-900 mt-0.5">
                  {activeModalScheme.coverage_amount}
                </p>
              </div>

              {/* Sections */}
              <div className="space-y-6 text-xs text-slate-600">
                {/* 1. Eligibility */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    Eligibility Criteria (Official):
                  </h4>
                  <ul className="space-y-1.5 pl-6 list-disc">
                    {activeModalScheme.eligibility_criteria.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>

                {/* 2. Key Benefits */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Key Benefits Covered:
                  </h4>
                  <ul className="space-y-1.5 pl-6 list-disc">
                    {activeModalScheme.benefits.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>

                {/* 3. Required Documents */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-sky-600" />
                    Required Documents Checklist:
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    {activeModalScheme.required_documents.map((doc, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span className="font-medium text-slate-800">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. How to Apply at Shri Gajanan Hospital */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Building className="w-4 h-4 text-amber-600" />
                    How to Avail at Shri Gajanan Hospital:
                  </h4>
                  <p className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-950 leading-relaxed">
                    {activeModalScheme.how_to_apply}
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <a
                  href={activeModalScheme.official_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900"
                >
                  <span>Open Official {activeModalScheme.code} Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setActiveModalScheme(null);
                    if (onClearSelectedScheme) onClearSelectedScheme();
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-white hover:bg-slate-800"
                >
                  Close Guidelines
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
