import React from 'react';
import { AdminServiceServer } from '@/services/adminServiceServer';
import { WorkspacesClient } from '@/components/admin/WorkspacesClient';

export const dynamic = 'force-dynamic';

export default async function WorkspacesPage() {
    const initialWorkspaces = await AdminServiceServer.getAllWorkspaces();
    return <WorkspacesClient initialWorkspaces={initialWorkspaces} />;
}
