import { Task } from "@/features/tasks/types/task";
import { format } from "date-fns";
// Manual CSV generator to avoid extra deps
export function generateTaskCSV(tasks: Task[]): string {
    const headers = [
        "Task Title",
        "Priority",
        "Status",
        "Asked By",
        "Assignee(s)",
        "Created Date",
        "Due Date",
        "Completed Date"
    ];

    const rows = tasks.map(task => {
        const assignees = task.assigned_to?.map((a: any) => typeof a === 'string' ? a : a.name).join(", ") || "Unassigned";

        return [
            task.title ? `"${task.title.replace(/"/g, '""')}"` : "",
            task.priority || "",
            task.status || "",
            task.assigned_by?.name || "Unknown",
            `"${assignees.replace(/"/g, '""')}"`,
            task.created_at?.seconds ? format(new Date(task.created_at.seconds * 1000), "yyyy-MM-dd") : "",
            task.due_date?.seconds ? format(new Date(task.due_date.seconds * 1000), "yyyy-MM-dd") : "",
            task.completed_at?.seconds ? format(new Date(task.completed_at.seconds * 1000), "yyyy-MM-dd") : ""
        ];
    });

    return [
        headers.join(","),
        ...rows.map(row => row.join(","))
    ].join("\n");
}

export const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
