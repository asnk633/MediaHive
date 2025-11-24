export type UserRole = 'admin' | 'team' | 'guest';

export interface User {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  institutionId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Institution {
  id: number;
  name: string;
  createdAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'pending';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId: number | null;
  createdById: number;
  institutionId: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: number;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  approvalStatus: 'pending' | 'approved' | 'declined';
  createdById: number;
  institutionId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata: any;
  createdAt: string;
}

export interface Attendance {
  id: number;
  userId: number;
  checkIn: string;
  checkOut: string | null;
  institutionId: number;
  createdAt: string;
}

export type FileVisibility = 'all' | 'team' | 'guest';

export interface File {
  id: number;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  folder: string | null;
  visibility: FileVisibility;
  uploadedById: number;
  institutionId: number;
  createdAt: string;
}

export interface TaskComment {
  id: number;
  taskId: number;
  userId: number;
  comment: string;
  createdAt: string;
}

export interface Attachment {
  id: number;
  taskId: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedById: number;
  createdAt: string;
}
