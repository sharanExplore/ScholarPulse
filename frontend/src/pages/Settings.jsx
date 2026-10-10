import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Activity,
  CheckCircle2,
  AlertCircle,
  Database,
  Server,
  Cpu,
  RefreshCw,
  ExternalLink,
  Shield,
  Layers,
  FileText
} from 'lucide-react';
import api from '../services/api';

export default function Settings({ backendOnline, showToast }) {
  const [healthData, setHealthData] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const data = await api.getHealth();
      setHealthData(data);
      if (showToast) {
        showToast({
          type: 'success',
          message: 'Backend health verified: All systems operational.'
        });
      }
    } catch (err) {
      console.error('Health check failed:', err);
      setHealthData(null);
      if (showToast) {
        showToast({
          type: 'error',
          message: 'Health check failed: Unable to connect to FastAPI.'
        });
      }
    } finally {
      setChecking(false);
    }
  };

  const agents = [
    { name: 'Document Ingestion Agent', role: 'Layout parsing, PDF extraction, section boundaries' },
    { name: 'Summarization Agent', role: 'Executive synthesis, key findings, methodology analysis' },
    { name: 'Keyword Extraction Agent', role: 'Multi-gram TF-IDF & linguistic terminology isolation' },
    { name: 'Citation & Reference Agent', role: 'Bibliography parsing, in-text citation mapping' },
    { name: 'Recommendation Agent', role: 'Live arXiv & CrossRef semantic query matching' },
    { name: 'Results & Dashboard Agent', role: 'Academic rigour score & BibTeX dossier generation' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          System Settings & API Telemetry
        </h1>
        <p className="text-xs text-slate-500">
          Monitor FastAPI connectivity, database status, and multi-agent pipeline parameters
        </p>
      </div>

      {/* Backend Status Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">FastAPI Backend Connection</h2>
              <p className="text-xs text-slate-500">Active API Base URL: {api.getBaseUrl()}</p>
            </div>
          </div>

          <button
            onClick={checkHealth}
            disabled={checking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{checking ? 'Checking...' : 'Ping /api/health'}</span>
          </button>
        </div>

        {/* Status Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Core Status</span>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  healthData ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              <span className="text-sm font-bold text-slate-800 capitalize">
                {healthData?.status || (backendOnline ? 'Online' : 'Offline')}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Database</span>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-bold text-slate-800 capitalize">
                {healthData?.database || 'SQLite (Local)'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Interactive Docs</span>
            <a
              href={`${api.getBaseUrl()}/docs`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:underline"
            >
              <span>Swagger UI</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {healthData?.upload_dir && (
          <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono truncate">
            Upload Directory: {healthData.upload_dir}
          </div>
        )}
      </div>

      {/* Multi-Agent Architecture Roster */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Multi-Agent Intelligence Network</h2>
            <p className="text-xs text-slate-500">Autonomous cooperating pipeline actors</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {agents.map((agent, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{agent.name}</span>
                <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{agent.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* User Preferences & Academic Mode */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 sm:p-8 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Academic Environment Preferences</h3>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Automatic arXiv & CrossRef Enrichment</span>
              <span className="text-[11px] text-slate-500">Query live academic repositories during paper ingestion</span>
            </div>
            <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Deterministic Citation Cross-Referencing</span>
              <span className="text-[11px] text-slate-500">Perform in-text citation frequency pattern matching</span>
            </div>
            <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
          </label>
        </div>
      </div>
    </div>
  );
}
