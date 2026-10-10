import React from 'react';
import {
  FileText,
  Calendar,
  User,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  ChevronRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function PaperCard({
  paper,
  onView,
  onDelete,
  onReanalyze
}) {
  const {
    id,
    filename,
    title,
    authors,
    uploaded_at,
    status = 'completed',
    page_count = 0,
    word_count = 0,
    reference_count = 0,
    error_message
  } = paper;

  const displayTitle = title || filename || 'Untitled Academic Paper';
  const displayAuthors = Array.isArray(authors)
    ? authors.join(', ')
    : typeof authors === 'string'
    ? authors
    : 'Unknown Authors';

  const formattedDate = uploaded_at
    ? new Date(uploaded_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Recently';

  const statusStyles = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    pending: 'bg-amber-50 text-amber-700 border-amber-200/80',
    failed: 'bg-rose-50 text-rose-700 border-rose-200/80',
  };

  const statusIcons = {
    completed: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    pending: <Clock className="w-3.5 h-3.5 text-amber-600" />,
    failed: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle hover:shadow-card hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between group space-y-4">
      <div className="space-y-3">
        {/* Top bar: Status & Type */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {paper.document_type || 'Academic PDF'}
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              statusStyles[status] || statusStyles.completed
            }`}
          >
            {statusIcons[status] || statusIcons.completed}
            <span className="capitalize">{status}</span>
          </div>
        </div>

        {/* Paper Title */}
        <h3
          onClick={() => onView(id)}
          className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 cursor-pointer leading-snug"
        >
          {displayTitle}
        </h3>

        {/* Authors */}
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{displayAuthors}</span>
        </div>

        {/* Meta Stats Row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{formattedDate}</span>
          </span>

          {page_count > 0 && (
            <span>• {page_count} pages</span>
          )}

          <span className="flex items-center gap-1 text-indigo-600 font-semibold">
            <BookOpen className="w-3 h-3" />
            <span>{reference_count || 0} refs</span>
          </span>
        </div>

        {error_message && (
          <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
            {error_message}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        {onDelete && (
          <button
            onClick={() => onDelete(id, displayTitle)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete paper"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => onView(id)}
          className="flex-1 ml-2 flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-xs font-semibold border border-indigo-200/60 hover:border-transparent transition-all duration-200"
        >
          <span>View Analysis</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
