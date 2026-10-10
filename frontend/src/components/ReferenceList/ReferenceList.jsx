import React, { useState } from 'react';
import { BookOpen, Search, ExternalLink, Calendar, User, Quote, Filter } from 'lucide-react';

export default function ReferenceList({ references = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [minYear, setMinYear] = useState('ALL');

  if (!references || references.length === 0) {
    return (
      <div className="p-10 text-center bg-white rounded-2xl border border-slate-200/80 shadow-subtle space-y-2">
        <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-800">No Formal Bibliography Detected</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          This document does not contain an academic bibliography, references section, or peer-reviewed literature citations.
        </p>
      </div>
    );
  }

  // Filter logic
  const filteredReferences = references.filter((ref) => {
    const textToMatch = `${ref.title || ''} ${ref.authors || ''} ${ref.venue || ''}`.toLowerCase();
    const matchesSearch = textToMatch.includes(searchQuery.toLowerCase());
    const matchesYear =
      minYear === 'ALL' ||
      (minYear === 'recent' && ref.year && ref.year >= 2020) ||
      (minYear === 'older' && ref.year && ref.year < 2015);
    return matchesSearch && matchesYear;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Bibliography & References</h2>
            <p className="text-xs text-slate-500">
              Resolved citations mapped with in-text citation frequency ({references.length} entries)
            </p>
          </div>
        </div>

        {/* Year Filter */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={() => setMinYear('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              minYear === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Years
          </button>
          <button
            onClick={() => setMinYear('recent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              minYear === 'recent' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Recent (≥ 2020)
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by title, authors, or publication venue..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
        />
      </div>

      {/* References List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {filteredReferences.map((ref, idx) => {
          const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(ref.title || ref.raw_text || '')}`;
          const doiUrl = ref.doi ? `https://doi.org/${ref.doi}` : null;

          return (
            <div
              key={ref.id || idx}
              className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-subtle transition-all duration-200 space-y-2 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                    [{ref.ref_index || idx + 1}]
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                      {ref.title || ref.raw_text}
                    </h3>
                  </div>
                </div>

                {/* In-text citation badge */}
                {((ref.in_text_mention_count || ref.citation_count_in_paper) || 0) > 0 && (
                  <span
                    className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                    title={`Referenced ${ref.in_text_mention_count || ref.citation_count_in_paper} time(s) in document text`}
                  >
                    <Quote className="w-3 h-3 text-indigo-500" />
                    <span>In-text citation mentions: {ref.in_text_mention_count || ref.citation_count_in_paper}</span>
                  </span>
                )}
              </div>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 pt-1">
                {ref.authors && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span className="font-medium text-slate-700 truncate max-w-xs">{ref.authors}</span>
                  </span>
                )}

                {ref.year && (
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{ref.year}</span>
                  </span>
                )}

                {ref.venue && (
                  <span className="italic text-slate-500 truncate max-w-xs">
                    {ref.venue}
                  </span>
                )}
              </div>

              {/* Action Links */}
              <div className="flex items-center gap-3 pt-2 text-[11px]">
                {doiUrl && (
                  <a
                    href={doiUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                  >
                    <span>DOI: {ref.doi}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <a
                  href={scholarUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 hover:underline"
                >
                  <span>Google Scholar</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}

        {filteredReferences.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400">
            No references match your current filters.
          </div>
        )}
      </div>
    </div>
  );
}
