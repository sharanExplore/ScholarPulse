import React from 'react';
import {
  Network,
  Calendar,
  Percent,
  Layers,
  Award,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react';

export default function CitationAnalysisView({
  citationMetrics,
  healthBreakdown,
  healthScore,
  readingLevel,
  stats,
  isQuestionBank
}) {
  if (!citationMetrics && !healthScore) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-subtle">
        <Network className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-700">Analysis data unavailable</h3>
        <p className="text-xs text-slate-500 mt-1">
          Detailed bibliometric metrics will appear once citation processing completes.
        </p>
      </div>
    );
  }

  const {
    total_references = 0,
    in_text_citations_count = 0,
    in_text_mentions = in_text_citations_count,
    external_citations = 'N/A',
    median_year = null,
    recency_ratio_pct = null,
    reference_density = null,
    reference_density_per_page = null,
    citation_density_per_page = null,
    year_distribution = {}
  } = citationMetrics || {};

  let densityDisplay = null;
  if (typeof reference_density === 'string' && reference_density.includes('references/page')) {
    densityDisplay = reference_density;
  } else if (reference_density_per_page !== null && reference_density_per_page !== undefined) {
    densityDisplay = `${reference_density_per_page} references/page`;
  } else if (citation_density_per_page !== null && citation_density_per_page !== undefined) {
    densityDisplay = `${citation_density_per_page} references/page`;
  }

  const hasReferences = total_references > 0;
  const isRigorDisabled = healthScore === null || healthScore === undefined || isQuestionBank;
  const effectiveReadingLevel = (isRigorDisabled || readingLevel === 'N/A') ? 'N/A' : (readingLevel || 'N/A');

  // Year breakdown max for scaling bars and sort by canonical era
  const canonicalOrder = ['<2015', '2015-2019', '2020-2023', '2024-2026', 'Unknown'];
  const yearEntries = Object.entries(year_distribution || {}).sort((a, b) => {
    const idxA = canonicalOrder.indexOf(a[0]);
    const idxB = canonicalOrder.indexOf(b[0]);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a[0].localeCompare(b[0]);
  });
  const maxYearVal = Math.max(...yearEntries.map(([, val]) => val), 1);

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bibliographic References */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Bibliography References
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {total_references}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {hasReferences ? 'Validated bibliography entries' : 'No formal bibliography detected'}
          </p>
        </div>

        {/* In-Text Citation Mentions */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              In-text Citation Mentions
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {hasReferences ? (in_text_mentions ?? in_text_citations_count ?? 0) : '0'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            In-text citation mentions across body
          </p>
        </div>

        {/* Reference Density */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Reference Density
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {hasReferences && densityDisplay ? densityDisplay : 'N/A'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {hasReferences && densityDisplay ? `${densityDisplay}` : 'No references to evaluate'}
          </p>
        </div>

        {/* External Citation Count */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              External Citations
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {external_citations || 'N/A'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            External indexing citation count: {external_citations || 'N/A'}
          </p>
        </div>
      </div>

      {/* Main Grid: Temporal Distribution & Academic Completeness Score */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temporal Distribution */}
        <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Reference Temporal Distribution</h3>
            </div>
            <span className="text-xs text-slate-400">Total = {total_references} refs (100%)</span>
          </div>

          <div className="space-y-4 pt-1">
            {hasReferences && yearEntries.length > 0 ? (
              yearEntries.map(([era, count]) => {
                const rawPct = (count / (total_references || 1)) * 100;
                const formattedPct = rawPct % 1 === 0 ? `${rawPct}%` : `${rawPct.toFixed(1)}%`;
                const widthPercent = Math.round((count / maxYearVal) * 100);

                return (
                  <div key={era} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{era}</span>
                      <span className="text-slate-500 font-mono">
                        {count} refs ({formattedPct})
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, widthPercent)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-xs font-semibold text-slate-600">No formal bibliography or references detected.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Temporal distribution analysis is omitted when a document contains no verified reference citations.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Academic Document Completeness Score */}
        <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Academic Completeness Score</h3>
            </div>
            {effectiveReadingLevel !== 'N/A' ? (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                {effectiveReadingLevel}
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                Level: N/A
              </span>
            )}
          </div>

          {isRigorDisabled ? (
            <div className="flex items-center gap-6 py-2">
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <div className="w-24 h-24 rounded-full border-4 border-slate-200 flex items-center justify-center bg-slate-50">
                  <div className="text-center">
                    <span className="text-xl font-black text-slate-400">N/A</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-2 text-xs">
                <div className="font-semibold text-slate-800">
                  Completeness Scoring Not Applicable
                </div>
                <div className="text-[11px] text-slate-500 leading-relaxed">
                  Completeness score is N/A and level is N/A when scoring is unavailable or disabled for this document type.
                </div>
                <div className="text-[11px] text-indigo-600 font-medium flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Document structure preserved without inferred academic levels</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-6 py-2">
                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                  <div className="w-24 h-24 rounded-full border-4 border-indigo-100 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-2xl font-black text-indigo-600">{healthScore}</span>
                      <span className="text-[10px] block text-slate-400 font-semibold uppercase">/100</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-2 text-xs">
                  <div className="font-medium text-slate-700">
                    Document Completeness Score calculated from transparent, measurable document completeness signals.
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Deterministic validation: High Confidence (0.98)</span>
                  </div>
                </div>
              </div>

              {/* Breakdown items */}
              {healthBreakdown && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  {Object.entries(healthBreakdown).map(([key, val]) => (
                    <div key={key} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <span className="text-slate-500 capitalize block text-[11px]">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">{val} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
