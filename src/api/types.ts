export type TTaskStatus = "PENDING" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
export type TTaskType = "TASK" | "PROJECT";
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
  files: string | null;
  measurementUnits: {
    title: string;
  };
};
