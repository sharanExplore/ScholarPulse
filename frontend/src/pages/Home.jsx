import React from 'react';
import {
  BrainCircuit,
  FileText,
  Sparkles,
  Tag,
  Network,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  BookOpen,
  CheckCircle2,
  Cpu,
  BarChart2
} from 'lucide-react';

export default function Home({ onNavigate, papersCount = 0 }) {
  const features = [
    {
      icon: FileText,
      title: 'Smart PDF Ingestion',
      description: 'Robust document extraction, layout parsing, section detection, and structural normalization powered by PyMuPDF.',
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      icon: Sparkles,
      title: 'AI Multi-Facet Summarization',
      description: 'Abstractive executive summaries, key contributions, methodology breakdowns, and explicit limitation analyses.',
      gradient: 'from-indigo-500 to-violet-600',
    },
    {
      icon: Tag,
      title: 'Keyword & Entity Intelligence',
      description: 'Categorized n-gram keyphrase extraction spanning domain foundations, algorithmic methodologies, and evaluation benchmarks.',
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      icon: Network,
      title: 'Citation & Reference Intelligence',
      description: 'Deep bibliography resolution, in-text citation density metrics, and temporal distribution visualization.',
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      icon: Compass,
      title: 'Related Literature Discovery',
      description: 'Real-time semantic recommendations retrieved from live academic repositories including arXiv and CrossRef.',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      icon: BarChart2,
      title: 'Academic Health Scoring',
      description: 'Automated 100-point composite rigour score evaluating conceptual density, citation recency, and methodological thoroughness.',
      gradient: 'from-amber-500 to-orange-600',
    },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-scholar text-white p-8 sm:p-14 shadow-2xl border border-indigo-900/60">
        {/* Glow ambient background lights */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Autonomous Multi-Agent Architecture</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Turn Research Papers Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-indigo-100 to-violet-300">Actionable Insights</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl">
            Analyze, summarize, discover citations and find related research with AI-powered academic intelligence. ScholarPulse deploys 6 specialized agents to deliver immediate research dossiers.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('upload')}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-white text-indigo-950 font-bold text-sm shadow-xl hover:bg-indigo-50 transition-all duration-200 hover:-translate-y-0.5"
            >
              <span>Analyze Research Paper</span>
              <ArrowRight className="w-4 h-4 text-indigo-600" />
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 backdrop-blur-md transition-all duration-200"
            >
              <BookOpen className="w-4 h-4 text-indigo-300" />
              <span>Explore Dashboard</span>
              {papersCount > 0 && (
                <span className="text-xs bg-indigo-500/40 px-2 py-0.5 rounded-full border border-indigo-400/40">
                  {papersCount} papers
                </span>
              )}
            </button>
          </div>

          {/* Quick trust metrics */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-indigo-800/60 max-w-md text-xs text-indigo-200">
            <div>
              <span className="block text-xl font-bold text-white">6</span>
              <span>Intelligent Agents</span>
            </div>
            <div>
              <span className="block text-xl font-bold text-white">100%</span>
              <span>Local & Real-Time</span>
            </div>
            <div>
              <span className="block text-xl font-bold text-white">Live</span>
              <span>arXiv & CrossRef</span>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Visual Cards */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Comprehensive Academic Intelligence
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            From raw PDF ingestion to peer-matched literature discovery, our multi-agent workflow parses every facet of your document.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle hover:shadow-card hover:border-indigo-200 transition-all duration-200 space-y-4 group"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Multi-Agent Orchestration Flow Banner */}
      <section className="p-8 sm:p-10 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Pipeline Blueprint
            </span>
            <h3 className="text-xl font-bold text-white mt-1">
              Multi-Agent Orchestration Pipeline
            </h3>
          </div>
          <button
            onClick={() => onNavigate('upload')}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
          >
            Upload Paper to Test
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {[
            { step: '01', title: 'Ingestion Agent', role: 'PDF parsing & layout' },
            { step: '02', title: 'Summary Agent', role: 'Executive synthesis' },
            { step: '03', title: 'Keyword Agent', role: 'Concept extraction' },
            { step: '04', title: 'Citation Agent', role: 'Bibliography mapping' },
            { step: '05', title: 'Rec Agent', role: 'Live arXiv discovery' },
            { step: '06', title: 'Dashboard Agent', role: 'Dossier aggregation' },
          ].map((agent, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1">
              <span className="text-[10px] font-mono text-indigo-400 font-bold">{agent.step}</span>
              <h4 className="text-xs font-bold text-slate-200">{agent.title}</h4>
              <p className="text-[11px] text-slate-400">{agent.role}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
