import React from 'react';
import {
  Menu,
  UploadCloud,
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BookOpen
} from 'lucide-react';

export default function Navbar({
  currentView,
  setCurrentView,
  setMobileOpen,
  backendOnline,
  papersCount
}) {
  const titles = {
    landing: 'ScholarPulse Intelligence Suite',
    dashboard: 'Research Intelligence Dashboard',
    upload: 'Analyze Academic Document',
    papers: 'Academic Paper Repository',
    citations: 'Citation & Reference Intelligence',
    recommendations: 'Related Literature Discovery',
    analysis: 'Paper Analysis Dossier',
    settings: 'System Preferences & API Status',
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* View Title */}
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{titles[currentView] || 'ScholarPulse'}</span>
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 font-medium">
            Multi-Agent Academic Paper Analyzer & Citation Intelligence
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Backend status pill */}
        <div
          className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            backendOnline
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
          title={backendOnline ? 'FastAPI Backend Connected' : 'Checking Backend API status...'}
        >
          {backendOnline ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          )}
          <span>{backendOnline ? 'API Connected' : 'API Offline'}</span>
        </div>

        {/* Upload quick button if not on upload view */}
        {currentView !== 'upload' && (
          <button
            onClick={() => setCurrentView('upload')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all duration-200 hover:-translate-y-0.5"
          >
            <UploadCloud className="w-4 h-4" />
            <span className="hidden sm:inline">Upload Paper</span>
          </button>
        )}

        {/* My papers quick link */}
        {currentView !== 'papers' && (
          <button
            onClick={() => setCurrentView('papers')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs sm:text-sm font-medium border border-slate-200 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Papers</span>
            {papersCount > 0 && (
              <span className="text-xs bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded-full">
                {papersCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
