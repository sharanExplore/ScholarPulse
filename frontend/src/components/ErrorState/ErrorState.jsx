import React from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, ExternalLink } from 'lucide-react';

export default function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred while communicating with the ScholarPulse pipeline.",
  onRetry,
  onBack,
  technicalDetails
}) {
  return (
    <div className="p-8 sm:p-12 text-center rounded-2xl bg-white border border-rose-200/80 shadow-card max-w-lg mx-auto my-8">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-4 mx-auto shadow-sm">
        <AlertCircle className="w-7 h-7" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-2">
        {title}
      </h3>

      <p className="text-sm text-slate-600 mb-6 leading-relaxed">
        {message}
      </p>

      {technicalDetails && (
        <div className="mb-6 text-left p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono overflow-x-auto max-h-32">
          {technicalDetails}
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm font-medium border border-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        )}

        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all duration-200 hover:-translate-y-0.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    </div>
  );
}
