export interface Task {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high';
    dueDate: any; // Firestore Timestamp
    department: string;
    assignedBy: {
        uid: string;
        name: string;
        role: string;
    };
    assignedTo?: {
        uid: string;
        name: string;
        // role is optional here
    };
    createdAt: any;
}
