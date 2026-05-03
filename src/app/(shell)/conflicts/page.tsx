/**
 * Phase 8B: Conflict Resolution Center Page
 * 
 * Dedicated page route for the Conflict Resolution Center
 */

import { ConflictResolutionCenter } from './ConflictResolutionCenter';
import { PageLayout } from '@/components/ui/layout/PageLayout';

export default function ConflictResolutionPage() {
  return (
    <PageLayout>
      <ConflictResolutionCenter />
    </PageLayout>
  );
}
