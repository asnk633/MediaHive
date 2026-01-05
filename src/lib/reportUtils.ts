import { Task } from "@/types/task";
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
        const assignees = task.assignedTo?.map((a: any) => typeof a === 'string' ? a : a.name).join(", ") || "Unassigned";

        return [
            task.title ? `"${task.title.replace(/"/g, '""')}"` : "",
            task.priority || "",
            task.status || "",
            task.assignedBy?.name || "Unknown",
            `"${assignees.replace(/"/g, '""')}"`,
            task.createdAt?.seconds ? format(new Date(task.createdAt.seconds * 1000), "yyyy-MM-dd") : "",
            task.dueDate?.seconds ? format(new Date(task.dueDate.seconds * 1000), "yyyy-MM-dd") : "",
            task.completedAt?.seconds ? format(new Date(task.completedAt.seconds * 1000), "yyyy-MM-dd") : ""
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
