import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  Clock, 
  ShieldCheck, 
  Bell, 
  User, 
  Menu, 
  X, 
  Calendar, 
  LogOut, 
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
  Lock,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { Notification, HospitalSettings } from '../../types';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenBooking: () => void;
  onOpenAuth: () => void;
  settings?: HospitalSettings | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  onOpenBooking,
  onOpenAuth,
  settings,
}) => {
  const { user, role, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (user) {
      const list = await dataService.getNotifications(user.id, isAdmin);
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.is_read).length);
    } else {
      const list = await dataService.getNotifications(undefined, false);
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.is_read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    const handleNewNotif = () => fetchNotifications();
    window.addEventListener('new-hospital-notification', handleNewNotif);
    return () => {
      clearInterval(interval);
      window.removeEventListener('new-hospital-notification', handleNewNotif);
    };
  }, [user, isAdmin]);

  const handleMarkAllRead = async () => {
    await dataService.markAllNotificationsRead(user?.id, isAdmin);
    fetchNotifications();
  };

  const handleMarkOneRead = async (id: string) => {
    await dataService.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'doctors', label: 'Doctors & OPD' },
    { id: 'specialities', label: 'Specialities' },
    { id: 'laboratory', label: 'Laboratory & Tests' },
    { id: 'schemes', label: 'Govt Health Schemes' },
    { id: 'facilities', label: 'Hospital Facilities' },
    { id: 'contact', label: 'Contact & Map' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* 1. Top Bar: Emergency, OPD Timings, and Authorized Staff Gateway */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-4 sm:gap-6">
            <a 
              href={`tel:${settings?.emergency_helpline || '+91 22 2845 9999'}`} 
              className="flex items-center gap-1.5 font-semibold text-rose-400 hover:text-rose-300 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
              <span>24/7 Emergency: {settings?.emergency_helpline || '+91 22 2845 9999'}</span>
            </a>
            <div className="hidden md:flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>{settings?.operating_hours ? (settings.operating_hours.includes('OPD') ? settings.operating_hours : `OPD: ${settings.operating_hours}`) : 'OPD Timings: Mon - Sat 08:00 AM - 08:00 PM'}</span>
            </div>
            <div className="hidden lg:flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>NABH Accredited & Ayushman PM-JAY Empanelled</span>
            </div>
          </div>

          {/* Secure Admin Access Gateway Link */}
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all"
              >
                <LayoutDashboard className="w-3 h-3" />
                <span>Admin Console</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('admin-login')}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <Lock className="w-3 h-3 text-teal-400" />
                <span>Staff / Administrator Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Hospital Name */}
          <button 
            type="button"
            onClick={() => onNavigate('home')} 
            className="flex items-center gap-3 text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                <path d="M12 5v6"/>
                <path d="M9 8h6"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
                  SmartCare
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                  Portal
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 tracking-normal">
                {settings?.hospital_name || 'Shri Gajanan Multispeciality Hospital'}
              </p>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => onNavigate(link.id)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  currentTab === link.id
                    ? 'text-teal-700 bg-teal-50'
                    : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Action CTAs: Book Appointment, Notifications, Profile / Login */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="View Notifications"
                className="relative p-2.5 rounded-xl text-slate-600 hover:text-teal-600 hover:bg-slate-100 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Popover */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-teal-100 text-teal-700 font-semibold px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 my-2">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            if (!n.is_read) handleMarkOneRead(n.id);
                            if (isAdmin && (n.type === 'appointment_request' || n.type === 'reschedule_request' || n.type === 'appointment_cancelled' || n.type === 'general')) {
                              onNavigate('admin');
                              setNotificationsOpen(false);
                            }
                          }}
                          className={`py-3 px-2 rounded-xl flex gap-3 text-left transition-colors cursor-pointer hover:bg-slate-50 ${!n.is_read ? 'bg-teal-50/60 font-medium' : ''}`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {n.type === 'appointment_approved' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : n.type === 'appointment_rejected' || n.type === 'appointment_cancelled' ? (
                              <AlertCircle className="w-4 h-4 text-rose-500" />
                            ) : n.type === 'general' ? (
                              <MessageSquare className="w-4 h-4 text-teal-600" />
                            ) : (
                              <Bell className="w-4 h-4 text-teal-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                              {!n.is_read && (
                                <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Dashboard / Auth Trigger */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate(isAdmin ? 'admin' : 'dashboard')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    currentTab === 'dashboard' || currentTab === 'admin'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-teal-500 hover:text-teal-600'
                  }`}
                >
                  {isAdmin ? (
                    <LayoutDashboard className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span>{isAdmin ? 'Admin Portal' : 'My Dashboard'}</span>
                </button>

                <button
                  type="button"
                  onClick={logout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-teal-700 hover:bg-slate-100 transition-colors"
              >
                Sign In
              </button>
            )}

            {/* Book Appointment CTA Button */}
            <button
              type="button"
              onClick={onOpenBooking}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 active:scale-95 transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div>

          {/* Mobile Menu Button & Notification Bell */}
          <div className="flex sm:hidden items-center gap-1.5">
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label="View Notifications"
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onOpenBooking}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white"
            >
              Book
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => {
                onNavigate(link.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold ${
                currentTab === link.id
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate(isAdmin ? 'admin' : 'dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold bg-teal-50 text-teal-700 flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{isAdmin ? 'Admin Portal' : 'Patient Dashboard'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-rose-600 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center px-4 py-2.5 rounded-xl font-bold text-slate-700 border border-slate-200"
                >
                  Patient Sign In / Register
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('admin-login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center px-4 py-2.5 rounded-xl font-bold text-slate-900 bg-slate-100 hover:bg-slate-200"
                >
                  Administrator Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
