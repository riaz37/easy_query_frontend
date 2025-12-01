import React from 'react';
import { cn } from '@/lib/utils';

interface TabSkeletonProps {
  className?: string;
}

export const TabSkeleton: React.FC<TabSkeletonProps> = ({
  className,
}) => {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Generic tab content skeleton */}
      <div className="query-content-gradient rounded-[32px] p-4 lg:p-6">
        <div className="space-y-4">
          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {/* Title skeleton */}
              <div
                className="h-6 lg:h-7 rounded animate-pulse w-48 mb-2"
                style={{ background: 'var(--primary-8, rgba(19, 245, 132, 0.08))' }}
              />
              {/* Description skeleton */}
              <div
                className="h-4 rounded animate-pulse w-64"
                style={{ background: 'var(--primary-8, rgba(19, 245, 132, 0.08))' }}
              />
            </div>
            <div className="flex gap-2">
              {/* Action buttons skeleton */}
              <div
                className="w-10 h-10 rounded-full animate-pulse"
                style={{ background: 'var(--primary-8, rgba(19, 245, 132, 0.08))' }}
              />
              <div
                className="w-10 h-10 rounded-full animate-pulse"
                style={{ background: 'var(--primary-8, rgba(19, 245, 132, 0.08))' }}
              />
            </div>
          </div>

          {/* Content skeleton */}
          <div className="space-y-3">
            <div className="query-content-gradient rounded-[16px] overflow-hidden">
              <div className="p-4">
                {/* Multiple lines of content skeleton */}
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-4 rounded animate-pulse mb-2 ${
                      index === 0 ? 'w-3/4' : 
                      index === 1 ? 'w-1/2' : 
                      index === 2 ? 'w-5/6' : 
                      index === 3 ? 'w-2/3' : 
                      index === 4 ? 'w-4/5' : 
                      'w-1/2'
                    }`}
                    style={{ background: 'var(--primary-8, rgba(19, 245, 132, 0.08))' }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
