import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Microscope, 
  Clock, 
  MapPin, 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  FileText, 
  Droplet, 
  Utensils, 
  IndianRupee, 
  Info,
  Calendar,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { LaboratoryTest, LaboratorySettings } from '../../types';
import { dataService } from '../../services/dataService';

interface LaboratoryPageProps {
  onOpenBooking?: () => void;
  onNavigateHome?: () => void;
}

export const LaboratoryPage: React.FC<LaboratoryPageProps> = ({
  onOpenBooking,
  onNavigateHome,
}) => {
  const [tests, setTests] = useState<LaboratoryTest[]>([]);
  const [settings, setSettings] = useState<LaboratorySettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyAvailableFilter, setOnlyAvailableFilter] = useState<boolean>(false);

  // Modal
  const [selectedTest, setSelectedTest] = useState<LaboratoryTest | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [allTests, labSettings] = await Promise.all([
        dataService.getLaboratoryTests({ includeDrafts: false }),
        dataService.getLaboratorySettings(),
      ]);
      setTests(allTests);
      setSettings(labSettings);
    } catch (err: any) {
      console.error('Failed to load laboratory data:', err);
      setError('Unable to load diagnostic laboratory catalog. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setTests(e.detail.filter((t: LaboratoryTest) => t.is_published));
      } else {
        loadData();
      }
    };

    window.addEventListener('laboratory-tests-updated', handleUpdated);
    return () => window.removeEventListener('laboratory-tests-updated', handleUpdated);
  }, []);

  // Unique categories from published tests
  const categories = useMemo(() => {
    const set = new Set<string>();
    tests.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort();
  }, [tests]);

  // Filtered Tests
  const filteredTests = useMemo(() => {
    return tests.filter(test => {
      // Category filter
      if (selectedCategory !== 'all' && test.category !== selectedCategory) {
        return false;
      }
      // Availability filter
      if (onlyAvailableFilter && !test.is_available) {
        return false;
      }
      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = test.name.toLowerCase().includes(q);
        const matchDesc = test.description.toLowerCase().includes(q);
        const matchCat = test.category.toLowerCase().includes(q);
        const matchSample = test.sample_type?.toLowerCase().includes(q);
        return matchName || matchDesc || matchCat || matchSample;
      }
      return true;
    });
  }, [tests, selectedCategory, onlyAvailableFilter, searchQuery]);

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      
      {/* 1. Page Header & Diagnostic Information Banner */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white py-14 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-teal-300 font-semibold mb-4">
            {onNavigateHome ? (
              <button 
                type="button"
                onClick={onNavigateHome}
                className="hover:text-white transition-colors"
              >
                Home
              </button>
            ) : (
              <span>Home</span>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-white">Diagnostic Laboratory</span>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold">
                <Microscope className="w-3.5 h-3.5" />
                <span>Hospital Diagnostic Services</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Diagnostic Laboratory & Blood Tests
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Explore our hospital diagnostic catalog with transparent sample requirements, preparation instructions, and verified turnaround times.
              </p>
            </div>

            {/* Quick Contact & Walk-In Information Pill */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 max-w-sm w-full space-y-3 shrink-0">
              <div className="flex items-center gap-2 font-bold text-xs text-teal-300 uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Operating Timings</span>
              </div>
              <p className="text-xs text-white leading-relaxed">
                {settings?.operating_hours || 'Mon - Sat 07:30 AM - 07:00 PM | 24/7 Emergency Lab'}
              </p>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-300">Desk Support:</span>
                <a 
                  href={`tel:${settings?.contact_phone || '+91 22 2845 6795'}`}
                  className="font-bold text-teal-300 hover:text-white transition-colors"
                >
                  {settings?.contact_phone || '+91 22 2845 6795'}
                </a>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. Mandatory Medical Disclaimer Notice */}
      <section className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-3 text-xs text-amber-950">
        <div className="max-w-7xl mx-auto flex items-start sm:items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-relaxed">
            <strong>Important Clinical Notice:</strong> Preparation requirements, fasting instructions, and test availability must be confirmed with the laboratory desk or your treating clinician before sample collection. Laboratory tests do not substitute clinical consultation and cannot diagnose conditions in isolation.
          </p>
        </div>
      </section>

      {/* 3. Search & Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tests by name, category, or sample type (e.g., CBC, Glucose, LFT, Lipid)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-hidden bg-slate-50/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center flex-wrap gap-2.5 shrink-0">
            <label className="inline-flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyAvailableFilter}
                onChange={(e) => setOnlyAvailableFilter(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <span>Available Only</span>
            </label>

            <span className="text-xs font-bold text-slate-400 px-2 hidden sm:inline">|</span>
            <span className="text-xs font-bold text-slate-700">
              {filteredTests.length} {filteredTests.length === 1 ? 'Test' : 'Tests'} Found
            </span>
          </div>

        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            All Categories ({tests.length})
          </button>

          {categories.map((cat) => {
            const count = tests.filter(t => t.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Test Catalog Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500">Loading laboratory diagnostic catalog...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 max-w-lg mx-auto space-y-4 my-8">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Failed to Load Catalog</h3>
            <p className="text-xs text-slate-500">{error}</p>
            <button
              type="button"
              onClick={loadData}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto my-12 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Tests Found</h3>
            <p className="text-xs text-slate-500">
              No diagnostic tests matched your search criteria. Try clearing filters or searching for common terms like CBC, Sugar, or LFT.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setOnlyAvailableFilter(false);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test) => {
              return (
                <div
                  key={test.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card hover:shadow-elevated hover:border-teal-400 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Category & Availability Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-100 line-clamp-1">
                        {test.category}
                      </span>
                      <span 
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          test.is_available
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {test.is_available ? 'Available' : 'Temporarily Unavailable'}
                      </span>
                    </div>

                    {/* Test Name */}
                    <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-teal-700 transition-colors">
                      {test.name}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {test.description}
                    </p>

                    {/* Specification Badges */}
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                      {/* Sample Type */}
                      {test.sample_type && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Droplet className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="text-[11px]">
                            Sample: <strong className="text-slate-800">{test.sample_type}</strong>
                          </span>
                        </div>
                      )}

                      {/* Fasting Requirement */}
                      <div className="flex items-center gap-2 text-slate-600">
                        <Utensils className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-[11px]">
                          Fasting: {test.fasting_required ? (
                            <strong className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">Fasting Required</strong>
                          ) : (
                            <span className="text-slate-500">No Fasting Required</span>
                          )}
                        </span>
                      </div>

                      {/* Turnaround Time */}
                      {test.turnaround_time && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span className="text-[11px]">
                            Report: <strong className="text-slate-800">{test.turnaround_time}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Price & View Details */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {test.indicative_price != null ? (
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Indicative Fee</span>
                          <span className="text-base font-black text-slate-900">
                            ₹{test.indicative_price.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-500">Contact Lab</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedTest(test)}
                      className="px-3.5 py-2 rounded-xl font-bold text-xs bg-slate-900 hover:bg-teal-700 text-white transition-colors"
                    >
                      View Details
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 5. Detailed Test Modal */}
      {selectedTest && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedTest(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-100">
                  {selectedTest.category}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    selectedTest.is_available
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {selectedTest.is_available ? 'Available' : 'Temporarily Unavailable'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {selectedTest.name}
              </h2>
            </div>

            {/* Test Details */}
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Description & Clinical Purpose
                </span>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  {selectedTest.description}
                </p>
              </div>

              {/* Specifications Matrix */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Sample Type</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {selectedTest.sample_type || 'Verified by Technician'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Fasting Protocol</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {selectedTest.fasting_required ? 'Mandatory Fasting' : 'No Fasting Required'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Expected Turnaround</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {selectedTest.turnaround_time || 'Confirmed at Counter'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Indicative Hospital Fee</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {selectedTest.indicative_price != null ? `₹${selectedTest.indicative_price.toLocaleString('en-IN')}` : 'Check at Reception'}
                  </p>
                </div>
              </div>

              {/* Preparation Instructions */}
              {selectedTest.preparation_instructions && (
                <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100 space-y-1">
                  <span className="font-bold text-teal-900 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-teal-600" />
                    Patient Preparation Instructions
                  </span>
                  <p className="text-teal-800 leading-relaxed">
                    {selectedTest.preparation_instructions}
                  </p>
                </div>
              )}

              {/* Crucial Disclaimer */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Clinical Notice:</strong> Diagnostic tests must be evaluated by a certified physician in context with your medical symptoms. Please confirm all preparation and fasting instructions with Counter 4 before sample extraction.
                </p>
              </div>
            </div>

            {/* Action Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <a
                href={`tel:${settings?.contact_phone || '+91 22 2845 6795'}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Laboratory: {settings?.contact_phone || '+91 22 2845 6795'}</span>
              </a>

              <button
                type="button"
                onClick={() => setSelectedTest(null)}
                className="px-4 py-2 rounded-xl font-bold text-xs bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
