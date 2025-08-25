import type { FileObject } from "@supabase/storage-js";
import type {
  TTaskWithUnits,
  TMeasurementUnit,
  TAssignment,
  TContract,
  TContractPayload,
  Wallet,
  Payment,
  createPayment,
} from "../api";

type TTasksSubStore = {
  tasks: TTaskWithUnits[];
  units: TMeasurementUnit[];
  loading: boolean;
  unitsLoading: boolean;
  fetched: boolean;
  selectedTask: TTaskWithUnits | null;
  setTask: (id: string) => void;
  resetTask: () => void;
  getTasks: () => Promise<void>;
  getTaskById: (id: string) => Promise<void>;
  getUnits: () => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
};

export type TDocuments = {
  personal: FileObject[];
  tasks: {
    [key: string]: FileObject[];
  };
};

type TDocumentsSubStore = {
  loading: boolean;
  fetched: boolean;
  documents: TDocuments;
  getTaskDocuments: (path: string) => Promise<void>;
};

type TAssignmentsSubStore = {
  assignments: Record<string, TAssignment[]>;
  loading: boolean;
  getAssignments: (taskId: string) => Promise<void>;
  createAssignment: (
    taskId: string,
    userId: string,
    startDate: string,
    endDate?: string,
  ) => Promise<void>;
  deleteAssignment: (assignmentIds: string[]) => Promise<void>;
};

export type TContractsStore = {
  contracts: TContract[];
  selected: TContract | null;
  loading: boolean;
  fetched: boolean;
  getList: () => Promise<void>;
  getById: (id: string) => Promise<void>;
  create: (payload: TContractPayload) => Promise<TContract>;
  save: (id: string, payload: Partial<TContractPayload>) => Promise<TContract>;
  delete: (id: string) => Promise<void>;
  uploadFile: (path: string, file: File) => Promise<string>;
};

export type TPaymentsStore = {
  walletsByUser: Record<string, Wallet[]>;
  paymentsByProject: Record<string, Payment[]>;
  myPayments: Payment[];
  loading: boolean;

  getWallets: (userId: string) => Promise<void>;
  getProjectPayments: (projectId: string) => Promise<void>;
  getMyPayments: () => Promise<void>;
  createPayment: (
    payload: Parameters<typeof createPayment>[0],
  ) => Promise<Payment>;

  updatePaymentStatus: (
    id: string,
    status: "pending" | "captured" | "failed",
  ) => Promise<Payment>;
};

export type TAppStore = {
  tasksStore: TTasksSubStore;
  documentsStore: TDocumentsSubStore;
  assignmentsStore: TAssignmentsSubStore;
  contractsStore: TContractsStore;
  paymentsStore: TPaymentsStore;
};
