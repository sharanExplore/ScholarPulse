import React, { useState } from 'react';
import { Tag, Search, Filter, Copy, Check, Hash } from 'lucide-react';

export default function KeywordList({ keywords = [], onCopyToast }) {
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  if (!keywords || keywords.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-subtle">
        <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No technical keywords extracted for this paper.</p>
      </div>
    );
  }

  // Extract distinct categories
  const categories = ['ALL', ...new Set(keywords.map((k) => k.category || 'Domain'))];

  // Filtered keywords
  const filteredKeywords = keywords.filter((k) => {
    const matchesCategory = filterCategory === 'ALL' || (k.category || 'Domain') === filterCategory;
    const matchesSearch = k.keyword.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopyAll = () => {
    const text = filteredKeywords.map((k) => k.keyword).join(', ');
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (onCopyToast) onCopyToast('Keywords copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const categoryStyles = {
    Domain: 'bg-indigo-50 text-indigo-700 border-indigo-200/70',
    Methodology: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    Metrics: 'bg-amber-50 text-amber-700 border-amber-200/70',
    Architecture: 'bg-purple-50 text-purple-700 border-purple-200/70',
    Dataset: 'bg-sky-50 text-sky-700 border-sky-200/70',
    default: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-6 sm:p-8 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Keyword & Concept Intelligence</h2>
            <p className="text-xs text-slate-500">TF-IDF & POS multi-gram extracted academic terminology ({keywords.length} total)</p>
          </div>
        </div>

        <button
          onClick={handleCopyAll}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
          <span>{copied ? 'Copied' : 'Copy All'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Keywords Chips Grid */}
      <div className="flex flex-wrap gap-2.5 pt-2">
        {filteredKeywords.map((item, idx) => {
          const style = categoryStyles[item.category] || categoryStyles.default;
          return (
            <div
              key={item.id || idx}
              className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200 hover:scale-105 hover:shadow-sm ${style}`}
            >
              <Hash className="w-3.5 h-3.5 opacity-60" />
              <span className="font-semibold">{item.keyword}</span>
              {item.score !== undefined && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/70 font-mono opacity-80 group-hover:opacity-100">
                  {typeof item.score === 'number' ? item.score.toFixed(2) : item.score}
                </span>
              )}
              {item.category && item.category !== 'Domain' && (
                <span className="text-[9px] uppercase tracking-wider px-1 py-0.2 rounded bg-black/5 opacity-60">
                  {item.category}
                </span>
              )}
            </div>
          );
        })}

        {filteredKeywords.length === 0 && (
          <div className="w-full text-center py-6 text-xs text-slate-400">
            No keywords match the search query "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
}
