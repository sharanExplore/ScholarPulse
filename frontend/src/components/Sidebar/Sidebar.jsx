import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  Network,
  Sparkles,
  Settings,
  HelpCircle,
  ExternalLink,
  BrainCircuit,
  Activity,
  ChevronRight,
  X
} from 'lucide-react';

export default function Sidebar({
  currentView,
  setCurrentView,
  mobileOpen,
  setMobileOpen,
  backendOnline,
  papersCount = 0
}) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'upload',
      label: 'Upload Paper',
      icon: UploadCloud,
      badge: 'PDF',
      highlight: true,
    },
    {
      id: 'papers',
      label: 'My Papers',
      icon: FileText,
      badge: papersCount > 0 ? papersCount : null,
    },
    {
      id: 'citations',
      label: 'Citation Intelligence',
      icon: Network,
      badge: null,
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      icon: Sparkles,
      badge: 'AI',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  const handleNavClick = (id) => {
    setCurrentView(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleNavClick('landing')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">Scholar<span className="text-indigo-400">Pulse</span></span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-400">Academic Intelligence</p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Multi-Agent Badge */}
        <div className="mx-4 my-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
          <div className="relative flex shrink-0">
            <span className={`w-2.5 h-2.5 rounded-full ${backendOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className={`absolute -inset-0.5 rounded-full animate-ping opacity-75 ${backendOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-200 truncate">
              {backendOnline ? 'Multi-Agent Core Online' : 'Connecting to API...'}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>6 Active Intelligence Agents</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Platform Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.highlight
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 space-y-3">
          {/* Quick API Swagger link */}
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>FastAPI Docs (Swagger)</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* User / Researcher profile badge */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
              SP
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">Lead Researcher</p>
              <p className="text-[11px] text-slate-400 truncate">scholar@academic.edu</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
