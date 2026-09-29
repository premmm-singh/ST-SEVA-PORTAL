import React from 'react';

/**
 * Government Portal Skeleton Shimmer Loader
 * High-performance, pure CSS keyframe shimmer.
 */
export default function SkeletonShimmer({
  type = 'card',
  lines = 3,
  className = ''
}) {
  if (type === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 skeleton-shimmer rounded"
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  if (type === 'circle') {
    return (
      <div className={`w-12 h-12 rounded-full skeleton-shimmer ${className}`} />
    );
  }

  if (type === 'table') {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 p-4 space-y-3 ${className}`}>
        <div className="h-6 w-1/3 skeleton-shimmer rounded" />
        <div className="space-y-2 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 skeleton-shimmer rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Default 'card'
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl skeleton-shimmer flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-1/2 skeleton-shimmer rounded" />
          <div className="h-3 w-1/4 skeleton-shimmer rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 skeleton-shimmer rounded w-full" />
        <div className="h-3 skeleton-shimmer rounded w-5/6" />
        <div className="h-3 skeleton-shimmer rounded w-2/3" />
      </div>
    </div>
  );
}
