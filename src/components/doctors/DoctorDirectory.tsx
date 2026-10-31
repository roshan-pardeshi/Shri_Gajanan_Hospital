import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Star, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  X,
  Stethoscope
} from 'lucide-react';
import { Doctor, Speciality } from '../../types';

interface DoctorDirectoryProps {
  doctors: Doctor[];
  specialities: Speciality[];
  selectedSpecialityId?: string;
  onSelectDoctorForBooking: (doctor: Doctor) => void;
}

export const DoctorDirectory: React.FC<DoctorDirectoryProps> = ({
  doctors,
  specialities,
  selectedSpecialityId,
  onSelectDoctorForBooking,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSpeciality, setActiveSpeciality] = useState<string>(selectedSpecialityId || 'all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [selectedDoctorForModal, setSelectedDoctorForModal] = useState<Doctor | null>(null);

  // Filter doctors
  const filteredDoctors = doctors.filter((doc) => {
    // Exclude deleted or inactive doctors
    if (doc.is_active === false) {
      return false;
    }
    // Speciality match
    if (activeSpeciality !== 'all' && doc.speciality_id !== activeSpeciality) {
      return false;
    }
    // Availability match
    if (availabilityFilter !== 'all' && doc.availability_status !== availabilityFilter) {
      return false;
    }
    // Search match
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = doc.name.toLowerCase().includes(q);
      const matchSpec = doc.speciality_name?.toLowerCase().includes(q);
      const matchQual = doc.qualifications.toLowerCase().includes(q);
      return matchName || matchSpec || matchQual;
    }
    return true;
  });

  return (
    <section className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
            Clinical Directory
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
            Find Doctors & OPD Schedules
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Consult experienced medical leaders across all surgical and medical subspecialties. Select a doctor to check real-time available slots.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-card mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search doctor by name, qualification, or speciality..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Availability Filter Dropdown */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Status:
              </span>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                <option value="all">All Doctors</option>
                <option value="Available">Available Today</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          {/* Speciality Pills Scrollable */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveSpeciality('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                activeSpeciality === 'all'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Specialities ({doctors.length})
            </button>

            {specialities.map((spec) => (
              <button
                key={spec.id}
                type="button"
                onClick={() => setActiveSpeciality(spec.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  activeSpeciality === spec.id
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {spec.name}
              </button>
            ))}
          </div>
        </div>

        {/* Doctors Grid */}
        {filteredDoctors.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No doctors match your criteria</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search terms or clearing the speciality filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveSpeciality('all');
                setAvailabilityFilter('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doc) => {
              const isAvailable = doc.availability_status === 'Available';

              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Doctor Photo */}
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                        <img
                          src={doc.photo_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600'}
                          alt={doc.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600';
                          }}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Basic details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wide truncate">
                            {doc.speciality_name}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isAvailable ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Available
                              </span>
                            ) : doc.availability_status === 'On Leave' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                                On Leave
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {doc.availability_status}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              {doc.rating || 4.9}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900 mt-1 truncate">
                          {doc.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                          {doc.qualifications}
                        </p>
                        <p className="text-xs text-teal-700 font-semibold mt-1">
                          {doc.experience_years} Years Experience
                        </p>
                      </div>
                    </div>

                    {/* Bio snippet */}
                    <p className="text-xs text-slate-600 line-clamp-2 mt-4 leading-relaxed">
                      {doc.bio}
                    </p>

                    {/* Schedule & Working Days */}
                    <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">OPD Hours:</span>
                        <span className="font-semibold text-slate-800">
                          {doc.working_hours_start} - {doc.working_hours_end}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Working Days:</span>
                        <span className="font-semibold text-slate-800">
                          {doc.working_days.join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-slate-400">Consultation Fee:</span>
                        <span className="font-extrabold text-teal-700">
                          ₹{doc.consultation_fee}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-6 pt-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDoctorForModal(doc)}
                      className="flex-1 py-2.5 rounded-xl font-bold text-xs border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      View Profile
                    </button>

                    <button
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => onSelectDoctorForBooking(doc)}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                        isAvailable
                          ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20 active:scale-95'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{isAvailable ? 'Book Slot' : 'On Leave'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Doctor Details Modal */}
        {selectedDoctorForModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => setSelectedDoctorForModal(null)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4 mb-6">
                <img
                  src={selectedDoctorForModal.photo_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600'}
                  alt={selectedDoctorForModal.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600';
                  }}
                  className="w-20 h-20 rounded-2xl object-cover object-top border-2 border-teal-500 shadow-md"
                />
                <div>
                  <span className="text-xs font-bold text-teal-600 uppercase tracking-wide">
                    {selectedDoctorForModal.speciality_name}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {selectedDoctorForModal.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedDoctorForModal.qualifications}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800">
                      {selectedDoctorForModal.experience_years} Years Experience
                    </span>
                    {selectedDoctorForModal.availability_status === 'Available' ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Available
                      </span>
                    ) : selectedDoctorForModal.availability_status === 'On Leave' ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        On Leave
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-slate-500" />
                        {selectedDoctorForModal.availability_status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                    About Doctor & Clinical Expertise
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedDoctorForModal.bio}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">OPD Timings:</span>
                    <span className="font-bold text-slate-800">
                      {selectedDoctorForModal.working_hours_start} - {selectedDoctorForModal.working_hours_end}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">OPD Days:</span>
                    <span className="font-bold text-slate-800">
                      {selectedDoctorForModal.working_days.join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Slot Duration:</span>
                    <span className="font-bold text-slate-800">
                      {selectedDoctorForModal.slot_duration_minutes} Minutes
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-500">Consultation Fee:</span>
                    <span className="text-sm font-black text-teal-700">
                      ₹{selectedDoctorForModal.consultation_fee}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDoctorForModal(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-xs border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={selectedDoctorForModal.availability_status !== 'Available'}
                  onClick={() => {
                    const doc = selectedDoctorForModal;
                    setSelectedDoctorForModal(null);
                    onSelectDoctorForBooking(doc);
                  }}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${
                    selectedDoctorForModal.availability_status === 'Available'
                      ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 active:scale-95'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  }`}
                >
                  {selectedDoctorForModal.availability_status === 'Available'
                    ? `Book with ${selectedDoctorForModal.name.split(' ')[1] || 'Doctor'}`
                    : 'Doctor Currently On Leave'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
