import React from 'react';
import { 
  UserCheck, 
  Stethoscope, 
  CalendarCheck, 
  HeartHandshake, 
  ArrowRight 
} from 'lucide-react';

interface QuickAccessCardsProps {
  onNavigate: (tab: string) => void;
  onOpenBooking: () => void;
  sectionsVisibility?: Record<string, boolean>;
}

export const QuickAccessCards: React.FC<QuickAccessCardsProps> = ({
  onNavigate,
  onOpenBooking,
  sectionsVisibility,
}) => {
  const cards = [
    ...(sectionsVisibility?.doctors !== false ? [{
      title: 'Doctors & OPD',
      desc: 'Explore 60+ verified senior specialists, doctor profiles, OPD schedules, and fees.',
      icon: UserCheck,
      color: 'teal',
      badge: 'Verified Faculty',
      action: () => onNavigate('doctors'),
    }] : []),
    ...(sectionsVisibility?.specialities !== false ? [{
      title: 'Medical Specialities',
      desc: 'World-class departments including Cardiology, Orthopaedics, Neurology, & Oncology.',
      icon: Stethoscope,
      color: 'sky',
      badge: '18+ Centers',
      action: () => onNavigate('specialities'),
    }] : []),
    {
      title: 'Book Appointment',
      desc: 'Pick your preferred date, consult timings, and receive instant booking reference.',
      icon: CalendarCheck,
      color: 'emerald',
      badge: 'Instant Slot',
      action: onOpenBooking,
    },
    ...(sectionsVisibility?.schemes !== false ? [{
      title: 'Government Schemes',
      desc: 'Avail 100% cashless healthcare under Ayushman Bharat PM-JAY & Maharashtra MJPJAY.',
      icon: HeartHandshake,
      color: 'amber',
      badge: 'Cashless Up to ₹5L',
      action: () => onNavigate('schemes'),
    }] : []),
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Quick Portals</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Access Hospital Services Fast
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Direct gateways for patients, relatives, and scheme beneficiaries.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={card.action}
                className="group relative text-left bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card hover:shadow-elevated hover:border-teal-500 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-600 group-hover:text-teal-700">
                  <span>Explore Now</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
