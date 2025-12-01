import React from 'react';
import { BusinessRulesEditor } from './components';
import { BusinessRulesSkeleton } from '@/components/ui/loading';
import type { BusinessRulesTabProps } from '../../../types';

export const BusinessRulesTab = React.memo<BusinessRulesTabProps>(({
  currentDatabaseId,
  currentDatabaseName,
  businessRules,
  businessRulesCount,
  hasBusinessRules,
  editorState,
  loading = false,
  onRefresh,
  onEdit,
  onSave,
  onCancel,
  onContentChange,
}) => {
  if (loading) {
    return <BusinessRulesSkeleton />;
  }

  return (
    <div>
      <BusinessRulesEditor
        currentDatabaseId={currentDatabaseId}
        businessRules={businessRules}
        editorState={editorState}
        onContentChange={onContentChange}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
      />
    </div>
  );
});

BusinessRulesTab.displayName = 'BusinessRulesTab';
