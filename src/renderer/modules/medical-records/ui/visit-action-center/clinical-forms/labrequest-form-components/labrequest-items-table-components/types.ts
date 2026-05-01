import type React from 'react';
import type {
  LabRequestItemStatus as LabRequestItemStatusType,
  LabRequestItemWithTest,
  LabRequestWithItems,
  LabResult,
} from '../../../../../api/lab/LabTypes';
import type { ColorTokens, LabRequestDraftItem } from '../labRequestForm.types';

export interface LabRequestItemsTableProps {
  isDark: boolean;
  colors: ColorTokens;
  request: LabRequestWithItems | null;
  items: LabRequestDraftItem[];
  onAddItem: () => void;
  onEditItem: (item: LabRequestDraftItem) => void;
  onDeleteItem: (item: LabRequestDraftItem) => void;
  onManageLabItems: () => void;
}

export type LabRequestItemsTableRow = {
  key: React.Key;
  draftItem: LabRequestDraftItem;
  persistedItem: LabRequestItemWithTest | null;
  index: number;
  isDraft: boolean;
  status: LabRequestItemStatusType;
  isCancelled: boolean;
  isLocked: boolean;
  workflowStep: number;
  results: LabResult[];
  hasResults: boolean;
  hasCriticalResults: boolean;
  hasAbnormalResults: boolean;
  displayName: string;
  category: string | null;
  code: string | null;
  sampleType: string | null;
  sampleIdentifier: string | null;
  requiresFasting: boolean;
  turnaroundTimeHours: number | null;
  notes: string | null;
};

export type LabRequestItemsTableStats = {
  pendingItems: number;
  inProgressItems: number;
  completedItems: number;
  cancelledItems: number;
  draftItems: number;
};
