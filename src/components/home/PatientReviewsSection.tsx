import React, { useState, useEffect } from 'react';
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles,
  Quote,
  Stethoscope,
  Plus
} from 'lucide-react';
import { PatientReview } from '../../types';
import { dataService } from '../../services/dataService';
import { formatDate } from '../../lib/utils';

interface PatientReviewsSectionProps {
  onOpenReviewModal: () => void;
}

export const PatientReviewsSection: React.FC<PatientReviewsSectionProps> = ({
  onOpenReviewModal,
}) => {
  const [reviews, setReviews] = useState<PatientReview[]>([]);
  const [stats, setStats] = useState<{ total_approved_reviews: number; average_rating: number }>({
    total_approved_reviews: 0,
    average_rating: 5.0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  const loadReviewsData = async () => {
    try {
      const [revs, st] = await Promise.all([
        dataService.getPublicReviews(),
        dataService.getPublicReviewStats(),
      ]);
      setReviews(revs);
      setStats(st);
    } catch (err) {
      console.warn('Could not load public reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewsData();

    const handleReviewsUpdated = () => {
      loadReviewsData();
    };

    window.addEventListener('reviews-updated', handleReviewsUpdated);
    return () => window.removeEventListener('reviews-updated', handleReviewsUpdated);
  }, []);

  return (
    <section id="reviews-section" className="py-20 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Authentic Patient Recovery & Experiences</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Patient Feedback & Reviews
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-xl">
              Read authentic feedback from patients treated by our specialist doctors at Shri Gajanan Hospital.
            </p>
          </div>

          {/* Stats Summary & Call to Action Button */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-3 pr-4 border-r border-slate-200">
              <div className="text-3xl font-black text-slate-900 leading-none">
                {stats.average_rating ? stats.average_rating.toFixed(1) : '5.0'}
              </div>
              <div>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">
                  {stats.total_approved_reviews} Approved {stats.total_approved_reviews === 1 ? 'Review' : 'Reviews'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenReviewModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Share Your Feedback</span>
            </button>
          </div>
        </div>

        {/* Reviews Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-3xl bg-slate-50 border border-slate-200/70 animate-pulse h-56" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-slate-50 border border-slate-200/80 p-8">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 mx-auto flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Patient Reviews Published Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Have you consulted with our doctors? Be the first to share your experience with our care team.
            </p>
            <button
              type="button"
              onClick={onOpenReviewModal}
              className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700"
            >
              Write First Review
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative group"
              >
                <div>
                  {/* Doctor Info Pill */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {rev.doctor_photo ? (
                        <img
                          src={rev.doctor_photo}
                          alt={rev.doctor_name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                          <Stethoscope className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block truncate">
                          {rev.speciality_name || 'Medical Specialist'}
                        </span>
                        <p className="text-xs font-extrabold text-slate-800 truncate">
                          {rev.doctor_name}
                        </p>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Review Title */}
                  {rev.review_title && (
                    <h4 className="text-sm font-extrabold text-slate-900 mb-2 leading-snug line-clamp-1">
                      "{rev.review_title}"
                    </h4>
                  )}

                  {/* Review Message */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                    {rev.review_message}
                  </p>
                </div>

                {/* Footer: Patient Info & Date */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      {(rev.patient_display_name || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px] leading-tight">
                        {rev.patient_display_name || 'Verified Patient'}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Verified Consultation
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400">
                    {formatDate(rev.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

