import React, { useState, useEffect } from 'react';
import {
  Network,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Award,
  Search,
  Loader2
} from 'lucide-react';
import CitationAnalysisView from '../components/CitationAnalysis/CitationAnalysisView';
import EmptyState from '../components/EmptyState/EmptyState';
import { api } from '../services/api';

export default function CitationIntelligence({
  papers = [],
  onViewPaper,
  onNavigate
}) {
  const [selectedPaperId, setSelectedPaperId] = useState(
    papers.length > 0 ? papers[0].id : null
  );
  const [paperDetails, setPaperDetails] = useState(null);
  const [loadingPaper, setLoadingPaper] = useState(false);

  const selectedPaper = papers.find((p) => p.id === selectedPaperId) || papers[0];

  // Sync selectedPaperId if initial papers array loaded asynchronously
  useEffect(() => {
    if (!selectedPaperId && papers.length > 0) {
      setSelectedPaperId(papers[0].id);
    }
  }, [papers, selectedPaperId]);

  // Fetch canonical paper dossier on paper selection
  useEffect(() => {
    if (!selectedPaperId) {
      setPaperDetails(null);
      return;
    }

    let isMounted = true;
    setLoadingPaper(true);

    api.getPaper(selectedPaperId)
      .then((data) => {
        if (isMounted) {
          setPaperDetails(data);
          setLoadingPaper(false);
        }
      })
      .catch((err) => {
        console.warn('Notice fetching full dossier in citation intelligence:', err);
        if (isMounted) setLoadingPaper(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedPaperId]);

  // Aggregate repository bibliometrics
  const totalReferences = papers.reduce((sum, p) => sum + (p.reference_count || 0), 0);
  const avgReferences = papers.length > 0 ? Math.round(totalReferences / papers.length) : 0;

  if (papers.length === 0) {
    return (
      <EmptyState
        title="No citation intelligence available"
        description="Upload an academic paper to extract and evaluate bibliography references and temporal publication patterns."
        actionLabel="Upload First Paper"
        onAction={() => onNavigate('upload')}
        icon={Network}
      />
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Citation Intelligence & Bibliometrics
          </h1>
          <p className="text-xs text-slate-500">
            Automated reference extraction, temporal distribution analysis, and in-text frequency mapping
          </p>
        </div>

        {/* Paper selector dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Selected Paper:
          </label>
          <select
            value={selectedPaperId || ''}
            onChange={(e) => setSelectedPaperId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 shadow-subtle focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-xs truncate"
          >
            {papers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title || p.filename}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Aggregate Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Repository Total References
          </span>
          <span className="text-2xl font-black text-slate-900">{totalReferences}</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Across {papers.length} analyzed papers</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Avg References / Paper
          </span>
          <span className="text-2xl font-black text-slate-900">{avgReferences}</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Bibliography depth benchmark</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Analysis Method
          </span>
          <span className="text-lg font-bold text-indigo-600">Deterministic In-Text Parser</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Regex pattern matching & cross-referencing</p>
        </div>
      </div>

      {/* Selected Paper Citation View */}
      {selectedPaper && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
            <div className="min-w-0 pr-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">
                Inspecting Document
              </span>
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {selectedPaper.title || selectedPaper.filename}
              </h3>
            </div>
            <button
              onClick={() => onViewPaper(selectedPaper.id)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <span>Full Dossier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loadingPaper && !paperDetails ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-subtle flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
              <p className="text-xs font-semibold text-slate-600">Loading canonical bibliometrics...</p>
            </div>
          ) : (() => {
            const activePaper = paperDetails || selectedPaper;
            const docMeta = activePaper.metadata || activePaper;
            const isQuestionBank = (
              docMeta.document_type === 'Academic Question Bank' ||
              activePaper.document_type === 'Academic Question Bank' ||
              (docMeta.title && docMeta.title.toLowerCase().includes('question bank'))
            );

            const dashboard = activePaper.dashboard || {};
            const refs = activePaper.validated_references || activePaper.references || [];
            const refCount = refs.length > 0 ? refs.length : (activePaper.reference_count ?? 0);
            const hasRefs = refCount > 0;
            const pageCount = Math.max(1, activePaper.page_count || (activePaper.document && activePaper.document.page_count) || 1);

            // In-text citation mentions count from canonical reference collection
            const inTextMentions = refs.reduce(
              (acc, r) => acc + (r.in_text_mention_count || r.citation_count_in_paper || 0),
              0
            );

            // Compute canonical year distribution if not already computed
            let computedYearDist = {};
            if (activePaper.citation_metrics?.year_distribution && Object.keys(activePaper.citation_metrics.year_distribution).length > 0) {
              computedYearDist = activePaper.citation_metrics.year_distribution;
            } else if (hasRefs) {
              const buckets = { '<2015': 0, '2015-2019': 0, '2020-2023': 0, '2024-2026': 0, 'Unknown': 0 };
              for (const r of refs) {
                const yr = parseInt(r.year, 10);
                if (!yr || isNaN(yr)) {
                  buckets['Unknown'] += 1;
                } else if (yr < 2015) {
                  buckets['<2015'] += 1;
                } else if (yr <= 2019) {
                  buckets['2015-2019'] += 1;
                } else if (yr <= 2023) {
                  buckets['2020-2023'] += 1;
                } else {
                  buckets['2024-2026'] += 1;
                }
              }
              computedYearDist = buckets;
            }

            const densityVal = refCount > 0 ? (refCount / pageCount).toFixed(2) : null;
            const densityStr = refCount > 0 ? `${densityVal} references/page` : 'N/A';

            // Use canonical citation_metrics from backend or synthesize accurate structure from canonical references
            const citationMetrics = {
              total_references: (activePaper.citation_metrics && activePaper.citation_metrics.total_references !== undefined && activePaper.citation_metrics.total_references > 0)
                ? activePaper.citation_metrics.total_references
                : refCount,
              in_text_citations_count: (activePaper.citation_metrics?.in_text_citations_count && activePaper.citation_metrics.in_text_citations_count > 0)
                ? activePaper.citation_metrics.in_text_citations_count
                : inTextMentions,
              in_text_mentions: (activePaper.citation_metrics?.in_text_mentions && activePaper.citation_metrics.in_text_mentions > 0)
                ? activePaper.citation_metrics.in_text_mentions
                : inTextMentions,
              external_citations: activePaper.citation_metrics?.external_citations || 'N/A',
              median_year: activePaper.citation_metrics?.median_year || activePaper.median_reference_year || dashboard.stats?.median_reference_year || null,
              recency_ratio_pct: activePaper.citation_metrics?.recency_ratio_pct ?? activePaper.recency_ratio_pct ?? dashboard.stats?.recency_ratio_pct ?? null,
              reference_density: activePaper.citation_metrics?.reference_density || densityStr,
              reference_density_per_page: activePaper.citation_metrics?.reference_density_per_page ?? densityVal,
              citation_density_per_page: activePaper.citation_metrics?.citation_density_per_page ?? densityVal,
              year_distribution: computedYearDist,
              has_formal_references: hasRefs
            };

            const rigorDisabled = dashboard.rigor_disabled || isQuestionBank || (dashboard.academic_health_score == null && activePaper.academic_health_score == null);
            const healthScore = rigorDisabled ? null : (dashboard.academic_health_score ?? activePaper.academic_health_score ?? null);
            const healthBreakdown = rigorDisabled ? null : (dashboard.health_breakdown || null);
            const readingLevel = (rigorDisabled || healthScore === null || healthScore === undefined)
              ? 'N/A'
              : (dashboard.reading_level || activePaper.reading_level || 'N/A');

            return (
              <CitationAnalysisView
                citationMetrics={citationMetrics}
                healthScore={healthScore}
                healthBreakdown={healthBreakdown}
                readingLevel={readingLevel}
                isQuestionBank={isQuestionBank}
              />
            );
          })()}
        </div>
      )}
    </div>
  );
}
