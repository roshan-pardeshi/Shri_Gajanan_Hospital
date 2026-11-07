import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Upload,
  Link as LinkIcon,
  Save,
  Sparkles,
  Stethoscope,
  HeartPulse,
  Quote,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import defaultDoctorPhoto from '../../assets/doctor.jpeg';
import { ChiefDoctorProfile } from '../../types';
import { dataService } from '../../services/dataService';

interface AdminChiefDoctorTabProps {
  onRefreshDoctors?: () => Promise<void> | void;
}

export const AdminChiefDoctorTab: React.FC<AdminChiefDoctorTabProps> = ({
  onRefreshDoctors,
}) => {
  const [profile, setProfile] = useState<ChiefDoctorProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');

  const [form, setForm] = useState<Partial<ChiefDoctorProfile>>({
    name: 'Dr. Vishal Panditrao Pawar',
    designation: 'Chief Doctor / Medical Director',
    qualifications: 'MBBS, MD (Medicine), DM (Cardiology), FACC',
    speciality: 'Cardiology & Internal Medicine',
    experience_years: 18,
    photo_url: '',
    introduction: '',
    welcome_message: '',
  });

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await dataService.getChiefDoctorProfile();
      setProfile(data);
      setForm({
        name: data.name,
        designation: data.designation,
        qualifications: data.qualifications,
        speciality: data.speciality,
        experience_years: data.experience_years,
        photo_url: data.photo_url || '',
        introduction: data.introduction,
        welcome_message: data.welcome_message,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load Chief Doctor Profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm(prev => ({ ...prev, photo_url: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const updated = await dataService.updateChiefDoctorProfile(form);
      setProfile(updated);
      setSuccessMsg('Chief Doctor profile saved and updated successfully!');
      if (onRefreshDoctors) {
        await onRefreshDoctors();
      }
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save Chief Doctor Profile');
    } finally {
      setSaving(false);
    }
  };

  const photoPreview = form.photo_url || defaultDoctorPhoto;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Chief Doctor & Medical Director Profile</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Manage the Chief Doctor profile shown on the homepage hero section. Updates automatically sync with the doctor directory without creating duplicate records.
          </p>
        </div>

        <button
          type="button"
          onClick={loadProfile}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload</span>
        </button>
      </div>

      {/* Notification Banners */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Edit Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Photograph & Visual Preview (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <label className="text-xs font-bold text-slate-700">Chief Doctor Photograph</label>
          
          {/* Photo Preview Container */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 aspect-4/5 shadow-sm max-w-sm mx-auto w-full">
            <img
              src={photoPreview}
              alt={form.name || 'Chief Doctor'}
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent p-3 text-white text-left">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500 text-white">
                {form.designation || 'Medical Director'}
              </span>
              <p className="text-xs font-bold mt-1 truncate">{form.name || 'Doctor Name'}</p>
              <p className="text-[10px] text-slate-300">{form.experience_years || 18}+ Years Exp.</p>
            </div>
          </div>

          {/* Upload or URL Option Tabs */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setImageTab('upload')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                imageTab === 'upload' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photo</span>
            </button>
            <button
              type="button"
              onClick={() => setImageTab('url')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                imageTab === 'url' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Image URL</span>
            </button>
          </div>

          {imageTab === 'upload' ? (
            <div>
              <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-dashed border-teal-400 bg-teal-50/50 hover:bg-teal-50 text-teal-700 text-xs font-bold cursor-pointer transition-all">
                <Upload className="w-4 h-4" />
                <span>Choose Photo from Device</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-400 mt-1 text-center">PNG, JPG or WEBP (Max 5MB)</p>
            </div>
          ) : (
            <div>
              <input
                type="url"
                value={form.photo_url || ''}
                onChange={(e) => setForm(prev => ({ ...prev, photo_url: e.target.value }))}
                placeholder="https://example.com/photo.jpg"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Enter a direct public image URL</p>
            </div>
          )}

          {form.photo_url && (
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, photo_url: '' }))}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold underline"
            >
              Reset to Default Hospital Photo
            </button>
          )}
        </div>

        {/* Right Column: Information Form (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Doctor Full Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Doctor's Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name || ''}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Dr. Vishal Panditrao Pawar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            {/* Designation */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Designation <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.designation || ''}
                onChange={(e) => setForm(prev => ({ ...prev, designation: e.target.value }))}
                placeholder="Chief Doctor / Medical Director"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Medical Qualifications */}
            <div className="sm:col-span-7">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Medical Qualifications <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.qualifications || ''}
                onChange={(e) => setForm(prev => ({ ...prev, qualifications: e.target.value }))}
                placeholder="e.g. MBBS, MD (Medicine), DM (Cardiology), FACC"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            {/* Speciality */}
            <div className="sm:col-span-3">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Speciality <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.speciality || ''}
                onChange={(e) => setForm(prev => ({ ...prev, speciality: e.target.value }))}
                placeholder="e.g. Cardiology"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            {/* Experience Years */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Experience (Yrs) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="60"
                required
                value={form.experience_years ?? 18}
                onChange={(e) => setForm(prev => ({ ...prev, experience_years: parseInt(e.target.value, 10) || 1 }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Professional Introduction */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Professional Introduction <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={form.introduction || ''}
              onChange={(e) => setForm(prev => ({ ...prev, introduction: e.target.value }))}
              placeholder="Describe clinical background, achievements, and leadership role at Shri Gajanan Hospital..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs leading-relaxed focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">Detailed biography displayed on the homepage Chief Doctor section.</p>
          </div>

          {/* Patient Welcome Message */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Patient Welcome Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={form.welcome_message || ''}
              onChange={(e) => setForm(prev => ({ ...prev, welcome_message: e.target.value }))}
              placeholder="A personal message of care and commitment to hospital patients and families..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs leading-relaxed focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">Short personal quote displayed in the highlighted welcome card.</p>
          </div>

          {/* Action Controls */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Profile...' : 'Save Chief Doctor Profile'}</span>
            </button>
          </div>

        </div>

      </form>
    </div>
  );
};

