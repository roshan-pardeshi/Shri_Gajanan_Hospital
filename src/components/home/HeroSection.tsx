import React from 'react';
import {
  Calendar,
  ShieldCheck,
  HeartHandshake,
  Clock,
  ArrowRight,
  CheckCircle,
  Award,
  Sparkles
} from 'lucide-react';
import doctorImage from "../../assets/doctor.jpeg";
interface HeroSectionProps {
  onOpenBooking: () => void;
  onExploreSchemes: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenBooking,
  onExploreSchemes,
}) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-teal-40/60 via-white to-slate-50 pt-12 pb-20 lg:pt-16 lg:pb-28">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-teal-200/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-sky-200/30 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"> */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Text Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/80 border border-teal-200 text-teal-700 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>SmartCare Hospital Portal • Shri Gajanan Multispeciality Hospital</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              Your Health, <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-sky-600">
                Our Priority.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              Experience quality healthcare with compassionate care, experienced doctors, and modern medical facilities. Book appointments with specialists, explore our healthcare services, and access essential hospital information in one place. Our mission is to provide reliable, patient-friendly healthcare and make your medical journey simple and convenient.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={onOpenBooking}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/25 active:scale-95 transition-all group"
              >
                <Calendar className="w-4 h-4" />
                <span>Book an Appointment</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={onExploreSchemes}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-xs hover:border-teal-500 hover:text-teal-700 active:scale-95 transition-all"
              >
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
                <span>Explore Health Schemes</span>
              </button>
            </div>

            {/* Trust Highlights Checklist */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600 font-medium border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Instant Slot Confirmation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Zero Double Booking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                <span>100% Cashless Govt Desk</span>
              </div>
            </div>
          </div>

          {/* Right Visual Image & Interactive Status Card (5 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Doctor Visual */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 border-4 border-white bg-slate-100 h-[480px]">                <img
                src={doctorImage}
                alt="Senior Consultant Doctor at SmartCare Hospital"
                className="w-full h-full object-cover object-top"
              />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                {/* Doctor overlay details */}
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/90 text-white backdrop-blur-xs">
                    Chief of Cardiology
                  </span>
                  <h3 className="text-lg font-bold mt-1">Dr. Vishal Panditrao Pawar</h3>
                  <p className="text-xs text-slate-300">18+ Years Experience • 6,500+ Cardiac Surgeries</p>
                </div>
              </div>

              {/* Floating Card: Live Available OPD Slot */}
              <div className="absolute -top-5 -left-4 sm:-left-6 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-100/90 flex items-center gap-3.5 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                    OPD Active Today
                  </p>
                  <p className="text-xs font-extrabold text-slate-800">
                    Next Slot: Today at 10:30 AM
                  </p>
                </div>
              </div>

              {/* Floating Card: Accredited Badge */}
              <div className="absolute -bottom-5 -right-4 sm:-right-6 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-100/90 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900">NABH Quality Certified</p>
                  <p className="text-[11px] text-slate-500">Highest Patient Safety Standards</p>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Live Hospital Stats Bar */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white rounded-2xl p-6 shadow-card border border-slate-100">
          <div className="text-center p-3">
            <p className="text-3xl font-extrabold text-teal-600">18+</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Clinical Specialties</p>
          </div>
          <div className="text-center p-3 border-l border-slate-100">
            <p className="text-3xl font-extrabold text-slate-900">OPD</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Doctor Consultation
            </p>
          </div>
          <div className="text-center p-3 border-l border-slate-100">
            <p className="text-3xl font-extrabold text-emerald-600">₹5 Lakh</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Cashless Govt Coverage</p>
          </div>
          <div className="text-center p-3 border-l border-slate-100">
            <p className="text-3xl font-extrabold text-sky-600">24/7</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Emergency & Level III ICU</p>
          </div>
        </div>

      </div>
    </section>
  );
};
