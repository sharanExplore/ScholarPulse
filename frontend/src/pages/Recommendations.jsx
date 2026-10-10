import React, { useState, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  ExternalLink,
  BookOpen,
  Calendar,
  User,
  ArrowRight,
  Filter,
  Search
} from 'lucide-react';
import RecommendationCard from '../components/RecommendationCard/RecommendationCard';
import EmptyState from '../components/EmptyState/EmptyState';
import api from '../services/api';

export default function Recommendations({
  papers = [],
  onViewPaper,
  onNavigate
}) {
  const [selectedPaperId, setSelectedPaperId] = useState(
    papers.length > 0 ? papers[0].id : null
  );
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedPaper = papers.find((p) => p.id === selectedPaperId) || papers[0];

  useEffect(() => {
    if (selectedPaperId) {
      loadRecommendations(selectedPaperId);
    }
  }, [selectedPaperId]);

  const loadRecommendations = async (id) => {
    setLoading(true);
    try {
      const data = await api.getRecommendations(id);
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      // Fallback: check if paper has recommendations
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  if (papers.length === 0) {
    return (
      <EmptyState
        title="No literature recommendations yet"
        description="Upload an academic PDF to let our recommendation agent search arXiv and CrossRef for semantically aligned peer research."
        actionLabel="Upload First Paper"
        onAction={() => onNavigate('upload')}
        icon={Compass}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Related Literature Discovery
          </h1>
          <p className="text-xs text-slate-500">
            Real-time semantic recommendations retrieved live from arXiv and CrossRef
          </p>
        </div>

        {/* Paper selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Seed Paper:
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

      {/* Seed Paper Context Banner */}
      {selectedPaper && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              Seed Document
            </span>
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {selectedPaper.title || selectedPaper.filename}
            </h3>
            <p className="text-xs text-slate-500 truncate">
              Authors: {Array.isArray(selectedPaper.authors) ? selectedPaper.authors.join(', ') : selectedPaper.authors || 'Unknown'}
            </p>
          </div>

          <button
            onClick={() => onViewPaper(selectedPaper.id)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-xs font-semibold transition-colors"
          >
            <span>Inspect Full Dossier</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Recommendations Card Component */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-subtle">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Retrieving related research from live academic APIs...</p>
        </div>
      ) : (
        <RecommendationCard recommendations={recommendations} />
      )}
    </div>
  );
}
