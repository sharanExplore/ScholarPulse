import React from 'react';

export function StatCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="w-24 h-4 bg-slate-200 rounded"></div>
        <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
      </div>
      <div className="w-16 h-8 bg-slate-200 rounded"></div>
      <div className="w-32 h-3 bg-slate-100 rounded"></div>
    </div>
  );
}

export function PaperCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle animate-pulse space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="w-3/4 h-5 bg-slate-200 rounded"></div>
          <div className="w-1/2 h-4 bg-slate-100 rounded"></div>
        </div>
        <div className="w-20 h-6 bg-slate-100 rounded-full"></div>
      </div>
      <div className="space-y-2">
        <div className="w-full h-3 bg-slate-100 rounded"></div>
        <div className="w-5/6 h-3 bg-slate-100 rounded"></div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="w-28 h-4 bg-slate-100 rounded"></div>
        <div className="w-24 h-8 bg-slate-200 rounded-xl"></div>
      </div>
    </div>
  );
}

export function DetailDossierSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="p-8 rounded-2xl bg-white border border-slate-200/80 space-y-4">
        <div className="w-1/4 h-4 bg-slate-200 rounded"></div>
        <div className="w-3/4 h-8 bg-slate-200 rounded"></div>
        <div className="w-1/2 h-4 bg-slate-100 rounded"></div>
        <div className="flex gap-3 pt-4">
          <div className="w-28 h-9 bg-slate-200 rounded-xl"></div>
          <div className="w-28 h-9 bg-slate-100 rounded-xl"></div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="w-24 h-10 bg-slate-200 rounded-xl"></div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-4">
            <div className="w-40 h-5 bg-slate-200 rounded"></div>
            <div className="space-y-2">
              <div className="w-full h-4 bg-slate-100 rounded"></div>
              <div className="w-full h-4 bg-slate-100 rounded"></div>
              <div className="w-4/5 h-4 bg-slate-100 rounded"></div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 h-64"></div>
        </div>
      </div>
    </div>
  );
}

export default {
  StatCardSkeleton,
  PaperCardSkeleton,
  DetailDossierSkeleton
};
