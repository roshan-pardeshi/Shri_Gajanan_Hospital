import React, { useState } from 'react';
import { 
  Microscope, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  X, 
  Building2, 
  Save, 
  Droplet, 
  Utensils, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { LaboratoryTest, LaboratorySettings } from '../../types';
import { dataService } from '../../services/dataService';

interface AdminLaboratoryTabProps {
  labTests: LaboratoryTest[];
  labSettings: LaboratorySettings | null;
  onRefresh: () => Promise<void>;
}

const DEFAULT_CATEGORIES = [
  'Complete Blood Count (CBC)',
  'Hemoglobin and blood cell tests',
  'Blood glucose tests',
  'Lipid profile',
  'Liver function tests',
  'Kidney function tests',
  'Thyroid function tests',
  'Iron studies',
  'Vitamin tests',
  'Other laboratory services'
];

export const AdminLaboratoryTab: React.FC<AdminLaboratoryTabProps> = ({
  labTests,
  labSettings,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'settings'>('catalog');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'available' | 'unavailable'>('all');

  // Modals & Action States
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<LaboratoryTest | null>(null);
  const [deletingTest, setDeletingTest] = useState<LaboratoryTest | null>(null);
  const [previewTest, setPreviewTest] = useState<LaboratoryTest | null>(null);

  // Form State
  const [testForm, setTestForm] = useState<Partial<LaboratoryTest>>({
    name: '',
    slug: '',
    category: DEFAULT_CATEGORIES[0],
    description: '',
    sample_type: 'Blood (Serum)',
    preparation_instructions: '',
    fasting_required: false,
    indicative_price: 500,
    turnaround_time: 'Within 4-6 Hours',
    is_available: true,
    is_published: true,
    display_order: 10,
  });

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<Partial<LaboratorySettings>>({
    lab_name: labSettings?.lab_name || 'Shri Gajanan Hospital Diagnostic Laboratory',
    location: labSettings?.location || 'Ground Floor, Diagnostics & Imaging Wing B (Near Main OPD)',
    operating_hours: labSettings?.operating_hours || 'Routine Sample Collection: Mon - Sat 07:30 AM - 07:00 PM | 24/7 Emergency Diagnostics',
    contact_phone: labSettings?.contact_phone || '+91 22 2845 6795',
    general_description: labSettings?.general_description || 'Fully automated, quality-controlled clinical pathology, hematology, biochemistry, and microbiology laboratory delivering accurate and timely diagnostic reports.',
    accepts_walkins: labSettings?.accepts_walkins ?? true,
    appointment_required: labSettings?.appointment_required ?? false,
  });

  // Feedback states
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setFeedbackSuccess(msg);
    setFeedbackError(null);
    setTimeout(() => setFeedbackSuccess(null), 4000);
  };

  const showError = (msg: string) => {
    setFeedbackError(msg);
    setFeedbackSuccess(null);
  };

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingTest(null);
    setTestForm({
      name: '',
      slug: '',
      category: DEFAULT_CATEGORIES[0],
      description: '',
      sample_type: 'Blood (Serum)',
      preparation_instructions: '',
      fasting_required: false,
      indicative_price: 350,
      turnaround_time: 'Same Day',
      is_available: true,
      is_published: true,
      display_order: (labTests.length + 1),
    });
    setFeedbackError(null);
    setIsAddEditModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (test: LaboratoryTest) => {
    setEditingTest(test);
    setTestForm({ ...test });
    setFeedbackError(null);
    setIsAddEditModalOpen(true);
  };

  // Submit Add or Edit
  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testForm.name?.trim()) {
      showError('Test name is required.');
      return;
    }
    if (!testForm.category) {
      showError('Please select or specify a category.');
      return;
    }
    if (!testForm.description?.trim()) {
      showError('A brief description is required.');
      return;
    }

    setSubmitting(true);
    setFeedbackError(null);

    try {
      const generatedSlug = testForm.slug?.trim() || testForm.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const payload = {
        name: testForm.name.trim(),
        slug: generatedSlug,
        category: testForm.category,
        description: testForm.description.trim(),
        sample_type: testForm.sample_type?.trim() || null,
        preparation_instructions: testForm.preparation_instructions?.trim() || null,
        fasting_required: Boolean(testForm.fasting_required),
        indicative_price: testForm.indicative_price != null ? Number(testForm.indicative_price) : null,
        turnaround_time: testForm.turnaround_time?.trim() || null,
        is_available: testForm.is_available ?? true,
        is_published: testForm.is_published ?? true,
        display_order: Number(testForm.display_order) || 0,
      };

      if (editingTest) {
        await dataService.updateLaboratoryTest(editingTest.id, payload);
        showSuccess(`Laboratory test "${payload.name}" updated successfully.`);
      } else {
        await dataService.addLaboratoryTest(payload);
        showSuccess(`Laboratory test "${payload.name}" added to catalog successfully.`);
      }

      setIsAddEditModalOpen(false);
      setEditingTest(null);
      await onRefresh();
    } catch (err: any) {
      console.error('Failed to save laboratory test:', err);
      showError(err.message || 'Database operation failed. Please check table status and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Published / Draft
  const handleTogglePublish = async (test: LaboratoryTest) => {
    try {
      const nextPublished = !test.is_published;
      await dataService.updateLaboratoryTest(test.id, { is_published: nextPublished });
      showSuccess(`Test "${test.name}" marked as ${nextPublished ? 'Published' : 'Draft (Unpublished)'}.`);
      await onRefresh();
    } catch (err: any) {
      showError(`Failed to change publish status: ${err.message}`);
    }
  };

  // Toggle Availability (Active / Deactivated without deleting historical data)
  const handleToggleAvailable = async (test: LaboratoryTest) => {
    try {
      const nextAvailable = !test.is_available;
      await dataService.updateLaboratoryTest(test.id, { is_available: nextAvailable });
      showSuccess(`Test "${test.name}" marked as ${nextAvailable ? 'Available' : 'Temporarily Unavailable'}.`);
      await onRefresh();
    } catch (err: any) {
      showError(`Failed to update test availability: ${err.message}`);
    }
  };

  // Delete Test
  const handleConfirmDelete = async () => {
    if (!deletingTest) return;
    setSubmitting(true);
    try {
      await dataService.deleteLaboratoryTest(deletingTest.id);
      showSuccess(`Laboratory test "${deletingTest.name}" was permanently removed.`);
      setDeletingTest(null);
      await onRefresh();
    } catch (err: any) {
      showError(`Failed to delete test: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Save Laboratory Information Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await dataService.updateLaboratorySettings(settingsForm);
      showSuccess('Laboratory settings and contact details updated successfully.');
      await onRefresh();
    } catch (err: any) {
      showError(`Failed to update settings: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Tests
  const filteredTests = labTests.filter(t => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (statusFilter === 'published' && !t.is_published) return false;
    if (statusFilter === 'draft' && t.is_published) return false;
    if (statusFilter === 'available' && !t.is_available) return false;
    if (statusFilter === 'unavailable' && t.is_available) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = t.name.toLowerCase().includes(q);
      const matchCat = t.category.toLowerCase().includes(q);
      const matchSample = t.sample_type?.toLowerCase().includes(q);
      return matchName || matchCat || matchSample;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Success Notification Banner */}
      {feedbackSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{feedbackSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {feedbackError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold block">Operation Failed</span>
              <span className="text-[11px] text-rose-800">{feedbackError}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackError(null)}
            className="text-rose-700 hover:text-rose-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Controls & Navigation Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
              <Microscope className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Hospital Laboratory & Diagnostic Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage diagnostic blood tests, fasting rules, sample collection specifications, and laboratory operational details.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Laboratory Test</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'catalog'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Diagnostic Test Catalog ({labTests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'settings'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Laboratory Details & Hours
          </button>
        </div>
      </div>

      {/* =========================================================================
          SUB-TAB 1: TEST CATALOG MANAGEMENT
          ========================================================================= */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-4">
          
          {/* Filters & Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search catalog by test name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                <option value="all">All Categories</option>
                {DEFAULT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published Only</option>
                <option value="draft">Drafts Only</option>
                <option value="available">Available Only</option>
                <option value="unavailable">Unavailable Only</option>
              </select>
            </div>
          </div>

          {/* Test Catalog Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Test Information</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Sample & Fasting</th>
                    <th className="py-3.5 px-4">Price (₹)</th>
                    <th className="py-3.5 px-4">Turnaround</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No laboratory tests match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTests.map((test, idx) => (
                      <tr key={test.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                          {test.display_order || idx + 1}
                        </td>
                        
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="font-bold text-slate-900">{test.name}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{test.description}</p>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            {test.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className="block font-medium text-slate-700 text-[11px]">
                              {test.sample_type || 'Unspecified'}
                            </span>
                            {test.fasting_required ? (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                Fasting Required
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">No Fasting</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900">
                          {test.indicative_price != null ? `₹${test.indicative_price}` : '—'}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                          {test.turnaround_time || '—'}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            <span 
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                test.is_published 
                                  ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {test.is_published ? 'Published' : 'Draft'}
                            </span>
                            <span 
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                test.is_available 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {test.is_available ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Preview Public Card */}
                            <button
                              type="button"
                              onClick={() => setPreviewTest(test)}
                              title="Preview public card"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Toggle Publish / Draft */}
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(test)}
                              title={test.is_published ? 'Unpublish (make Draft)' : 'Publish to Patient Catalog'}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                test.is_published
                                  ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                  : 'border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100'
                              }`}
                            >
                              {test.is_published ? 'Draft' : 'Publish'}
                            </button>

                            {/* Toggle Available / Deactivate */}
                            <button
                              type="button"
                              onClick={() => handleToggleAvailable(test)}
                              title={test.is_available ? 'Deactivate without deleting' : 'Activate test availability'}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                test.is_available
                                  ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {test.is_available ? 'Deactivate' : 'Activate'}
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(test)}
                              title="Edit test specifications"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setDeletingTest(test)}
                              title="Delete test"
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: LABORATORY DETAILS & OPERATING HOURS
          ========================================================================= */}
      {activeSubTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-extrabold text-slate-900">
              Hospital Laboratory Settings
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Configure laboratory name, physical location in hospital, sample collection hours, and contact desk numbers.
          </p>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Laboratory Facility Name *</label>
              <input
                type="text"
                required
                value={settingsForm.lab_name || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, lab_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Location Inside Hospital *</label>
                <input
                  type="text"
                  required
                  value={settingsForm.location || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Laboratory Contact Number *</label>
                <input
                  type="text"
                  required
                  value={settingsForm.contact_phone || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, contact_phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-bold text-teal-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Operating & Sample Collection Hours *</label>
              <input
                type="text"
                required
                value={settingsForm.operating_hours || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, operating_hours: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">General Laboratory Service Description</label>
              <textarea
                rows={3}
                value={settingsForm.general_description || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, general_description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(settingsForm.accepts_walkins)}
                  onChange={(e) => setSettingsForm({ ...settingsForm, accepts_walkins: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300"
                />
                <span className="font-semibold text-slate-800">Accepts Walk-In Patients</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(settingsForm.appointment_required)}
                  onChange={(e) => setSettingsForm({ ...settingsForm, appointment_required: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300"
                />
                <span className="font-semibold text-slate-800">Prior Booking Required</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 active:scale-95 disabled:opacity-60 transition-all"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Laboratory Details</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD / EDIT LABORATORY TEST
          ========================================================================= */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <button
              type="button"
              onClick={() => setIsAddEditModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Microscope className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-extrabold text-slate-900">
                {editingTest ? 'Edit Diagnostic Test' : 'Add New Laboratory Test'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Configure verified diagnostic parameters, sample collection guidelines, and pricing.
            </p>

            <form onSubmit={handleSaveTest} className="space-y-4 text-xs">
              
              {/* Test Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Test Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count (CBC) with Differential"
                  value={testForm.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                    setTestForm({
                      ...testForm,
                      name,
                      slug: editingTest ? testForm.slug : autoSlug
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              {/* Slug & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unique Slug / URL Identifier *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. complete-blood-count-cbc"
                    value={testForm.slug || ''}
                    onChange={(e) => setTestForm({ ...testForm, slug: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={testForm.category || DEFAULT_CATEGORIES[0]}
                    onChange={(e) => setTestForm({ ...testForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden bg-white"
                  >
                    {DEFAULT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Brief Description *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Evaluates cellular elements of blood including RBCs, hemoglobin, and platelets..."
                  value={testForm.description || ''}
                  onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden resize-none"
                />
              </div>

              {/* Sample Type & Fasting */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sample Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Blood (EDTA), Serum, Fluoride Plasma"
                    value={testForm.sample_type || ''}
                    onChange={(e) => setTestForm({ ...testForm, sample_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 w-full cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(testForm.fasting_required)}
                      onChange={(e) => setTestForm({ ...testForm, fasting_required: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300"
                    />
                    <span className="font-semibold text-slate-800">Fasting Required</span>
                  </label>
                </div>
              </div>

              {/* Preparation Instructions */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Patient Preparation Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Overnight fasting of 8-10 hours required. Water permitted."
                  value={testForm.preparation_instructions || ''}
                  onChange={(e) => setTestForm({ ...testForm, preparation_instructions: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              {/* Price, Turnaround, Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Indicative Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 450"
                    value={testForm.indicative_price != null ? testForm.indicative_price : ''}
                    onChange={(e) => setTestForm({ ...testForm, indicative_price: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Turnaround Time</label>
                  <input
                    type="text"
                    placeholder="e.g. Within 3-4 Hours"
                    value={testForm.turnaround_time || ''}
                    onChange={(e) => setTestForm({ ...testForm, turnaround_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    min="0"
                    value={testForm.display_order ?? 0}
                    onChange={(e) => setTestForm({ ...testForm, display_order: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Status Toggles */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(testForm.is_published)}
                    onChange={(e) => setTestForm({ ...testForm, is_published: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300"
                  />
                  <span className="font-semibold text-slate-800">Published to Public Website</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(testForm.is_available)}
                    onChange={(e) => setTestForm({ ...testForm, is_available: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300"
                  />
                  <span className="font-semibold text-slate-800">Currently Available</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 active:scale-95 disabled:opacity-60 transition-all flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingTest ? 'Save Changes' : 'Create Test'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONFIRM DELETION
          ========================================================================= */}
      {deletingTest && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-extrabold text-slate-900">
                Delete Diagnostic Test?
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-slate-800">"{deletingTest.name}"</strong>? This will remove the test from the database and public catalog.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingTest(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 disabled:opacity-60 transition-all flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: PUBLIC CARD PREVIEW
          ========================================================================= */}
      {previewTest && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-teal-600" />
                Public Catalog Card Preview
              </span>
              <button
                type="button"
                onClick={() => setPreviewTest(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Test Card Replica */}
            <div className="rounded-2xl border border-slate-200 p-5 bg-white space-y-3 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-100">
                  {previewTest.category}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  previewTest.is_available ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {previewTest.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>

              <h4 className="font-bold text-slate-900 text-sm">
                {previewTest.name}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {previewTest.description}
              </p>

              <div className="pt-3 border-t border-slate-100 space-y-1 text-xs">
                {previewTest.sample_type && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Droplet className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sample: <strong>{previewTest.sample_type}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-600">
                  <Utensils className="w-3.5 h-3.5 text-amber-500" />
                  <span>Fasting: {previewTest.fasting_required ? 'Required' : 'No Fasting'}</span>
                </div>
                {previewTest.turnaround_time && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>Turnaround: <strong>{previewTest.turnaround_time}</strong></span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-base font-black text-slate-900">
                  {previewTest.indicative_price != null ? `₹${previewTest.indicative_price}` : 'Contact Lab'}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-[11px]">
                  View Details
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPreviewTest(null)}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
