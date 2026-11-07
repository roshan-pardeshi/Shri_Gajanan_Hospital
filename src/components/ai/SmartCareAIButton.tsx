import React from 'react';
import { Bot, Sparkles, X } from 'lucide-react';

interface SmartCareAIButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export const SmartCareAIButton: React.FC<SmartCareAIButtonProps> = ({ isOpen, onClick }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center group">
      {/* Desktop Hover Tooltip */}
      <div className="hidden sm:flex items-center gap-1.5 absolute right-16 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-bold shadow-xl border border-slate-700/60 pointer-events-none opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap backdrop-blur-xs">
        <Sparkles className="w-3.5 h-3.5 text-teal-300 animate-pulse" />
        <span>Ask SmartCare AI</span>
      </div>

      {/* Main Floating Button */}
      <button
        type="button"
        onClick={onClick}
        aria-label={isOpen ? 'Close SmartCare AI Assistant' : 'Open SmartCare AI Assistant'}
        title="SmartCare 24/7 AI Hospital Assistant"
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 via-teal-600 to-teal-800 text-white shadow-xl shadow-teal-700/35 hover:shadow-2xl hover:shadow-teal-600/50 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer focus:outline-hidden focus:ring-4 focus:ring-teal-400/40"
      >
        {/* Gentle Pulse Glow Ring */}
        <span className="absolute -inset-1 rounded-full bg-teal-400/30 animate-pulse pointer-events-none" />

        {/* Small Green Online Status Indicator */}
        <span 
          className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-xs" 
          title="AI Assistant Online"
        />

        {/* Icon Transition */}
        {isOpen ? (
          <X className="w-6 h-6 text-white transition-transform duration-200 rotate-0 hover:rotate-90" />
        ) : (
          <div className="relative">
            <Bot className="w-6 h-6 text-white" />
            <Sparkles className="w-3 h-3 text-teal-200 absolute -top-1 -right-1" />
          </div>
        )}
      </button>
    </div>
  );
};

