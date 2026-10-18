import React from 'react';
import { 
  HeartPulse, 
  Bone, 
  Brain, 
  Stethoscope, 
  Baby, 
  ShieldAlert, 
  UserCheck, 
  Activity, 
  ArrowRight 
} from 'lucide-react';
import { Speciality } from '../../types';

interface SpecialitiesSectionProps {
  specialities: Speciality[];
  onSelectSpeciality: (speciality: Speciality) => void;
}

export const SpecialitiesSection: React.FC<SpecialitiesSectionProps> = ({
  specialities,
  onSelectSpeciality,
}) => {
  // Map icon strings to Lucide components
  const getIcon = (name: string) => {
    switch (name) {
      case 'HeartPulse': return HeartPulse;
      case 'Bone': return Bone;
      case 'Brain': return Brain;
      case 'Baby': return Baby;
      case 'ShieldAlert': return ShieldAlert;
      case 'UserCheck': return UserCheck;
      case 'Activity': return Activity;
      default: return Stethoscope;
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
            Centers of Clinical Excellence
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Comprehensive Medical Specialities
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Equipped with state-of-the-art diagnostic imaging, modular surgical suites, and dedicated intensive care units.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {specialities.map((spec) => {
            const Icon = getIcon(spec.iconName);
            return (
              <div
                key={spec.id}
                className="group p-6 rounded-2xl border border-slate-200/90 hover:border-teal-500 hover:shadow-card bg-slate-50/50 hover:bg-white transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-teal-100/70 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {spec.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {spec.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onSelectSpeciality(spec)}
                    className="w-full flex items-center justify-between text-xs font-bold text-teal-600 group-hover:text-teal-700"
                  >
                    <span>Consult Specialists</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
