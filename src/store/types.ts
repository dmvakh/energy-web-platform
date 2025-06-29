import type { FileObject } from "@supabase/storage-js";
import type { TTaskWithUnits, TMeasurementUnit } from "../api";

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

type TDocumentsSubStore = {
  loading: boolean;
  fetched: boolean;
  documents: {
    personal: FileObject[];
    tasks: {
      [key: string]: FileObject[];
    };
  };
  getTaskDocuments: (path: string) => Promise<void>;
};

export type TAppStore = {
  tasksStore: TTasksSubStore;
  documentsStore: TDocumentsSubStore;
  globalLoading: boolean;
};
