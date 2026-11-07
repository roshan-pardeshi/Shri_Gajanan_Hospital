import React, { useEffect, useState } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  HeartPulse,
  Quote,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  PhoneCall,
  Clock
} from 'lucide-react';
import defaultDoctorPhoto from '../../assets/doctor.jpeg';
import { ChiefDoctorProfile, Doctor } from '../../types';
import { dataService } from '../../services/dataService';

interface ChiefDoctorSectionProps {
  onOpenBookingGeneral: () => void;
  onOpenBookingWithDoctor?: (doctor: Doctor) => void;
  onNavigateContact?: () => void;
}

export const ChiefDoctorSection: React.FC<ChiefDoctorSectionProps> = ({
  onOpenBookingGeneral,
  onOpenBookingWithDoctor,
  onNavigateContact,
}) => {
  const [profile, setProfile] = useState<ChiefDoctorProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const data = await dataService.getChiefDoctorProfile();
        if (isMounted) {
          setProfile(data);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Failed to load Chief Doctor Profile:', err);
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setProfile(e.detail);
      } else {
        fetchProfile();
      }
    };

    window.addEventListener('chief-doctor-updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('chief-doctor-updated', handleUpdate);
    };
  }, []);

  const doctorName = profile?.name || 'Dr. Vishal Panditrao Pawar';
  const designation = profile?.designation || 'Chief Doctor / Medical Director';
  const qualifications = profile?.qualifications || 'MBBS, MD (Medicine), DM (Cardiology), FACC';
  const speciality = profile?.speciality || 'Cardiology & Internal Medicine';
  const experienceYears = profile?.experience_years || 18;
  const photoSrc = profile?.photo_url || defaultDoctorPhoto;
  const introduction =
    profile?.introduction ||
    'Dr. Vishal Panditrao Pawar is the Chief Doctor and Medical Director at Shri Gajanan Hospital. With over 18 years of clinical and interventional expertise, he has performed over 6,500+ successful cardiac interventions and pioneered compassionate, patient-centered clinical standards across the region.';
  const welcomeMessage =
    profile?.welcome_message ||
    'Welcome to Shri Gajanan Hospital. Our paramount commitment is ensuring every patient receives state-of-the-art medical excellence delivered with empathy, dignity, and personal care. We stand by you and your family around the clock for all your healthcare needs.';

  const handleBookAppointment = () => {
    if (profile?.linked_doctor && onOpenBookingWithDoctor) {
      onOpenBookingWithDoctor(profile.linked_doctor);
    } else {
      onOpenBookingGeneral();
    }
  };

  const handleContactClick = () => {
    const contactEl = document.getElementById('contact-section');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
    } else if (onNavigateContact) {
      onNavigateContact();
    } else {
      onOpenBookingGeneral();
    }
  };

  return (
    <section 
      id="chief-doctor-section"
      className="py-12 lg:py-16 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-100 relative overflow-hidden"
    >
      {/* Decorative Background Lighting */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-sky-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header Badge */}
        <div className="text-center sm:text-left mb-8 lg:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Meet Our Chief Doctor & Leadership</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2.5 tracking-tight">
            Excellence in Medical Leadership & Compassionate Healing
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl">
            Guiding Shri Gajanan Hospital with visionary clinical expertise, rigorous safety protocols, and personalized patient-first attention.
          </p>
        </div>

        {/* Main Card Container */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center p-6 sm:p-8 lg:p-10">
            
            {/* LEFT COLUMN: Large Professional Photograph */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-md mx-auto">
                {/* Decorative Frame Glow */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-teal-500/20 to-sky-400/20 rounded-3xl blur-md pointer-events-none" />

                {/* Photo Frame */}
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-100 border-4 border-white shadow-lg aspect-4/5">
                  <img
                    src={photoSrc}
                    alt={`${doctorName} - ${designation}`}
                    className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-102"
                    loading="lazy"
                  />
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

                  {/* Photo Bottom Badges */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/95 text-white backdrop-blur-xs shadow-sm">
                      <Award className="w-3.5 h-3.5" />
                      <span>{designation}</span>
                    </span>
                    <p className="text-base font-bold text-white mt-1 drop-shadow-xs">
                      {doctorName}
                    </p>
                    <p className="text-xs text-slate-200">
                      {experienceYears}+ Years Clinical Experience
                    </p>
                  </div>
                </div>

                {/* Floating Accreditation Card */}
                <div className="hidden sm:flex absolute -bottom-5 -right-3 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-slate-100 items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">Verified Medical Leader</p>
                    <p className="text-[11px] text-slate-500">Shri Gajanan Hospital</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Chief Doctor Information */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6 text-left">
              
              {/* Doctor Title & Speciality */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-teal-100/90 text-teal-800 border border-teal-200">
                    {designation}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                    <span>{speciality}</span>
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {doctorName}
                </h3>
                <p className="text-sm font-semibold text-teal-700 mt-1 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  <span>{qualifications}</span>
                </p>
              </div>

              {/* Key Highlights Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-1">
                <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/70 text-center sm:text-left">
                  <span className="text-2xl font-black text-teal-600">{experienceYears}+</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">Years Experience</p>
                  <p className="text-[11px] text-slate-500">Clinical Leadership</p>
                </div>

                <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/70 text-center sm:text-left">
                  <span className="text-2xl font-black text-slate-900">6,500+</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">Procedures</p>
                  <p className="text-[11px] text-slate-500">Complex Interventions</p>
                </div>

                <div className="col-span-2 sm:col-span-1 bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/70 text-center sm:text-left">
                  <span className="text-2xl font-black text-emerald-600">100%</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">Patient Safety</p>
                  <p className="text-[11px] text-slate-500">NABH Standards</p>
                </div>
              </div>

              {/* Professional Introduction */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Professional Profile & Clinical Leadership
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed font-normal">
                  {introduction}
                </p>
              </div>

              {/* Patient Welcome Message Card */}
              <div className="relative bg-gradient-to-r from-teal-50/80 via-white to-sky-50/60 rounded-2xl p-4 sm:p-5 border-l-4 border-teal-600 border border-slate-200/60 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Quote className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-teal-900 uppercase tracking-wide">
                      A Personal Message From the Medical Director
                    </h5>
                    <p className="text-xs sm:text-sm italic text-slate-700 mt-1 leading-relaxed">
                      "{welcomeMessage}"
                    </p>
                    <p className="text-[11px] font-bold text-slate-600 mt-2">
                      — {doctorName}, <span className="font-medium text-slate-500">{designation}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBookAppointment}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 active:scale-95 transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Appointment with Chief Doctor</span>
                </button>

                <button
                  type="button"
                  onClick={handleContactClick}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs hover:border-teal-500 active:scale-95 transition-all"
                >
                  <PhoneCall className="w-4 h-4 text-teal-600" />
                  <span>Hospital Helpdesk & OPD Hours</span>
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

