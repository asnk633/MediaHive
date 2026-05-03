import React, { useEffect, useState } from 'react';
import { MediaTask as Task } from '@/services/tasks/taskContract';
import { CanonicalDataService } from '@/services/canonicalDataService';
import AdminConfidencePanel from './AdminConfidencePanel';
import { useAuth } from '@/contexts/AuthContextProvider';

interface TaskConfidenceViewProps {
    tasks: Task[];
    loading?: boolean;
    onTaskClick?: (task: Task) => void;
}

const TaskConfidenceViewComponent: React.FC<TaskConfidenceViewProps> = ({ tasks, loading = false, onTaskClick }) => {
    const { user } = useAuth();
    const [adminData, setAdminData] = useState({
        tasks: [] as Task[],
        events: [] as any[],
        mediaFiles: [] as any[],
        users: [] as any[]
    });

    useEffect(() => {
        const fetchAdminData = async () => {
            if (user?.role === 'admin') {
                const data = await CanonicalDataService.getAdminConfidenceData((user as any)?.institution_id);
                setAdminData(data);
            }
        };

        fetchAdminData();
    }, [user]);

    if (loading) {
        return (
            <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-sm p-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
            </div>
        );
    }

    if (user?.role !== 'admin') {
        return (
            <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-sm p-6 text-center">
                <p className="text-gray-400">Access denied. Admin privileges required.</p>
            </div>
        );
    }

    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-sm h-full" style={{ minHeight: '400px' }}>
            <AdminConfidencePanel
                tasks={adminData.tasks}
                events={adminData.events}
                mediaFiles={adminData.mediaFiles}
                users={adminData.users}
                institution_id={(user as any)?.institution_id}
                onTaskClick={onTaskClick}
            />
        </div>
    );
};

export const TaskConfidenceView = React.memo(TaskConfidenceViewComponent);
