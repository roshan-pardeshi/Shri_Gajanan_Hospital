import React from 'react';
import { 
  Stethoscope, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';

interface HowItWorksProps {
  onOpenBooking: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenBooking }) => {
  const steps = [
    {
      num: '01',
      title: 'Choose Speciality & Doctor',
      desc: 'Browse by medical department, check doctor qualifications, experience, and consult fees.',
      icon: Stethoscope,
    },
    {
      num: '02',
      title: 'Select Available Slot',
      desc: 'Pick your preferred date. Our real-time engine validates doctor OPD schedules and prevents double-booking.',
      icon: Calendar,
    },
    {
      num: '03',
      title: 'Enter Patient Details',
      desc: 'Fill basic patient info and brief symptoms. No unnecessary documents required.',
      icon: FileText,
    },
    {
      num: '04',
      title: 'Instant Confirmation & Tracking',
      desc: 'Receive your unique reference number (e.g. SGH-202610-8492) and in-app status updates.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="py-16 bg-slate-50 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
            Effortless Healthcare
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            How Appointment Booking Works
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Designed for swift, transparent booking with real-time slot conflict protection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div 
                key={idx} 
                className="relative bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-teal-600/30">
                      {step.num}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-teal-100/70 text-teal-700 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-teal-600">
                  <span>Step {step.num} of 04</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={onOpenBooking}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 transition-all active:scale-95"
          >
            <span>Book Your Appointment Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
