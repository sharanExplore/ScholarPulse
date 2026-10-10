import React from 'react';
import { BookOpen, UploadCloud, Search, ArrowRight } from 'lucide-react';

export default function EmptyState({
  title = "No research papers yet",
  description = "Upload your first academic paper to initiate multi-agent summarization, keyword extraction, and citation intelligence.",
  actionLabel = "Upload Paper",
  onAction,
  icon: Icon = BookOpen,
  secondaryAction
}) {
  return (
    <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-slate-300 shadow-subtle flex flex-col items-center justify-center max-w-xl mx-auto my-8">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
        <Icon className="w-8 h-8" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-2">
        {title}
      </h3>

      <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      <div className="flex items-center gap-3">
        {onAction && (
          <button
            onClick={onAction}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all duration-200 hover:-translate-y-0.5"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{actionLabel}</span>
          </button>
        )}

        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm font-medium border border-slate-200 transition-colors"
          >
            <span>{secondaryAction.label}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
