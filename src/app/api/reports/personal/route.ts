import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, getSupabaseFromRequest } from '@/lib/server-utils';

// Force dynamic to ensure we get fresh data
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseFromRequest(request);
        if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

        const userId = user.uid;

        // Fetch tasks assigned to the current user strictly from Supabase
        const { data: taskList, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('assigned_to_id', userId)
            .eq('is_archived', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[API] Personal Reports Fetch Error:', error);
            // Return empty stats instead of erroring for a smoother UI experience
            return NextResponse.json({
                stats: { pending: 0, dueSoon: 0, overdue: 0, completionRate: 0, totalAssigned: 0 },
                chartData: [],
                recentActivity: []
            });
        }

        const now = new Date();
        const twoDaysFromNow = new Date();
        twoDaysFromNow.setDate(now.getDate() + 2);

        // Stats Calculation
        let pending = 0;
        let completed = 0;
        let overdue = 0;
        let dueSoon = 0;

        // For Chart (Last 7 days completed)
        const last7DaysMap = new Map<string, number>();
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7DaysMap.set(d.toISOString().split('T')[0], 0);
        }

        (taskList || []).forEach((t: any) => {
            const status = String(t.status || '').toLowerCase();
            if (status === 'done' || status === 'completed') {
                completed++;
                // Check if completed in last 7 days for chart
                const doneDate = new Date(t.updated_at || t.created_at).toISOString().split('T')[0];
                if (last7DaysMap.has(doneDate)) {
                    last7DaysMap.set(doneDate, (last7DaysMap.get(doneDate) || 0) + 1);
                }
            } else {
                pending++;
                if (t.due_date) {
                    const dueDate = new Date(t.due_date);
                    if (dueDate < now) {
                        overdue++;
                    } else if (dueDate <= twoDaysFromNow) {
                        dueSoon++;
                    }
                }
            }
        });

        const totalAssigned = pending + completed;
        const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;

        // Chart Data
        const chartData = Array.from(last7DaysMap.entries())
            .map(([date, count]) => ({ date, count }))
            .reverse();

        // Recent Activity (Last 5 completed)
        const recentActivity = (taskList || [])
            .filter((t: any) => {
                const status = String(t.status || '').toLowerCase();
                return status === 'done' || status === 'completed';
            })
            .slice(0, 5)
            .map((t: any) => ({
                id: t.id,
                title: t.title,
                completed_at: t.updated_at || t.created_at
            }));

        return NextResponse.json({
            stats: {
                pending,
                dueSoon,
                overdue,
                completionRate,
                totalAssigned
            },
            chartData,
            recentActivity
        });

    } catch (error: any) {
        console.error('[API] Personal Reports Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
