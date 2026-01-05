export type UiStatus = "Pending" | "To Do" | "In Progress" | "On Hold" | "Review" | "Done";
export type ApiStatus = "pending" | "todo" | "in_progress" | "on_hold" | "review" | "done";

export const uiFromApiStatus = (s?: string): UiStatus => {
  switch (s) {
    case "todo": return "To Do";
    case "in_progress": return "In Progress";
    case "on_hold": return "On Hold";
    case "review": return "Review";
    case "done": return "Done";
    default: return "Pending";
  }
};

export const apiFromUiStatus = (u: string): ApiStatus => {
  switch (u) {
    case "To Do": return "todo";
    case "In Progress": return "in_progress";
    case "On Hold": return "on_hold";
    case "Review": return "review";
    case "Done": return "done";
    default: return "pending";
  }
};
