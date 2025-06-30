export const TaskStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  REVIEW: "REVIEW",
  COMPLETED: "COMPLETED",
};

export const TaskType = {
  TASK: "TASK",
  PROJECT: "PROJECT",
};

export type TMeasurementUnit = {
  id: string;
  title: string;
};

export type TTaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
export type TTaskType = (typeof TaskType)[keyof typeof TaskType];
// export type TTaskStatus = "PENDING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
// export type TTaskType = "TASK" | "PROJECT";
export type TTaskWithUnits = {
  id: string;
  createdAt: string;
  title: string;
  description: string;
  creatorId: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: TTaskStatus;
  type: TTaskType;
  parentId?: string;
  files: string | null;
  measurementUnits: TMeasurementUnit;
};

export const UserRoles = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  FOREMAN: "FOREMAN",
  WORKER: "WORKER",
} as const;

export type TUserRoles = (typeof UserRoles)[keyof typeof UserRoles];

export type TAssignment = {
  id: string;
  userId: string;
  taskId: string;
  startDate: string;
  endDate: string | null;
  taskTitle?: string;
  userEmail?: string;
};

export const AssignmentStatus = {
  ACTIVE: "ACTIVE",
  REMOVED: "REMOVED",
};

export type TAssignmentStatus =
  (typeof AssignmentStatus)[keyof typeof AssignmentStatus];
