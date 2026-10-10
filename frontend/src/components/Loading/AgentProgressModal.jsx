import React, { useState, useEffect } from 'react';
import {
  FileText,
  Binary,
  Layers,
  Sparkles,
  Tag,
  Network,
  Compass,
  CheckCircle2,
  Loader2,
  Clock
} from 'lucide-react';

const STAGES = [
  { id: 'upload', label: 'Uploading PDF Document', agent: 'Transport Layer', icon: FileText },
  { id: 'ingest', label: 'Extracting Text & Layout Structure', agent: 'Document Ingestion Agent', icon: Binary },
  { id: 'metadata', label: 'Extracting Academic Metadata & Authors', agent: 'Document Ingestion Agent', icon: Layers },
  { id: 'summary', label: 'Synthesizing Executive Summary & Findings', agent: 'Summarization Agent', icon: Sparkles },
  { id: 'keywords', label: 'Extracting Technical Keywords & Entities', agent: 'Keyword Extraction Agent', icon: Tag },
  { id: 'citations', label: 'Parsing Bibliography & In-Text Citations', agent: 'Citation & Reference Agent', icon: Network },
  { id: 'recommendations', label: 'Querying arXiv & CrossRef for Related Works', agent: 'Recommendation Agent', icon: Compass },
  { id: 'dashboard', label: 'Computing Rigour Score & Preparing Dossier', agent: 'Results & Dashboard Agent', icon: CheckCircle2 },
];

export default function AgentProgressModal({ isAnalyzing, filename, estimatedSeconds = 12 }) {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) {
      setCurrentStageIdx(0);
      setElapsedSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Stagger stage progression realistically
    const stageInterval = setInterval(() => {
      setCurrentStageIdx((prev) => {
        if (prev < STAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    return () => {
      clearInterval(timer);
      clearInterval(stageInterval);
    };
  }, [isAnalyzing]);

  if (!isAnalyzing) return null;

  const currentStage = STAGES[currentStageIdx];
  const progressPercent = Math.min(100, Math.round(((currentStageIdx + 1) / STAGES.length) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-xl w-full p-6 sm:p-8 overflow-hidden relative">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2 border border-indigo-100">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                Multi-Agent Pipeline Active
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Analyzing Academic Literature
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">
                Document: <span className="font-semibold text-slate-700">{filename || 'paper.pdf'}</span>
              </p>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{elapsedSeconds}s</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
              <span>{currentStage.label}</span>
              <span className="font-bold text-indigo-600">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Pipeline Stage Checklist */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isCompleted = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;

              return (
                <div
                  key={stage.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all duration-300 ${
                    isCurrent
                      ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-semibold shadow-sm'
                      : isCompleted
                      ? 'bg-slate-50/80 border-slate-200 text-slate-700'
                      : 'bg-white/40 border-slate-100 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isCurrent
                          ? 'bg-indigo-600 text-white'
                          : isCompleted
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{stage.label}</div>
                      <div className="text-[10px] text-slate-400">{stage.agent}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                      isCompleted
                        ? 'text-emerald-700 bg-emerald-50'
                        : isCurrent
                        ? 'text-indigo-700 bg-indigo-100 animate-pulse'
                        : 'text-slate-400'
                    }`}
                  >
                    {isCompleted ? 'Done' : isCurrent ? 'Running' : 'Queued'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer notice */}
          <p className="text-[11px] text-slate-400 text-center mt-6">
            ScholarPulse multi-agent system runs local parsing and queries live academic sources. Please hold on.
          </p>
        </div>
      </div>
    </div>
  );
}
