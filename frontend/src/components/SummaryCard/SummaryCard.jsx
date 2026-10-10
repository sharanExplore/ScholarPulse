import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Lightbulb,
  Cpu,
  AlertTriangle,
  Flag
} from 'lucide-react';

export default function SummaryCard({ summary, onCopyToast }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!summary) return null;

  const {
    executive_summary = '',
    key_findings = [],
    methodology = '',
    limitations = '',
    conclusions = '',
    structured_sections = {}
  } = summary;

  const structured = structured_sections || {};
  const researchProblem = structured.research_problem || summary.research_problem || '';
  const proposedApproach = structured.proposed_approach || summary.proposed_approach || '';
  const architecture = structured.architecture || summary.architecture || '';
  const keyTechnicalComponents = structured.key_technical_components || summary.key_technical_components || '';
  const experiments = structured.experiments || summary.experiments || '';
  const mainResults = structured.main_results || summary.main_results || '';
  const contributions = structured.contributions || summary.contributions || '';
  const conclusionText = structured.conclusion || summary.conclusion || conclusions || '';

  const handleCopy = () => {
    const textToCopy = `Executive Summary:\n${executive_summary}\n\nKey Findings:\n${
      Array.isArray(key_findings) ? key_findings.map((f, i) => `${i + 1}. ${f}`).join('\n') : key_findings
    }\n\nMethodology:\n${methodology}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    if (onCopyToast) onCopyToast('Summary copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const findingsList = Array.isArray(key_findings) && key_findings.length > 0
    ? key_findings
    : Array.isArray(contributions) && contributions.length > 0
    ? contributions
    : typeof key_findings === 'string'
    ? key_findings.split('\n').filter(Boolean)
    : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">AI-Generated Synthesis</h2>
            <p className="text-xs text-slate-500">Multi-facet abstractive summary distilled by Summarization Agent</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Copy summary text"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
            title={expanded ? 'Collapse view' : 'Expand full 8-part synthesis'}
          >
            {expanded ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Collapse</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Full Synthesis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
          <span>Executive Summary</span>
        </h3>
        <p className="text-sm text-slate-700 leading-relaxed font-normal bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/60">
          {executive_summary || 'Executive summary synthesized from document text.'}
        </p>
      </div>

      {/* Key Takeaways / Findings */}
      {findingsList.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Key Scientific Contributions</span>
            <span className="text-[11px] font-normal text-slate-400">({findingsList.length} items)</span>
          </h3>

          <div className="grid grid-cols-1 gap-2.5">
            {findingsList.map((finding, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 hover:border-indigo-200 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {finding}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded 8 Structured Sections */}
      {expanded && (
        <div className="space-y-4 pt-4 border-t border-slate-100 animate-fade-in">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Comprehensive 8-Part Academic Structure
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Research Problem */}
            {researchProblem && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                  1. Research Problem
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">{researchProblem}</p>
              </div>
            )}

            {/* 2. Proposed Approach */}
            {proposedApproach && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                  2. Proposed Approach
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">{proposedApproach}</p>
              </div>
            )}

            {/* 3. Architecture */}
            {architecture && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                  3. Architecture
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">{architecture}</p>
              </div>
            )}

            {/* 4. Key Technical Components */}
            {keyTechnicalComponents && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                  4. Key Technical Components
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">{keyTechnicalComponents}</p>
              </div>
            )}

            {/* 5. Experiments */}
            {experiments && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                  5. Experiments & Benchmarks
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">{experiments}</p>
              </div>
            )}

            {/* 6. Main Results */}
            {mainResults && (
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/60 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  6. Main Experimental Results
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">{mainResults}</p>
              </div>
            )}

            {/* 7. Methodology (if separate) or Limitations */}
            {limitations && (
              <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/60 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                  Limitations & Constraints
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">{limitations}</p>
              </div>
            )}

            {/* 8. Conclusion */}
            {conclusionText && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                  8. Conclusion
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">{conclusionText}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
