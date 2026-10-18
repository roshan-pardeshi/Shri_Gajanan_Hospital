import React from 'react';
import { 
  Building2, 
  Activity, 
  Truck, 
  Pill, 
  ShieldAlert, 
  Microscope,
  CheckCircle 
} from 'lucide-react';

export const HospitalFacilities: React.FC = () => {
  const facilities = [
    {
      title: '24/7 Emergency & Level III Trauma',
      desc: 'Rapid-response triage with round-the-clock emergency physicians, acute resuscitation bay, and dedicated minor OT.',
      icon: ShieldAlert,
    },
    {
      title: '32-Bed Critical Care ICU & NICU',
      desc: 'Advanced multiparameter hemodynamic monitors, high-end ventilators, continuous central nursing, and isolation units.',
      icon: Activity,
    },
    {
      title: 'Digital Cath Lab & Modular OTs',
      desc: 'Ultra-clean laminar airflow operation theatres equipped for cardiac bypass, robotic joint replacement, and neuro-surgery.',
      icon: Building2,
    },
    {
      title: 'Advanced Diagnostic Imaging',
      desc: '128-Slice Cardiac CT, 1.5 Tesla MRI, 4D Ultrasound, Digital Mammography, and NABL-certified pathology laboratory.',
      icon: Microscope,
    },
    {
      title: '24/7 In-House Pharmacy',
      desc: 'Fully stocked with essential emergency medications, surgical consumables, and chronic disease therapeutics.',
      icon: Pill,
    },
    {
      title: 'Advanced Cardiac Ambulance Fleet',
      desc: 'GPS-tracked mobile intensive care ambulances staffed with trained paramedical officers and transport ventilators.',
      icon: Truck,
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
            Infrastructure & Care Standards
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            World-Class Hospital Facilities
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Engineered to deliver rapid diagnostic precision, superior surgical outcomes, and compassionate inpatient comfort.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {facilities.map((fac, idx) => {
            const Icon = fac.icon;
            return (
              <div
                key={idx}
                className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/80 hover:border-teal-500 hover:bg-white hover:shadow-card transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mb-2">
                  {fac.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {fac.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Patient Support Commitment */}
        <div className="mt-12 p-6 rounded-3xl bg-teal-600 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-teal-700/15">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-lg font-bold">Patient-Centric Support & Transparent Billing</h4>
            <p className="text-xs text-teal-100 max-w-xl">
              Zero hidden charges, cashless government scheme clearance desks, multilingual patient relations staff, and digital discharge summaries.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-xs font-bold text-xs">
              NABH Patient Safety Certified
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
