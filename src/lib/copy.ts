
export const COPY = {
    toasts: {
        taskCreated: "Task queued.",
        taskUpdated: "Changes saved.",
        taskDeleted: "Task removed.",
        rateLimit: "Requests are coming too fast. Try again in a moment.",
        copied: "Copied to clipboard.",
        genericError: "We couldn't complete that.",
        saved: "Saved.",
    },
    errors: {
        generic: "Something went wrong.",
        network: "Connection lost. Please check your internet.",
        taskMissing: "Needs a title to continue.",
        unauthorized: "Session expired. Please sign in.",
        forbidden: "You don't have permission for this.",
        notFound: "We couldn't find that item.",
        server: "Our servers are having trouble. Retrying...",
    },
    emptyStates: {
        tasks: {
            all: "No tasks found.",
            today: "Nothing due today.",
            upcoming: "No upcoming tasks.",
            done: "No completed tasks yet.",
            filter: "No tasks match your filters.",
        },
        notifications: {
            empty: "You're all caught up.",
        },
        generic: "Nothing here yet.",
    },
    actions: {
        save: "Save Changes",
        cancel: "Cancel",
        retry: "Try Again",
        confirm: "Confirm",
        delete: "Delete",
        create: "Create",
        update: "Update",
        back: "Go Back",
    },
    validation: {
        required: "This is required.",
        pickDate: "Set due date",
        invalidEmail: "Please use a valid email.",
        minLength: (min: number) => `Must be at least ${min} characters.`,
    },
    labels: {
        description: "Description",
        created_by: "Created By",
        assigned_to: "Assigned To",
        due_date: "Due Date",
        priority: "Priority",
        status: "Status",
    },
    placeholders: {
        taskTitle: "What needs to be done?",
        taskDescription: "Add details...",
        search: "Search...",
        select: "Select...",
    }
} as const;
