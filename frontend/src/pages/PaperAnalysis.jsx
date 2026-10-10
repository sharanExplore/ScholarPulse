import React, { useState, useEffect } from 'react';
import {
  FileText,
  User,
  Calendar,
  Layers,
  Sparkles,
  Tag,
  BookOpen,
  Network,
  Compass,
  Download,
  Copy,
  Check,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Award,
  Share2,
  FileCode2,
  CheckCircle2
} from 'lucide-react';

import SummaryCard from '../components/SummaryCard/SummaryCard';
import KeywordList from '../components/KeywordList/KeywordList';
import ReferenceList from '../components/ReferenceList/ReferenceList';
import CitationAnalysisView from '../components/CitationAnalysis/CitationAnalysisView';
import RecommendationCard from '../components/RecommendationCard/RecommendationCard';
import { DetailDossierSkeleton } from '../components/Loading/SkeletonLoader';
import ErrorState from '../components/ErrorState/ErrorState';
import api from '../services/api';

export default function PaperAnalysis({
  paperId,
  initialPaperData,
  onBack,
  showToast
}) {
  const [paper, setPaper] = useState(initialPaperData || null);
  const [loading, setLoading] = useState(!initialPaperData);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showBibtexModal, setShowBibtexModal] = useState(false);
  const [copiedBibtex, setCopiedBibtex] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleEnrichMetadata = async () => {
    setIsEnriching(true);
    try {
      const res = await api.enrichMetadata(paperId);
      if (res.enriched) {
        setPaper((prev) => ({
          ...prev,
          metadata: { ...prev.metadata, ...res.updates }
        }));
        if (showToast) showToast({ type: 'success', message: 'Metadata enriched via CrossRef & Semantic Scholar!' });
      } else {
        if (showToast) showToast({ type: 'info', message: 'Metadata is already up-to-date with published records.' });
      }
    } catch (err) {
      console.error('Enrichment error:', err);
      if (showToast) showToast({ type: 'error', message: 'Failed to enrich metadata.' });
    } finally {
      setIsEnriching(false);
    }
  };

  const handleVerifyReferences = async () => {
    setIsVerifying(true);
    try {
      const res = await api.verifyReferences(paperId);
      if (res.references) {
        setPaper((prev) => ({
          ...prev,
          references: res.references,
          validated_references: res.references
        }));
      }
      if (showToast) {
        showToast({
          type: 'success',
          message: `Verified ${res.verified_count} of ${res.total_references} references with CrossRef.`
        });
      }
    } catch (err) {
      console.error('Reference verification error:', err);
      if (showToast) showToast({ type: 'error', message: 'Failed to verify references.' });
    } finally {
      setIsVerifying(false);
    }
  };

  // Fetch paper data if not passed or when paperId changes
  useEffect(() => {
    if (initialPaperData && initialPaperData.paper_id === paperId) {
      setPaper(initialPaperData);
      setLoading(false);
      return;
    }

    if (paperId) {
      loadPaper(paperId);
    }
  }, [paperId]);

  const loadPaper = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPaper(id);
      setPaper(data);
    } catch (err) {
      console.error('Failed to load paper:', err);
      setError(err.message || 'Unable to retrieve paper analysis dossier.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Papers</span>
        </button>
        <DetailDossierSkeleton />
      </div>
    );
  }

  if (error || !paper) {
    return (
      <ErrorState
        title="Dossier Not Found"
        message={error || "Could not retrieve the requested academic analysis."}
        onBack={onBack}
        onRetry={() => loadPaper(paperId)}
      />
    );
  }

  // Extract nested objects
  const doc = paper.document || {};
  const meta = paper.metadata || {};
  const summary = paper.summary || {};
  const keywords = paper.keywords || [];
  const references = paper.validated_references || paper.references || [];
  const recommendations = paper.recommendations || [];
  const rawCitationMetrics = paper.citation_metrics || (paper.dashboard && paper.dashboard.stats) || {};
  const dashboard = paper.dashboard || {};

  const isQuestionBank = (
    meta.document_type === 'Academic Question Bank' ||
    paper.document_type === 'Academic Question Bank' ||
    (meta.title && meta.title.toLowerCase().includes('question bank'))
  );
  const qbData = paper.question_bank || meta.structure || null;
  const rigorDisabled = dashboard.rigor_disabled || isQuestionBank || dashboard.academic_health_score == null;
  const healthScore = rigorDisabled ? null : dashboard.academic_health_score;
  const healthBreakdown = rigorDisabled ? null : dashboard.health_breakdown;
  const readingLevel = (rigorDisabled || healthScore === null || healthScore === undefined)
    ? 'N/A'
    : (dashboard.reading_level || 'N/A');

  // Compute canonical bibliometrics to ensure 100% data consistency with References tab
  const actualPageCount = Math.max(1, doc.page_count || paper.page_count || 1);
  const refCount = references.length;
  const totalInText = references.reduce(
    (acc, r) => acc + (r.in_text_mention_count || r.citation_count_in_paper || 0),
    0
  );
  const densityVal = refCount > 0 ? (refCount / actualPageCount).toFixed(2) : null;
  const densityStr = refCount > 0 ? `${densityVal} references/page` : 'N/A';

  const citationMetrics = {
    total_references: (rawCitationMetrics.total_references !== undefined && rawCitationMetrics.total_references > 0)
      ? rawCitationMetrics.total_references
      : refCount,
    in_text_citations_count: (rawCitationMetrics.in_text_citations_count !== undefined && rawCitationMetrics.in_text_citations_count > 0)
      ? rawCitationMetrics.in_text_citations_count
      : totalInText,
    in_text_mentions: (rawCitationMetrics.in_text_mentions !== undefined && rawCitationMetrics.in_text_mentions > 0)
      ? rawCitationMetrics.in_text_mentions
      : totalInText,
    external_citations: rawCitationMetrics.external_citations || 'N/A',
    median_year: rawCitationMetrics.median_year || null,
    recency_ratio_pct: rawCitationMetrics.recency_ratio_pct ?? null,
    reference_density: rawCitationMetrics.reference_density || densityStr,
    reference_density_per_page: rawCitationMetrics.reference_density_per_page ?? densityVal,
    citation_density_per_page: rawCitationMetrics.citation_density_per_page ?? densityVal,
    year_distribution: rawCitationMetrics.year_distribution && Object.keys(rawCitationMetrics.year_distribution).length > 0
      ? rawCitationMetrics.year_distribution
      : (() => {
          if (refCount === 0) return {};
          const buckets = { '<2015': 0, '2015-2019': 0, '2020-2023': 0, '2024-2026': 0, 'Unknown': 0 };
          for (const r of references) {
            const yr = parseInt(r.year, 10);
            if (!yr || isNaN(yr)) buckets['Unknown'] += 1;
            else if (yr < 2015) buckets['<2015'] += 1;
            else if (yr <= 2019) buckets['2015-2019'] += 1;
            else if (yr <= 2023) buckets['2020-2023'] += 1;
            else buckets['2024-2026'] += 1;
          }
          return buckets;
        })(),
    has_formal_references: refCount > 0
  };
  const bibtex = dashboard.bibtex || '';
  const markdownReport = dashboard.markdown_report || '';

  const displayTitle = meta.title || doc.filename || 'Untitled Research Paper';
  const authorsList = Array.isArray(meta.authors)
    ? meta.authors
    : typeof meta.authors === 'string'
    ? [meta.authors]
    : [];

  const handleDownloadMarkdown = () => {
    const reportText = markdownReport || `# ${displayTitle}\n\nAuthors: ${authorsList.join(', ')}\n\n## Summary\n${summary.executive_summary}`;
    const blob = new Blob([reportText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(meta.title || doc.filename || 'paper').replace(/\W+/g, '_')}_ScholarPulse_Report.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (showToast) showToast({ type: 'success', message: 'Markdown Report downloaded!' });
  };

  const handleCopyBibtex = () => {
    if (bibtex) {
      navigator.clipboard.writeText(bibtex);
      setCopiedBibtex(true);
      if (showToast) showToast({ type: 'success', message: 'BibTeX citation copied!' });
      setTimeout(() => setCopiedBibtex(false), 2000);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'summary', label: 'AI Summary', icon: Sparkles },
    { id: 'keywords', label: 'Keywords', icon: Tag, count: keywords.length },
    { id: 'references', label: 'References', icon: BookOpen, count: references.length },
    { id: 'citations', label: 'Citation Intelligence', icon: Network },
    { id: 'related', label: 'Related Papers', icon: Compass, count: recommendations.length },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-subtle text-xs font-semibold hover:bg-slate-50 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
          <span>Back to Papers</span>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {bibtex && (
            <button
              onClick={() => setShowBibtexModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-subtle transition-colors"
            >
              <FileCode2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>BibTeX</span>
            </button>
          )}

          <button
            onClick={handleEnrichMetadata}
            disabled={isEnriching}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-subtle transition-colors disabled:opacity-60"
            title="Enrich publication date, official journal, and DOI via CrossRef"
          >
            {isEnriching ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
            <span>{isEnriching ? 'Enriching...' : 'Enrich Metadata'}</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Report</span>
          </button>

          <button
            onClick={() => loadPaper(paperId)}
            className="p-2 rounded-xl bg-white text-slate-500 hover:text-slate-800 border border-slate-200 shadow-subtle hover:bg-slate-50 transition-colors"
            title="Reload paper analysis"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Paper Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            {meta.document_type || paper.document_type || meta.journal || 'Academic Preprint'}
          </span>

          {meta.publication_date && (
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{meta.publication_date}</span>
            </span>
          )}

          {meta.doi && (
            <a
              href={`https://doi.org/${meta.doi}`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-medium text-indigo-600 hover:underline inline-flex items-center gap-1"
            >
              <span>DOI: {meta.doi}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
          {displayTitle}
        </h1>

        {/* Authors */}
        {authorsList.length > 0 && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-800">{authorsList.join(', ')}</span>
          </div>
        )}

        {/* Quick Stats Pill Ribbon */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 font-semibold text-slate-700">
            <Award className="w-3.5 h-3.5 text-indigo-600" />
            <span>{rigorDisabled ? `Academic Completeness Score: N/A${isQuestionBank ? ' (Question Bank)' : ''}` : `Academic Completeness Score: ${healthScore}/100`}</span>
          </div>

          {doc.page_count > 0 && (
            <div className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-700">{doc.page_count}</span> Pages
            </div>
          )}

          {doc.word_count > 0 && (
            <div className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-700">{doc.word_count.toLocaleString()}</span> Words
            </div>
          )}

          <div className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-100">
            <span className="font-semibold text-slate-700">{references.length}</span> References
          </div>

          <div className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-100">
            <span className="font-semibold text-slate-700">{keywords.length}</span> Keywords
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panes */}
      <div className="pt-2">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Abstract Card */}
            {meta.abstract && (
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Document Abstract
                </h3>
                <p className={`text-sm leading-relaxed ${meta.abstract === 'No formal abstract detected.' ? 'text-slate-400 italic' : 'text-slate-700'}`}>
                  {meta.abstract}
                </p>
              </div>
            )}

            {/* AI Summary Card */}
            <SummaryCard summary={summary} onCopyToast={(msg) => showToast({ type: 'success', message: msg })} />

            {/* Question Bank Curriculum Structure Card */}
            {qbData && qbData.units && (
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        Academic Question Bank Curriculum Structure
                      </h3>
                      <p className="text-xs text-slate-500">
                        {qbData.total_questions || 20} Questions across 3 Units & 2 Assessment Sections
                      </p>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-bold">
                    Curriculum Verified
                  </span>
                </div>

                {/* Units Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {qbData.units.map((u, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">{u.unit}</span>
                        <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {u.question_count} Qs
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 leading-snug">{u.title}</h4>
                      <div className="space-y-1 pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Assessed Topics</span>
                        <div className="flex flex-wrap gap-1">
                          {u.topics && u.topics.map((top, tIdx) => (
                            <span key={tIdx} className="text-[10px] font-medium bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                              {top}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Questions Directory */}
                {qbData.questions && qbData.questions.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Questions Directory ({qbData.questions.length} Items)
                      </h4>
                      <span className="text-[11px] text-slate-400">Section 1 (5 Marks) & Section 2 (3 Marks)</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                      {qbData.questions.map((q) => (
                        <div key={q.q_no} className="pt-2 flex items-start gap-3 text-xs">
                          <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                            {q.q_no}
                          </span>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-indigo-600 text-[11px]">{q.unit} • {q.section}</span>
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                                {q.marks} Marks
                              </span>
                              <span className="text-slate-400 text-[11px]">• {q.topic}</span>
                            </div>
                            <p className="text-slate-700 text-xs leading-relaxed">{q.prompt}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Keyword & Citation Previews */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Keywords Preview */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-600" />
                    <span>Key Concepts & Terminology</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('keywords')}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    View All ({keywords.length})
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {keywords.slice(0, 8).map((k, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-medium"
                    >
                      {k.keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Citations Preview */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Network className="w-4 h-4 text-indigo-600" />
                    <span>Reference Summary</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('citations')}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Deep Analysis
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-400 block font-semibold">TOTAL REFERENCES</span>
                    <span className="text-xl font-bold text-slate-800">{references.length}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-400 block font-semibold">RECENT (≥2020)</span>
                    <span className="text-xl font-bold text-slate-800">
                      {references.length > 0 && citationMetrics.recency_ratio_pct !== null && citationMetrics.recency_ratio_pct !== undefined
                        ? `${citationMetrics.recency_ratio_pct}%`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Research Preview */}
            {recommendations.length > 0 && (
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-600" />
                    <span>Discovered Related Literature</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('related')}
                    className="text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    View All ({recommendations.length})
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recommendations.slice(0, 2).map((rec, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-600">{rec.source}</span>
                        <span className="text-emerald-700 font-semibold" title="Computed from semantic and technical similarity signals.">
                          {rec.similarity_label || `Semantic relevance: ${rec.semantic_relevance || Math.round((rec.similarity_score || 0.75) * 100)}`}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{rec.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{rec.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SUMMARY */}
        {activeTab === 'summary' && (
          <SummaryCard summary={summary} onCopyToast={(msg) => showToast({ type: 'success', message: msg })} />
        )}

        {/* TAB 3: KEYWORDS */}
        {activeTab === 'keywords' && (
          <KeywordList keywords={keywords} onCopyToast={(msg) => showToast({ type: 'success', message: msg })} />
        )}

        {/* TAB 4: REFERENCES */}
        {activeTab === 'references' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-subtle">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Extracted Bibliography & In-Text Citations</h3>
                <p className="text-xs text-slate-500">Cross-reference DOIs, publication years, and verification status with CrossRef</p>
              </div>
              <button
                onClick={handleVerifyReferences}
                disabled={isVerifying || references.length === 0}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-60 cursor-pointer self-start sm:self-auto"
                title="Verify reference citations and DOIs against CrossRef academic registry"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying with CrossRef...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify References (CrossRef)</span>
                  </>
                )}
              </button>
            </div>
            <ReferenceList references={references} />
          </div>
        )}

        {/* TAB 5: CITATIONS */}
        {activeTab === 'citations' && (
          <CitationAnalysisView
            citationMetrics={citationMetrics}
            healthBreakdown={healthBreakdown}
            healthScore={healthScore}
            readingLevel={readingLevel}
            stats={dashboard.stats}
            isQuestionBank={isQuestionBank}
          />
        )}

        {/* TAB 6: RELATED PAPERS */}
        {activeTab === 'related' && (
          <RecommendationCard recommendations={recommendations} />
        )}
      </div>

      {/* BibTeX Modal */}
      {showBibtexModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">BibTeX Citation Entry</h3>
              </div>
              <button
                onClick={() => setShowBibtexModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed">
              {bibtex}
            </pre>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBibtexModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleCopyBibtex}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                {copiedBibtex ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBibtex ? 'Copied' : 'Copy BibTeX'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
