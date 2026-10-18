import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { HeroSection } from './components/home/HeroSection';
import { QuickAccessCards } from './components/home/QuickAccessCards';
import { FeaturedDoctors } from './components/home/FeaturedDoctors';
import { SpecialitiesSection } from './components/home/SpecialitiesSection';
import { HowItWorks } from './components/home/HowItWorks';
import { SchemeHighlights } from './components/home/SchemeHighlights';
import { HospitalFacilities } from './components/home/HospitalFacilities';
import { ContactSection } from './components/home/ContactSection';
import { DoctorDirectory } from './components/doctors/DoctorDirectory';
import { SchemesPage } from './components/schemes/SchemesPage';
import { PatientDashboard } from './components/patient/PatientDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AppointmentBookingModal } from './components/booking/AppointmentBookingModal';
import { AuthModal } from './components/auth/AuthModal';
import { dataService } from './services/dataService';
import { Doctor, HealthScheme, Speciality, Appointment } from './types';
import { ShieldAlert, UserCheck } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, role, switchRole } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schemes, setSchemes] = useState<HealthScheme[]>([]);
  
  // Modals
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);
  const [selectedSpecialityFilter, setSelectedSpecialityFilter] = useState<string | undefined>(undefined);
  const [selectedSchemeForDetail, setSelectedSchemeForDetail] = useState<HealthScheme | null>(null);

  // Success Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Scroll to top on tab change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentTab]);

  useEffect(() => {
    // Initial fetch of core datasets
    dataService.getSpecialities().then(setSpecialities);
    dataService.getDoctors().then(setDoctors);
    dataService.getHealthSchemes().then(setSchemes);
  }, []);

  const handleOpenBookingWithDoctor = (doc: Doctor) => {
    setSelectedDoctorForBooking(doc);
    setIsBookingModalOpen(true);
  };

  const handleOpenBookingGeneral = () => {
    setSelectedDoctorForBooking(null);
    setIsBookingModalOpen(true);
  };

  const handleSpecialitySelect = (spec: Speciality) => {
    setSelectedSpecialityFilter(spec.id);
    setCurrentTab('doctors');
  };

  const handleSchemeSelect = (scheme: HealthScheme) => {
    setSelectedSchemeForDetail(scheme);
    setCurrentTab('schemes');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleBookingSuccess = (appointment: Appointment) => {
    showToast(`Appointment ${appointment.reference_number} booked successfully!`);
    // Refresh doctors list if needed
    dataService.getDoctors().then(setDoctors);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-24 right-5 z-50 bg-teal-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-teal-700 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        currentTab={currentTab}
        onNavigate={(tab) => {
          if (tab === 'specialities') {
            setSelectedSpecialityFilter(undefined);
          }
          setCurrentTab(tab);
        }}
        onOpenBooking={handleOpenBookingGeneral}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* TAB 1: HOME */}
        {currentTab === 'home' && (
          <div>
            <HeroSection
              onOpenBooking={handleOpenBookingGeneral}
              onExploreSchemes={() => setCurrentTab('schemes')}
            />
            <QuickAccessCards
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenBooking={handleOpenBookingGeneral}
            />
            <FeaturedDoctors
              doctors={doctors}
              onSelectDoctor={handleOpenBookingWithDoctor}
              onViewAllDoctors={() => setCurrentTab('doctors')}
            />
            <SpecialitiesSection
              specialities={specialities}
              onSelectSpeciality={handleSpecialitySelect}
            />
            <HowItWorks onOpenBooking={handleOpenBookingGeneral} />
            <SchemeHighlights
              schemes={schemes}
              onExploreSchemes={() => setCurrentTab('schemes')}
              onSelectScheme={handleSchemeSelect}
            />
            <HospitalFacilities />
            <ContactSection />
          </div>
        )}

        {/* TAB 2: DOCTORS DIRECTORY */}
        {currentTab === 'doctors' && (
          <DoctorDirectory
            doctors={doctors}
            specialities={specialities}
            selectedSpecialityId={selectedSpecialityFilter}
            onSelectDoctorForBooking={handleOpenBookingWithDoctor}
          />
        )}

        {/* TAB 3: SPECIALITIES */}
        {currentTab === 'specialities' && (
          <div className="py-12 bg-white">
            <SpecialitiesSection
              specialities={specialities}
              onSelectSpeciality={handleSpecialitySelect}
            />
            <FeaturedDoctors
              doctors={doctors}
              onSelectDoctor={handleOpenBookingWithDoctor}
              onViewAllDoctors={() => setCurrentTab('doctors')}
            />
          </div>
        )}

        {/* TAB 4: GOVERNMENT HEALTH SCHEMES */}
        {currentTab === 'schemes' && (
          <SchemesPage
            schemes={schemes}
            selectedScheme={selectedSchemeForDetail}
            onClearSelectedScheme={() => setSelectedSchemeForDetail(null)}
          />
        )}

        {/* TAB 5: HOSPITAL FACILITIES */}
        {currentTab === 'facilities' && (
          <div className="py-10">
            <HospitalFacilities />
            <ContactSection />
          </div>
        )}

        {/* TAB 6: CONTACT & MAP */}
        {currentTab === 'contact' && (
          <div className="py-10">
            <ContactSection />
          </div>
        )}

        {/* TAB 7: PATIENT DASHBOARD */}
        {currentTab === 'dashboard' && (
          <PatientDashboard onOpenBooking={handleOpenBookingGeneral} />
        )}

        {/* TAB 8: ADMIN DASHBOARD (Protected Route) */}
        {currentTab === 'admin' && (
          <div>
            {role === 'admin' ? (
              <AdminDashboard />
            ) : (
              <div className="min-h-[60vh] flex items-center justify-center p-6 bg-slate-50">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Administrator Access Required
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    You are currently viewing the portal as a Patient. Switch to Administrator role to view operations, approve appointments, and manage doctors.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => switchRole('admin')}
                      className="w-full py-3 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Switch to Admin Mode (Dr. Ramesh Shinde)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <Footer
        onNavigate={(tab) => setCurrentTab(tab)}
        onOpenBooking={handleOpenBookingGeneral}
      />

      {/* Appointment Booking Wizard Modal */}
      <AppointmentBookingModal
        isOpen={isBookingModalOpen}
        preselectedDoctor={selectedDoctorForBooking}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedDoctorForBooking(null);
        }}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
