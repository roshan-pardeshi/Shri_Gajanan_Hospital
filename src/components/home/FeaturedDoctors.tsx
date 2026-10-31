// import React from 'react';
// import {
//   Star,
//   Clock,
//   Calendar,
//   ArrowRight,
//   CheckCircle2,
//   AlertCircle
// } from 'lucide-react';
// import { Doctor } from '../../types';

// interface FeaturedDoctorsProps {
//   doctors: Doctor[];
//   onSelectDoctor: (doctor: Doctor) => void;
//   onViewAllDoctors: () => void;
// }

// export const FeaturedDoctors: React.FC<FeaturedDoctorsProps> = ({
//   doctors,
//   onSelectDoctor,
//   onViewAllDoctors,
// }) => {
//   // Show up to 8 active featured doctors
//   const featured = doctors.filter(d => d.is_active !== false).slice(0, 8);

//   return (
//     <section className="py-16 bg-slate-50 border-y border-slate-200/80">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6">
//         <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
//           <div>
//             <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
//               Expert Clinical Team
//             </span>
//             <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
//               Meet Our Senior Specialists
//             </h2>
//             <p className="text-sm text-slate-500 mt-1 max-w-xl">
//               Board-certified consultants with extensive clinical experience across advanced medical disciplines.
//             </p>
//           </div>

//           <button
//             type="button"
//             onClick={onViewAllDoctors}
//             className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-800 bg-teal-100/60 hover:bg-teal-100 px-4 py-2 rounded-xl transition-all"
//           >
//             <span>View All Doctors ({doctors.length})</span>
//             <ArrowRight className="w-4 h-4" />
//           </button>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           {featured.map((doc) => {
//             const isAvailable = doc.availability_status === 'Available';

//             return (
//               <div
//                 key={doc.id}
//                 className="bg-white rounded-2xl border border-slate-200/90 shadow-card hover:shadow-elevated transition-all duration-300 overflow-hidden flex flex-col justify-between group"
//               >
//                 <div>
//                   {/* Doctor Headshot with availability badge */}
//                   <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
//                     <img
//                       src={doc.photo_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600'}
//                       alt={doc.name}
//                       onError={(e) => {
//                         (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600';
//                       }}
//                       className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
//                     />
//                     <div className="absolute top-3 left-3">
//                       {isAvailable ? (
//                         <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-emerald-800 shadow-xs backdrop-blur-xs flex items-center gap-1">
//                           <CheckCircle2 className="w-3 h-3 text-emerald-600" />
//                           Available
//                         </span>
//                       ) : doc.availability_status === 'On Leave' ? (
//                         <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-xs backdrop-blur-xs flex items-center gap-1 animate-pulse">
//                           <Clock className="w-3 h-3 text-white" />
//                           On Leave
//                         </span>
//                       ) : (
//                         <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-200 shadow-xs backdrop-blur-xs flex items-center gap-1">
//                           <AlertCircle className="w-3 h-3 text-slate-400" />
//                           Not Available
//                         </span>
//                       )}
//                     </div>
//                     <div className="absolute top-3 right-3">
//                       <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-slate-900/80 text-white shadow-xs backdrop-blur-xs flex items-center gap-1">
//                         <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
//                         {doc.rating || 4.9}
//                       </span>
//                     </div>
//                   </div>

//                   {/* Details */}
//                   <div className="p-5 space-y-3">
//                     <div>
//                       <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wide">
//                         {doc.speciality_name}
//                       </span>
//                       <h3 className="text-base font-extrabold text-slate-900 mt-0.5 line-clamp-1">
//                         {doc.name}
//                       </h3>
//                       <p className="text-xs text-slate-500 line-clamp-1 font-medium mt-0.5">
//                         {doc.qualifications}
//                       </p>
//                     </div>

//                     <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
//                       {doc.bio}
//                     </p>

//                     <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
//                       <div className="flex items-center gap-1">
//                         <Clock className="w-3.5 h-3.5 text-teal-600" />
//                         <span>{doc.experience_years}+ Yrs Exp</span>
//                       </div>
//                       <div className="font-bold text-slate-900">
//                         ₹{doc.consultation_fee} <span className="text-[10px] font-normal text-slate-400">OPD</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Booking CTA */}
//                 <div className="p-5 pt-0">
//                   {isAvailable ? (
//                     <button
//                       type="button"
//                       onClick={() => onSelectDoctor(doc)}
//                       className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white transition-all duration-200 border border-teal-200 hover:border-teal-600 active:scale-95"
//                     >
//                       <Calendar className="w-3.5 h-3.5" />
//                       <span>Book Appointment</span>
//                     </button>
//                   ) : (
//                     <button
//                       type="button"
//                       disabled
//                       className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
//                     >
//                       <Clock className="w-3.5 h-3.5 text-amber-600" />
//                       <span>Doctor On Leave (Unavailable)</span>
//                     </button>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </section>
//   );
// };

import React from 'react';
import {
  Star,
  Clock,
  Calendar,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Doctor } from '../../types';

interface FeaturedDoctorsProps {
  doctors: Doctor[];
  onSelectDoctor: (doctor: Doctor) => void;
  onViewAllDoctors: () => void;
}

export const FeaturedDoctors: React.FC<FeaturedDoctorsProps> = ({
  doctors,
  onSelectDoctor,
  onViewAllDoctors,
}) => {
  // Display up to 8 active doctors
  const featured = doctors
    .filter((doctor) => doctor.is_active !== false)
    .slice(0, 8);

  return (
    <section className="py-16 bg-slate-50 border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Heading */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
              Our Medical Team
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Meet Our Doctors
            </h2>

            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Meet our doctors and explore the medical services available at
              our hospital.
            </p>
          </div>

          <button
            type="button"
            onClick={onViewAllDoctors}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-800 bg-teal-100/60 hover:bg-teal-100 px-4 py-2 rounded-xl transition-all"
          >
            <span>View All Doctors ({doctors.filter(d => d.is_active !== false).length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Centered Responsive Doctor Cards */}
        {featured.length > 0 ? (
          <div className="flex flex-wrap justify-center items-stretch gap-6">
            {featured.map((doc) => {
              const isAvailable =
                doc.availability_status === 'Available';

              return (
                <div
                  key={doc.id}
                  className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] max-w-sm bg-white rounded-2xl border border-slate-200/90 shadow-card hover:shadow-elevated transition-all duration-300 overflow-hidden flex flex-col group"
                >
                  {/* Doctor Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={
                        doc.photo_url ||
                        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600'
                      }
                      alt={doc.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600';
                      }}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Availability Badge */}
                    <div className="absolute top-3 left-3">
                      {isAvailable ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-emerald-800 shadow-sm flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Available
                        </span>
                      ) : doc.availability_status === 'On Leave' ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          On Leave
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-white shadow-sm flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Not Available
                        </span>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-slate-900/80 text-white shadow-sm flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {doc.rating ?? 4.9}
                      </span>
                    </div>
                  </div>

                  {/* Doctor Details */}
                  <div className="p-5 space-y-3 flex-1">
                    <div>
                      <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wide">
                        {doc.speciality_name}
                      </span>

                      <h3 className="text-base font-extrabold text-slate-900 mt-0.5 line-clamp-1">
                        {doc.name}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-1 font-medium mt-0.5">
                        {doc.qualifications}
                      </p>
                    </div>

                    {doc.bio && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {doc.bio}
                      </p>
                    )}

                    {/* Experience and Consultation Fee */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>
                          {doc.experience_years}+ Yrs Exp
                        </span>
                      </div>

                      <div className="font-bold text-slate-900">
                        ₹{doc.consultation_fee}{' '}
                        <span className="text-[10px] font-normal text-slate-400">
                          OPD
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Booking Button */}
                  <div className="p-5 pt-0 mt-auto">
                    {isAvailable ? (
                      <button
                        type="button"
                        onClick={() => onSelectDoctor(doc)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white transition-all duration-200 border border-teal-200 hover:border-teal-600 active:scale-95"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book Appointment</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          {doc.availability_status === 'On Leave'
                            ? 'Doctor On Leave'
                            : 'Currently Unavailable'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-lg font-bold text-slate-800">
              No doctors currently available to display
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Please check back later or contact the hospital for assistance.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
