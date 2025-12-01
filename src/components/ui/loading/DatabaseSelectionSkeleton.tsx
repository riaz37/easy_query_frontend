import React from 'react';
import { cn } from '@/lib/utils';
import { DatabaseCardSkeleton } from './DatabaseCardSkeleton';

interface DatabaseSelectionSkeletonProps {
  className?: string;
  cardCount?: number;
  showHeader?: boolean;
  showFooter?: boolean;
  databaseCount?: number;
}

export const DatabaseSelectionSkeleton: React.FC<DatabaseSelectionSkeletonProps> = ({
  className,
  cardCount = 6,
  showHeader = true,
  showFooter = true,
  databaseCount
}) => {
  // Force cardCount to be exactly 6 for pagination consistency
  const skeletonCount = 6;

  return (
    <div className={cn("query-content-gradient rounded-[32px] p-4 lg:p-6", className)}>
      <div className="space-y-4">
        {showHeader && (
          <div className="mb-4 lg:mb-6">
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
        )}

        <div className="space-y-4">
          {/* Database cards grid - Always show exactly 6 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: skeletonCount }).map((_, index) => (
              <DatabaseCardSkeleton
                key={`database-card-skeleton-${index}`}
                isSelected={index === 0} // First card appears selected
              />
            ))}
          </div>

          {/* Pagination skeleton - Matching UsersTableSection style */}
          <div className="users-pagination">
            {/* Left: Database Count skeleton */}
            <div className="users-pagination-info">
              <div
                className="h-4 rounded animate-pulse w-32"
                style={{ background: 'var(--primary-8, rgba(19, 245, 132, 0.08))' }}
              />
            </div>

            {/* Right side: Page Info and Controls skeleton */}
            <div className="users-pagination-controls">
              <div className="users-page-controls">
                <div
                  className="h-4 rounded animate-pulse w-20 mb-2"
                  style={{ background: 'var(--primary-8, rgba(19, 245, 132, 0.08))' }}
                />
                <div className="flex gap-1">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="users-page-button opacity-50"
                      style={{
                        background: 'var(--primary-8, rgba(19, 245, 132, 0.08))',
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
