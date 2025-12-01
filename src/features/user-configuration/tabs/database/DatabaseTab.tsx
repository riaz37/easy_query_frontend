import React from 'react';
import { DatabaseSelectionCard } from './components';
import { DatabaseTabSkeleton } from '@/components/ui/loading';
import type { DatabaseTabProps } from '../../../types';

export const DatabaseTab = React.memo<DatabaseTabProps>(({
  databases,
  loading,
  onDatabaseChange,
}) => {
  if (loading) {
    return (
      <DatabaseTabSkeleton
        cardCount={databases.length > 0 ? databases.length : 6}
        showHeader={true}
        showFooter={true}
        databaseCount={databases.length}
      />
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <DatabaseSelectionCard
        databases={databases}
        loading={loading}
        onDatabaseChange={onDatabaseChange}
      />
    </div>
  );
});

DatabaseTab.displayName = 'DatabaseTab';
