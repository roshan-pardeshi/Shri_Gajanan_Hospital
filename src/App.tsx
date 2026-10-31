import React, { useState, useEffect, useCallback } from 'react';
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
import { LaboratoryCardSection } from './components/home/LaboratoryCardSection';
import { DoctorDirectory } from './components/doctors/DoctorDirectory';
import { SchemesPage } from './components/schemes/SchemesPage';
import { LaboratoryPage } from './components/laboratory/LaboratoryPage';
import { PatientDashboard } from './components/patient/PatientDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { AppointmentBookingModal } from './components/booking/AppointmentBookingModal';
import { AuthModal } from './components/auth/AuthModal';
import { dataService } from './services/dataService';
import { Doctor, HealthScheme, Speciality, Appointment, LaboratorySettings, HospitalSettings } from './types';
import { 
  ShieldAlert, 
  ArrowLeft, 
  LayoutDashboard, 
  Loader2, 
  Lock, 
  Home, 
  LogOut 
} from 'lucide-react';

const getTabFromPath = (path: string): string => {
  const clean = path.toLowerCase().replace(/\/$/, '') || '/';
  if (clean === '/admin/login') return 'admin-login';
  if (clean === '/admin' || clean.startsWith('/admin/')) return 'admin';
  if (clean === '/laboratory' || clean === '/lab' || clean === '/tests') return 'laboratory';
  if (clean === '/doctors' || clean === '/opd') return 'doctors';
  if (clean === '/specialities' || clean === '/departments') return 'specialities';
  if (clean === '/schemes' || clean === '/ayushman-bharat') return 'schemes';
  if (clean === '/facilities') return 'facilities';
  if (clean === '/contact') return 'contact';
  if (clean === '/dashboard' || clean === '/patient') return 'dashboard';
  return 'home';
};

const getPathForTab = (tab: string): string => {
  switch (tab) {
    case 'admin-login': return '/admin/login';
    case 'admin': return '/admin';
    case 'laboratory': return '/laboratory';
    case 'doctors': return '/doctors';
    case 'specialities': return '/specialities';
    case 'schemes': return '/schemes';
    case 'facilities': return '/facilities';
    case 'contact': return '/contact';
    case 'dashboard': return '/dashboard';
    case 'home':
    default:
      return '/';
  }
};

const MainApp: React.FC = () => {
  const { user, isAdmin, isLoading: authLoading, logout } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return getTabFromPath(window.location.pathname);
    }
    return 'home';
  });

  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schemes, setSchemes] = useState<HealthScheme[]>([]);
  const [laboratorySettings, setLaboratorySettings] = useState<LaboratorySettings | null>(null);
  const [hospitalSettings, setHospitalSettings] = useState<HospitalSettings | null>(null);
  
  // Modals
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);
  const [selectedSpecialityFilter, setSelectedSpecialityFilter] = useState<string | undefined>(undefined);
  const [selectedSchemeForDetail, setSelectedSchemeForDetail] = useState<HealthScheme | null>(null);

  // Success Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const navigateTo = useCallback((tab: string) => {
    if (tab === 'specialities') {
      setSelectedSpecialityFilter(undefined);
    }
    setCurrentTab(tab);
    if (typeof window !== 'undefined') {
      const targetPath = getPathForTab(tab);
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Listen to browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentTab(getTabFromPath(window.location.pathname));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Strict route protection: unauthenticated visitors accessing /admin must be redirected to /admin/login
  useEffect(() => {
    if (currentTab === 'admin' && !authLoading) {
      if (!user) {
        // Unauthenticated visitor -> redirect immediately to admin login
        navigateTo('admin-login');
      }
    }
  }, [currentTab, authLoading, user, navigateTo]);

  useEffect(() => {
    // Refresh datasets when relevant
    dataService.getHealthSchemes().then(setSchemes);
    dataService.getDoctors().then(setDoctors);
    dataService.getLaboratorySettings().then(setLaboratorySettings);
    dataService.getHospitalSettings().then(setHospitalSettings);
  }, [currentTab]);

  useEffect(() => {
    // Initial fetch of core datasets
    dataService.getSpecialities().then(setSpecialities);
    dataService.getDoctors().then(setDoctors);
    dataService.getHealthSchemes().then(setSchemes);
    dataService.getLaboratorySettings().then(setLaboratorySettings);

    const handleSchemesUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setSchemes(e.detail);
      } else {
        dataService.getHealthSchemes().then(setSchemes);
      }
    };
    window.addEventListener('health-schemes-updated', handleSchemesUpdate);

    const handleDoctorsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setDoctors(e.detail);
      } else {
        dataService.getDoctors().then(setDoctors);
      }
    };
    window.addEventListener('doctors-updated', handleDoctorsUpdate);

    const handleLabSettingsUpdate = (e: any) => {
      if (e.detail) {
        setLaboratorySettings(e.detail);
      } else {
        dataService.getLaboratorySettings().then(setLaboratorySettings);
      }
    };
    window.addEventListener('laboratory-settings-updated', handleLabSettingsUpdate);

    const handleHospitalSettingsUpdate = (e: any) => {
      if (e.detail) {
        setHospitalSettings(e.detail);
      } else {
        dataService.getHospitalSettings().then(setHospitalSettings);
      }
    };
    window.addEventListener('hospital-settings-updated', handleHospitalSettingsUpdate);

    // Initial fetch of hospital settings
    dataService.getHospitalSettings().then(setHospitalSettings);

    return () => {
      window.removeEventListener('health-schemes-updated', handleSchemesUpdate);
      window.removeEventListener('doctors-updated', handleDoctorsUpdate);
      window.removeEventListener('laboratory-settings-updated', handleLabSettingsUpdate);
      window.removeEventListener('hospital-settings-updated', handleHospitalSettingsUpdate);
    };
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
    navigateTo('doctors');
  };

  const handleSchemeSelect = (scheme: HealthScheme) => {
    setSelectedSchemeForDetail(scheme);
    navigateTo('schemes');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleBookingSuccess = (appointment: Appointment) => {
    showToast(`Appointment ${appointment.reference_number} booked successfully!`);
    dataService.getDoctors().then(setDoctors);
  };

  // Dedicated admin login page view (when currentTab === 'admin-login')
  if (currentTab === 'admin-login') {
    return (
      <div className="min-h-screen flex flex-col bg-white text-slate-800">
        <Header
          currentTab="admin"
          onNavigate={navigateTo}
          onOpenBooking={handleOpenBookingGeneral}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          settings={hospitalSettings}
        />
        <main className="flex-1">
          <AdminLoginPage
            onNavigateHome={() => navigateTo('home')}
            onNavigateDashboard={() => navigateTo('dashboard')}
            onLoginSuccess={() => navigateTo('admin')}
          />
        </main>
        <Footer
          onNavigate={navigateTo}
          onOpenBooking={handleOpenBookingGeneral}
          settings={hospitalSettings}
        />
        <AppointmentBookingModal
          isOpen={isBookingModalOpen}
          preselectedDoctor={selectedDoctorForBooking}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedDoctorForBooking(null);
          }}
          onBookingSuccess={handleBookingSuccess}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    );
  }

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
        onNavigate={navigateTo}
        onOpenBooking={handleOpenBookingGeneral}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        settings={hospitalSettings}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* TAB 1: HOME */}
        {currentTab === 'home' && (
          <div>
            <HeroSection
              onOpenBooking={handleOpenBookingGeneral}
              onExploreSchemes={() => navigateTo('schemes')}
            />
            <QuickAccessCards
              onNavigate={navigateTo}
              onOpenBooking={handleOpenBookingGeneral}
            />
            <FeaturedDoctors
              doctors={doctors}
              onSelectDoctor={handleOpenBookingWithDoctor}
              onViewAllDoctors={() => navigateTo('doctors')}
            />
            <SpecialitiesSection
              specialities={specialities}
              onSelectSpeciality={handleSpecialitySelect}
            />
            {/* PART B: Dedicated Laboratory & Blood Testing Services Card Section */}
            <LaboratoryCardSection
              onViewAllTests={() => navigateTo('laboratory')}
              onContactLab={() => navigateTo('contact')}
              settings={laboratorySettings}
            />
            <HowItWorks onOpenBooking={handleOpenBookingGeneral} />
            <SchemeHighlights
              schemes={schemes}
              onExploreSchemes={() => navigateTo('schemes')}
              onSelectScheme={handleSchemeSelect}
            />
            <HospitalFacilities />
            <ContactSection settings={hospitalSettings} />
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
              onViewAllDoctors={() => navigateTo('doctors')}
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

        {/* TAB 5: DEDICATED LABORATORY PAGE */}
        {currentTab === 'laboratory' && (
          <LaboratoryPage
            onOpenBooking={handleOpenBookingGeneral}
            onNavigateHome={() => navigateTo('home')}
          />
        )}

        {/* TAB 6: HOSPITAL FACILITIES */}
        {currentTab === 'facilities' && (
          <div className="py-10">
            <HospitalFacilities />
            <ContactSection settings={hospitalSettings} />
          </div>
        )}

        {/* TAB 7: CONTACT & MAP */}
        {currentTab === 'contact' && (
          <div className="py-10">
            <ContactSection settings={hospitalSettings} />
          </div>
        )}

        {/* TAB 8: PATIENT DASHBOARD */}
        {currentTab === 'dashboard' && (
          <PatientDashboard
            onOpenBooking={handleOpenBookingGeneral}
            schemes={schemes}
            doctors={doctors}
            onSelectScheme={handleSchemeSelect}
            onNavigate={(tab) => navigateTo(tab)}
          />
        )}

        {/* TAB 9: ADMIN DASHBOARD (Strict Server/Database-Enforced Protected Route) */}
        {currentTab === 'admin' && (
          <div>
            {authLoading ? (
              // Loading state: avoids flash of protected admin content
              <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-slate-50">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-4 animate-spin">
                  <Loader2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Verifying Administrator Authorization
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Checking database-enforced permissions...
                </p>
              </div>
            ) : !user ? (
              // Unauthenticated visitor is redirected to /admin/login by the useEffect, but show clean fallback
              <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-slate-50">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-700 mx-auto flex items-center justify-center">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Administrator Authentication Required
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Please sign in with your authorized hospital staff administrator credentials to access this section.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateTo('admin-login')}
                    className="w-full py-3 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Go to Administrator Login</span>
                  </button>
                </div>
              </div>
            ) : isAdmin ? (
              // Verified Administrator via database role
              <AdminDashboard />
            ) : (
              // Authenticated Patient or unauthorized account - strict rejection matching prompt specs
              <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50">
                <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-rose-200 shadow-2xl text-center space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center shadow-inner">
                    <ShieldAlert className="w-9 h-9" />
                  </div>
                  
                  <div>
                    <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
                      Restricted Access
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1">
                      Access Denied
                    </h3>
                  </div>

                  {/* Required exact message from user prompt */}
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-left">
                    <p className="text-xs font-semibold text-rose-900 leading-relaxed">
                      Access denied. This account is not authorized to access the administrator panel.
                    </p>
                    <p className="text-[11px] text-rose-700 mt-1.5">
                      Logged in as: <strong className="font-bold">{user.email}</strong>
                    </p>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Hospital administration requires elevated database privileges. Patients and non-administrative staff cannot view hospital operational data.
                  </p>

                  <div className="pt-2 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => navigateTo('dashboard')}
                      className="w-full py-3.5 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Go to Patient Dashboard</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateTo('home')}
                      className="w-full py-3 rounded-xl font-bold text-xs border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Home className="w-4 h-4 text-slate-500" />
                      <span>Return to Hospital Homepage</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        await logout();
                        navigateTo('admin-login');
                      }}
                      className="w-full py-2.5 rounded-xl font-semibold text-[11px] text-slate-500 hover:text-rose-600 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out / Switch Account</span>
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
        onNavigate={navigateTo}
        onOpenBooking={handleOpenBookingGeneral}
        settings={hospitalSettings}
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
