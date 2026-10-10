import React from 'react';
import {
  FileText,
  CheckCircle2,
  BookOpen,
  Sparkles,
  UploadCloud,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  Search
} from 'lucide-react';
import PaperCard from '../components/PaperCard/PaperCard';
import EmptyState from '../components/EmptyState/EmptyState';
import { StatCardSkeleton, PaperCardSkeleton } from '../components/Loading/SkeletonLoader';

export default function Dashboard({
  papers = [],
  loading = false,
  onNavigate,
  onViewPaper,
  onDeletePaper
}) {
  // Aggregate real statistics
  const totalPapers = papers.length;
  const analyzedPapers = papers.filter((p) => p.status === 'completed').length;
  const totalReferences = papers.reduce((acc, p) => acc + (p.reference_count || 0), 0);
  const totalRecommendations = papers.reduce((acc, p) => acc + (p.recommendation_count || 0), 0);

  const stats = [
    {
      title: 'Total Papers',
      value: totalPapers,
      subtext: 'Academic documents stored',
      icon: FileText,
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Papers Analyzed',
      value: analyzedPapers,
      subtext: 'Multi-agent dossiers completed',
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'References Analyzed',
      value: totalReferences,
      subtext: 'Mapped bibliography entries',
      icon: BookOpen,
      gradient: 'from-indigo-500 to-purple-600',
    },
    {
      title: 'Related Research',
      value: totalRecommendations,
      subtext: 'Live arXiv & CrossRef matches',
      icon: Sparkles,
      gradient: 'from-purple-500 to-pink-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Agent Research Intelligence</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Good morning, Researcher
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            Analyze your academic literature, extract structured bibliometrics, and uncover citation networks with ScholarPulse.
          </p>
        </div>

        <button
          onClick={() => onNavigate('upload')}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New Paper</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {loading
          ? [1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)
          : stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle hover:shadow-card transition-all duration-200 flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {stat.title}
                    </span>
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-sm`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">
                      {stat.value}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{stat.subtext}</p>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Recent Papers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Recent Academic Papers
            </h3>
            <p className="text-xs text-slate-500">
              Recently ingested and analyzed literature dossiers
            </p>
          </div>

          {papers.length > 0 && (
            <button
              onClick={() => onNavigate('papers')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              <span>View All Papers ({papers.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <PaperCardSkeleton key={i} />
            ))}
          </div>
        ) : papers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {papers.slice(0, 6).map((paper) => (
              <PaperCard
                key={paper.id}
                paper={paper}
                onView={onViewPaper}
                onDelete={onDeletePaper}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No research papers yet"
            description="Upload your first academic paper PDF to initiate automated extraction, AI summarization, and citation intelligence."
            actionLabel="Upload First Paper"
            onAction={() => onNavigate('upload')}
          />
        )}
      </div>
    </div>
  );
}
