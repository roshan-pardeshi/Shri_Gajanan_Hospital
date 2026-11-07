import React from 'react';
import { Calendar, Phone } from 'lucide-react';
import hospitalBanner from '../../assets/images/hospital-banner.png';

interface HeroSectionProps {
  onOpenBooking: () => void;
  onExploreSchemes?: () => void;
  onNavigateContact?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenBooking,
  onNavigateContact,
}) => {
  const handleContactClick = () => {
    const contactEl = document.getElementById('contact-section');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
    } else if (onNavigateContact) {
      onNavigateContact();
    } else {
      // Fallback: look for contact form or scroll to bottom
      const formEl = document.querySelector('form');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="relative w-full bg-slate-950 overflow-hidden">
      {/* Main Banner Container - Aspect ratio matched to 1672x851 (top duplicate navbar clipped off) */}
      <div
        className="relative w-full overflow-hidden select-none bg-slate-900"
        style={{ aspectRatio: '1672 / 851' }}
      >
        {/* Banner image shifted up by 10.57% to cleanly eliminate the baked-in duplicate navigation bar */}
        <img
          src={hospitalBanner}
          alt="Shri Gajanan Hospital - Compassionate Care, Advanced Treatment"
          className="absolute left-0 w-full max-w-none pointer-events-none select-none"
          style={{
            top: '-10.57%',
            height: '110.57%',
            width: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Interactive Clickable Hotspots mapped directly over the artwork buttons */}
        <div className="absolute inset-0 z-10 pointer-events-auto">
          {/* Book Appointment Action Button */}
          <button
            type="button"
            onClick={onOpenBooking}
            aria-label="Book Appointment"
            title="Book an Appointment"
            className="absolute rounded-full cursor-pointer transition-all duration-150 hover:bg-white/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/80"
            style={{
              left: '7.5%',
              top: '66.0%',
              width: '18.8%',
              height: '7.0%',
            }}
          />

          {/* Contact Us Action Button */}
          <button
            type="button"
            onClick={handleContactClick}
            aria-label="Contact Us"
            title="Contact Us - Patient Helpdesk & Hospital Location"
            className="absolute rounded-full cursor-pointer transition-all duration-150 hover:bg-white/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/80"
            style={{
              left: '27.9%',
              top: '66.0%',
              width: '12.9%',
              height: '7.0%',
            }}
          />
        </div>
      </div>

      {/* Mobile-Friendly Accessible Quick-Action Bar */}
      {/* On mobile screens, guarantees clear, touch-friendly 44px+ tap targets for patient convenience */}
      <div className="sm:hidden px-4 py-3 bg-white border-b border-slate-200 shadow-xs flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenBooking}
          className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white flex items-center justify-center gap-2 shadow-md shadow-rose-500/25 active:scale-95 transition-all"
        >
          <Calendar className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>

        <button
          type="button"
          onClick={handleContactClick}
          className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
        >
          <Phone className="w-4 h-4" />
          <span>Contact Us</span>
        </button>
      </div>
    </section>
  );
};
