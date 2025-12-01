import React from 'react';
import { cn } from '@/lib/utils';

interface ReportStructureSkeletonProps {
  className?: string;
}

export const ReportStructureSkeleton: React.FC<ReportStructureSkeletonProps> = ({
  className,
}) => {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Section */}
      <div className="query-content-gradient rounded-[32px] p-4 lg:p-6">
        <div className="space-y-4">
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
                className="w-12 h-12 rounded-full animate-pulse"
                style={{ background: 'var(--primary-8, rgba(19, 245, 132, 0.08))' }}
              />
              <div
                className="w-12 h-12 rounded-full animate-pulse"
                style={{ background: 'var(--primary-8, rgba(19, 245, 132, 0.08))' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Report Structures List Skeleton */}
      <div className="space-y-6">
        {/* Show 2-3 skeleton report items */}
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="query-content-gradient rounded-[32px] p-4 lg:p-6"
          >
            <div className="space-y-4">
              {/* Report Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  {/* Report title skeleton */}
                  <div
                    className="h-6 rounded animate-pulse w-40 mb-2"
                    style={{ background: 'var(--primary-8, rgba(19, 245, 132, 0.08))' }}
                  />
                  {/* Description skeleton */}
                  <div
                    className="h-4 rounded animate-pulse w-48"
                    style={{ background: 'var(--primary-8, rgba(19, 245, 132, 0.08))' }}
                  />
                </div>
                <div className="flex items-center gap-2">
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

              {/* Report content skeleton */}
              <div className="space-y-3">
                <div className="query-content-gradient rounded-[16px] overflow-hidden">
                  <div className="p-4">
                    {/* Multiple lines of content skeleton */}
                    {Array.from({ length: 4 }).map((_, lineIndex) => (
                      <div
                        key={lineIndex}
                        className={`h-4 rounded animate-pulse mb-2 ${
                          lineIndex === 0 ? 'w-3/4' : 
                          lineIndex === 1 ? 'w-1/2' : 
                          lineIndex === 2 ? 'w-5/6' : 
                          'w-2/3'
                        }`}
                        style={{ background: 'var(--primary-8, rgba(19, 245, 132, 0.08))' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
