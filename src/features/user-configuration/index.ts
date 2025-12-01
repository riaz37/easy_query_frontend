// Main component
export { UserConfiguration } from './UserConfiguration';

// Tab components
export { OverviewTab } from './tabs/overview/OverviewTab';
export { DatabaseTab } from './tabs/database/DatabaseTab';
export { BusinessRulesTab } from './tabs/business-rules/BusinessRulesTab';
export { ReportStructureTab } from './tabs/report-structure/ReportStructureTab';

// Individual components
export { UserInfoCard, CurrentStatusCard, QuickActionsCard } from './tabs/overview/components';
export { DatabaseSelectionCard, DatabaseCard } from './tabs/database/components';
export { BusinessRulesEditor } from './tabs/business-rules/components';

// Hooks
export { useUserConfiguration } from './hooks/useUserConfiguration';
export { useBusinessRulesEditor } from './hooks/useBusinessRulesEditor';

// Types
export type * from './types';
