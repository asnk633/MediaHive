export const STATUS_COLUMN_IDS = ["todo", "in_progress", "on_hold", "review", "done"];

export function mapStatusToColumnId(status: string) {
  switch (status) {
    case "pending":
    case "todo":
      return "todo";
    case "in_progress":
    case "inprogress":
    case "working":
      return "in_progress";
    case "on_hold":
    case "onhold":
      return "on_hold";
    case "review":
      return "review";
    case "done":
    case "completed":
      return "done";
    default:
      return "todo";
  }
}

