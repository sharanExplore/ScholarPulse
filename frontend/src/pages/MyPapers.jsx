import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Trash2,
  ChevronRight,
  UploadCloud,
  Calendar,
  User,
  BookOpen,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  LayoutGrid,
  List
} from 'lucide-react';
import PaperCard from '../components/PaperCard/PaperCard';
import EmptyState from '../components/EmptyState/EmptyState';
import { PaperCardSkeleton } from '../components/Loading/SkeletonLoader';

export default function MyPapers({
  papers = [],
  loading = false,
  onViewPaper,
  onDeletePaper,
  onNavigate
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Filter papers
  const filteredPapers = papers.filter((paper) => {
    const textToMatch = `${paper.title || ''} ${paper.filename || ''} ${
      Array.isArray(paper.authors) ? paper.authors.join(' ') : paper.authors || ''
    }`.toLowerCase();
    const matchesSearch = textToMatch.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || paper.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort papers
  const sortedPapers = [...filteredPapers].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0);
    }
    if (sortBy === 'oldest') {
      return new Date(a.uploaded_at || 0) - new Date(b.uploaded_at || 0);
    }
    if (sortBy === 'title') {
      return (a.title || a.filename || '').localeCompare(b.title || b.filename || '');
    }
    if (sortBy === 'references') {
      return (b.reference_count || 0) - (a.reference_count || 0);
    }
    return 0;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Academic Paper Repository
          </h1>
          <p className="text-xs text-slate-500">
            Comprehensive library of analyzed academic publications ({papers.length} total)
          </p>
        </div>

        <button
          onClick={() => onNavigate('upload')}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Paper</span>
        </button>
      </div>

      {/* Control Bar: Search, Status, Sort & Layout Switcher */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search papers by title, author, or filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Processing</option>
            <option value="failed">Failed</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">Newest Uploads</option>
            <option value="oldest">Oldest Uploads</option>
            <option value="title">Alphabetical (Title)</option>
            <option value="references">Most References</option>
          </select>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <PaperCardSkeleton key={i} />
          ))}
        </div>
      ) : sortedPapers.length > 0 ? (
        viewMode === 'table' ? (
          /* Table View */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-6">Paper Document</th>
                    <th className="py-3.5 px-6">Authors</th>
                    <th className="py-3.5 px-6">Uploaded</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-center">References</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {sortedPapers.map((paper) => {
                    const title = paper.title || paper.filename || 'Untitled';
                    const authors = Array.isArray(paper.authors)
                      ? paper.authors.join(', ')
                      : paper.authors || 'Unknown';
                    const date = paper.uploaded_at
                      ? new Date(paper.uploaded_at).toLocaleDateString()
                      : 'Recently';

                    return (
                      <tr
                        key={paper.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => onViewPaper(paper.id)}
                      >
                        <td className="py-4 px-6 max-w-xs">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                {title}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono truncate block">
                                {paper.filename}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 max-w-[200px] text-slate-600 truncate">
                          {authors}
                        </td>

                        <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                          {date}
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                              paper.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : paper.status === 'failed'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {paper.status || 'completed'}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <span className="font-bold text-slate-700">
                            {paper.reference_count || 0}
                          </span>
                        </td>

                        <td
                          className="py-4 px-6 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onViewPaper(paper.id)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-semibold transition-colors"
                            >
                              View Analysis
                            </button>

                            {onDeletePaper && (
                              <button
                                onClick={() => onDeletePaper(paper.id, title)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete paper"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPapers.map((paper) => (
              <PaperCard
                key={paper.id}
                paper={paper}
                onView={onViewPaper}
                onDelete={onDeletePaper}
              />
            ))}
          </div>
        )
      ) : (
        <EmptyState
          title={searchQuery ? 'No papers matched' : 'Your research repository is empty'}
          description={
            searchQuery
              ? `No papers found matching "${searchQuery}". Try adjusting your keywords or clearing the filter.`
              : 'Upload an academic PDF to build your research library and run citation intelligence.'
          }
          actionLabel="Upload Paper"
          onAction={() => onNavigate('upload')}
        />
      )}
    </div>
  );
}
