import React from 'react';
import { Sparkles, ExternalLink, Calendar, User, Compass, Bookmark } from 'lucide-react';

export default function RecommendationCard({ recommendations = [] }) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-subtle">
        <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-700">No related literature found</h3>
        <p className="text-xs text-slate-500 mt-1">
          Recommendations will appear as the agent maps key themes to arXiv and CrossRef.
        </p>
      </div>
    );
  }

  // Sort by similarity score descending
  const sortedRecs = [...recommendations].sort(
    (a, b) => (b.similarity_score || 0) - (a.similarity_score || 0)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Related Literature & Preprints</h2>
            <p className="text-xs text-slate-500">
              Real-time semantic recommendations discovered across arXiv & CrossRef ({sortedRecs.length} matches)
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          Ranked by Semantic Match
        </span>
      </div>

      {/* Grid of Recommendation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedRecs.map((rec, idx) => {
          const matchPercent = Math.round((rec.similarity_score || 0.75) * 100);
          const linkUrl = rec.url || (rec.doi ? `https://doi.org/${rec.doi}` : null);

          return (
            <div
              key={rec.id || idx}
              className="p-5 rounded-xl border border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-card transition-all duration-200 flex flex-col justify-between group space-y-3"
            >
              <div className="space-y-2">
                {/* Source & Score Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {rec.source || 'Academic'}
                  </span>

                  <div
                    className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70"
                    title="Computed from semantic and technical similarity signals. This is not probability or accuracy."
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>{rec.similarity_label || `Semantic relevance: ${rec.semantic_relevance || Math.round((rec.similarity_score || 0.75) * 100)}`}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
                  {rec.title}
                </h3>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  {rec.authors && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-[200px]">{rec.authors}</span>
                    </span>
                  )}
                  {rec.year && (
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{rec.year}</span>
                    </span>
                  )}
                </div>

                {/* Matched Topics */}
                {rec.matched_topics && rec.matched_topics.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Matched:</span>
                    {rec.matched_topics.map((topic, tidx) => (
                      <span
                        key={tidx}
                        className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2 py-0.5 rounded-md"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}

                {/* Abstract or Rationale */}
                {rec.rationale && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100/80 italic">
                    "{rec.rationale}"
                  </div>
                )}

                {rec.abstract && (
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {rec.abstract}
                  </p>
                )}
              </div>

              {/* Action Button */}
              {linkUrl && (
                <div className="pt-2 border-t border-slate-100">
                  <a
                    href={linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold border border-slate-200 hover:border-emerald-200 transition-all"
                  >
                    <span>Inspect Paper</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
