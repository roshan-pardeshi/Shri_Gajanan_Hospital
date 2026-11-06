// import React from 'react';
// import { 
//   Stethoscope, 
//   Calendar, 
//   FileText, 
//   CheckCircle2, 
//   ArrowRight 
// } from 'lucide-react';

// interface HowItWorksProps {
//   onOpenBooking: () => void;
// }

// export const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenBooking }) => {
//   const steps = [
//     {
//       num: '01',
//       title: 'Choose Speciality & Doctor',
//       desc: 'Browse by medical department, check doctor qualifications, experience, and consult fees.',
//       icon: Stethoscope,
//     },
//     {
//       num: '02',
//       title: 'Select Available Slot',
//       desc: 'Pick your preferred date. Our real-time engine validates doctor OPD schedules and prevents double-booking.',
//       icon: Calendar,
//     },
//     {
//       num: '03',
//       title: 'Enter Patient Details',
//       desc: 'Fill basic patient info and brief symptoms. No unnecessary documents required.',
//       icon: FileText,
//     },
//     {
//       num: '04',
//       title: 'Instant Confirmation & Tracking',
//       desc: 'Receive your unique reference number (e.g. SGH-202610-8492) and in-app status updates.',
//       icon: CheckCircle2,
//     },
//   ];

//   return (
//     <section className="py-16 bg-slate-50 border-t border-slate-200/80">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6">
//         <div className="text-center max-w-2xl mx-auto mb-14">
//           <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
//             Effortless Healthcare
//           </span>
//           <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
//             How Appointment Booking Works
//           </h2>
//           <p className="text-sm text-slate-500 mt-2">
//             Designed for swift, transparent booking with real-time slot conflict protection.
//           </p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
//           {steps.map((step, idx) => {
//             const Icon = step.icon;
//             return (
//               <div 
//                 key={idx} 
//                 className="relative bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between"
//               >
//                 <div>
//                   <div className="flex items-center justify-between mb-4">
//                     <span className="text-2xl font-black text-teal-600/30">
//                       {step.num}
//                     </span>
//                     <div className="w-10 h-10 rounded-xl bg-teal-100/70 text-teal-700 flex items-center justify-center">
//                       <Icon className="w-5 h-5" />
//                     </div>
//                   </div>

//                   <h3 className="text-base font-bold text-slate-900 mb-2">
//                     {step.title}
//                   </h3>
//                   <p className="text-xs text-slate-500 leading-relaxed">
//                     {step.desc}
//                   </p>
//                 </div>

//                 <div className="mt-6 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-teal-600">
//                   <span>Step {step.num} of 04</span>
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         <div className="mt-12 text-center">
//           <button
//             type="button"
//             onClick={onOpenBooking}
//             className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 transition-all active:scale-95"
//           >
//             <span>Book Your Appointment Now</span>
//             <ArrowRight className="w-4 h-4" />
//           </button>
//         </div>
//       </div>
//     </section>
//   );
// };

import React from 'react';
import {
  Stethoscope,
  Calendar,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  HeartPulse
} from 'lucide-react';

interface HowItWorksProps {
  onOpenBooking: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({
  onOpenBooking
}) => {
  const steps = [
    {
      num: '01',
      title: 'Choose Speciality & Doctor',
      desc: 'Explore our medical departments and select a doctor based on qualifications, experience and consultation fees.',
      icon: Stethoscope,
    },
    {
      num: '02',
      title: 'Select Available Slot',
      desc: 'Choose your preferred appointment date and time from the available doctor OPD schedule.',
      icon: Calendar,
    },
    {
      num: '03',
      title: 'Enter Patient Details',
      desc: 'Provide your basic information and briefly describe your health concerns to help us prepare for your visit.',
      icon: FileText,
    },
    {
      num: '04',
      title: 'Appointment Confirmation',
      desc: 'Receive your appointment reference number and track your booking status through your patient dashboard.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="relative overflow-hidden py-20 bg-gradient-to-b from-white via-teal-50/40 to-slate-50 border-t border-slate-200">

      {/* Background decoration */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">

        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-14">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100 text-teal-700 text-xs font-bold uppercase tracking-wider mb-4">
            <HeartPulse className="w-4 h-4" />
            Simple & Convenient Healthcare
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Your Healthcare Journey,
            <span className="block text-teal-600 mt-1">
              Made Simple
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-500 mt-4 leading-relaxed">
            Book your appointment in just four easy steps.
            Experience convenient, transparent and hassle-free
            healthcare at Shri Gajanan Hospital.
          </p>

        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {steps.map((step, idx) => {
            const Icon = step.icon;

            return (
              <div
                key={step.num}
                className="group relative bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-teal-200 transition-all duration-300 flex flex-col min-h-[270px]"
              >

                {/* Step number and icon */}
                <div className="flex items-center justify-between mb-6">

                  <span className="text-4xl font-black text-teal-100 group-hover:text-teal-200 transition-colors">
                    {step.num}
                  </span>

                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
                    <Icon className="w-6 h-6" />
                  </div>

                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-teal-700 transition-colors">
                  {step.title}
                </h3>

                <p className="text-sm text-slate-500 leading-relaxed">
                  {step.desc}
                </p>

                {/* Bottom indicator */}
                <div className="mt-auto pt-5 flex items-center justify-between border-t border-slate-100">

                  <span className="text-xs font-bold text-teal-600">
                    STEP {step.num}
                  </span>

                  {idx !== steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-teal-400" />
                  )}

                  {idx === steps.length - 1 && (
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  )}

                </div>

              </div>
            );
          })}

        </div>

        {/* Trust Information */}
        <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-slate-600">

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            Secure Patient Information
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            Convenient Appointment Booking
          </div>

        </div>

        {/* CTA */}
        <div className="mt-12 text-center">

          <button
            type="button"
            onClick={onOpenBooking}
            className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-sm sm:text-base bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 hover:shadow-xl transition-all duration-300 active:scale-95"
          >
            Book Your Appointment Now
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-xs text-slate-400 mt-4">
            Your health is our priority.
          </p>

        </div>

      </div>
    </section>
  );
};
