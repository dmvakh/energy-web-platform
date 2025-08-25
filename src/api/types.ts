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
  latePenaltyPerDay: number;
};

export const UserRoles = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  FOREMAN: "FOREMAN",
  WORKER: "WORKER",
} as const;

export type TUserRoles = (typeof UserRoles)[keyof typeof UserRoles];

export type TAssignment = {
  activeAssignmentId: string;
  removedAssignmentId: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  creatorFirstName: string;
  creatorLastName: string;
  creatorEmail: string;
  startDate: string;
  endDate: string;
};

export const AssignmentStatus = {
  ACTIVE: "ACTIVE",
  REMOVED: "REMOVED",
};

export type TAssignmentStatus =
  (typeof AssignmentStatus)[keyof typeof AssignmentStatus];

export type TUserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

// дополнение существующих типов

export type TContract = {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  user_a: string;
  user_b: string;
  file_url: string;
  date_signed_a: string | null;
  date_signed_b: string | null;
  status: string;
  creator_id: string;
  task_id: string;
  amount: number | null;
  tasks: {
    title: string;
    start_date: string;
    end_date: string;
  };
};

export type TContractPayload = {
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  user_a: string;
  user_b: string;
  file_url: string;
  creator_id: string;
  amount?: number | null;
  date_signed_a?: string;
  date_signed_b?: string;
};

export type ApiPayment = {
  id: string;
  payer_id: string;
  payee_id: string;
  project_id: string;
  task_id?: string | null;
  object_type: "contract" | "invoice";
  object_id?: string | null;
  wallet_id: string;
  amount: number;
  status: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiWallet = {
  id: string;
  user_id: string;
  currency: string;
  balance: number;
  created_at: string;
  updated_at: string;
};
