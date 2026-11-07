import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Calendar, 
  Stethoscope, 
  Clock, 
  Microscope, 
  ShieldCheck, 
  MapPin, 
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { api } from '../../services/apiClient';

interface Message {
  id: string;
  sender: 'ai' | 'patient';
  text: string;
  timestamp: string;
  isActionable?: boolean;
}

interface SmartCareAIChatProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking: () => void;
  onNavigate: (tab: string) => void;
}

const SUGGESTED_QUESTIONS = [
  { label: 'Find a Doctor', icon: Stethoscope },
  { label: 'Book an Appointment', icon: Calendar },
  { label: 'Hospital Timings', icon: Clock },
  { label: 'Laboratory Tests', icon: Microscope },
  { label: 'Health Schemes', icon: ShieldCheck },
  { label: 'Hospital Location', icon: MapPin },
];

export const SmartCareAIChat: React.FC<SmartCareAIChatProps> = ({
  isOpen,
  onClose,
  onOpenBooking,
  onNavigate,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: "Hello! 👋 Welcome to SmartCare Hospital. I'm your AI Assistant. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat when new messages appear
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMessageId = `patient-${Date.now()}`;
    const newMsg: Message = {
      id: userMessageId,
      sender: 'patient',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      // Send conversation to secure backend Express API
      const res = await api.post<{ reply: string; isFallback?: boolean; configured?: boolean }>('/chat', {
        message: text,
        history: messages.slice(-6).map((m) => ({
          sender: m.sender,
          text: m.text,
        })),
      });

      const aiReply = res?.reply || "I'm sorry, I couldn't process your request right now. Please try again or call our hospital desk at +91 22 2845 6789.";

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      console.warn('[SmartCare AI Chat Error]:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: "I'm having trouble connecting to the hospital assistant right now. You can reach our 24/7 helpdesk directly at +91 22 2845 6789 or use the portal menus to book appointments and view doctors.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-msg-reset',
        sender: 'ai',
        text: "Hello! 👋 Welcome to SmartCare Hospital. I'm your AI Assistant. How can I help you today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-22 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-24 w-auto sm:w-[410px] h-[550px] max-h-[82vh] z-50 rounded-3xl shadow-2xl bg-white border border-teal-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-sky-900 text-white px-5 py-3.5 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-teal-200" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-teal-800 rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm tracking-tight text-white">SmartCare AI Assistant</h3>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-400/20 text-emerald-300 text-[9px] font-bold tracking-wide uppercase">Online</span>
            </div>
            <p className="text-[11px] text-teal-200/90 font-medium">Shri Gajanan Hospital 24/7 Clinical Guide</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleResetChat}
            title="Reset Conversation"
            className="p-1.5 rounded-xl text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Chat"
            className="p-1.5 rounded-xl text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message History Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70 scrollbar-thin">
        {messages.map((m) => {
          const isAI = m.sender === 'ai';
          const lowerText = m.text.toLowerCase();
          const suggestsBooking = isAI && (lowerText.includes('book an appointment') || lowerText.includes('click "book an appointment"') || lowerText.includes('schedule an opd slot'));
          const suggestsDoctors = isAI && (lowerText.includes('doctor directory') || lowerText.includes('view doctors') || lowerText.includes('specialist consultants'));
          const suggestsSchemes = isAI && (lowerText.includes('ayushman bharat') || lowerText.includes('mjpjay') || lowerText.includes('health schemes'));
          const suggestsLab = isAI && (lowerText.includes('diagnostic laboratory') || lowerText.includes('lab tests') || lowerText.includes('blood test'));

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs whitespace-pre-line ${
                  isAI
                    ? 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                    : 'bg-teal-600 text-white rounded-tr-xs font-medium'
                }`}
              >
                {m.text}
              </div>

              {/* Action shortcuts contextual to the AI's reply */}
              {isAI && (suggestsBooking || suggestsDoctors || suggestsSchemes || suggestsLab) && (
                <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
                  {suggestsBooking && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenBooking();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] shadow-xs active:scale-95 transition-all"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book Appointment Now</span>
                    </button>
                  )}
                  {suggestsDoctors && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigate('doctors');
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] border border-slate-300 active:scale-95 transition-all"
                    >
                      <Stethoscope className="w-3 h-3 text-teal-600" />
                      <span>View Doctors</span>
                    </button>
                  )}
                  {suggestsSchemes && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigate('schemes');
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200 active:scale-95 transition-all"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Health Schemes</span>
                    </button>
                  )}
                  {suggestsLab && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigate('laboratory');
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-[10px] border border-sky-200 active:scale-95 transition-all"
                    >
                      <Microscope className="w-3 h-3 text-sky-600" />
                      <span>Lab Services</span>
                    </button>
                  )}
                </div>
              )}

              <span className="text-[9px] text-slate-400 mt-1 px-1">
                {m.timestamp}
              </span>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Grid */}
      <div className="px-3.5 py-2.5 bg-white border-t border-slate-100 shrink-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-teal-500" />
          <span>Suggested Topics:</span>
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {SUGGESTED_QUESTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleSendMessage(item.label)}
                disabled={isLoading}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 text-slate-700 border border-slate-200/80 shrink-0 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Icon className="w-3 h-3 text-teal-600" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Message Input Form */}
      <div className="p-3 bg-white border-t border-slate-200/80 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about doctors, timings, schemes, lab..."
            disabled={isLoading}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden disabled:bg-slate-50 transition-all placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-9 h-9 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-600/20 active:scale-95 transition-all cursor-pointer"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Safety Disclaimer Footer */}
        <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-slate-400">
          <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
          <span>Informational assistant • Not professional medical advice</span>
        </div>
      </div>

    </div>
  );
};

