import type { TTaskStatus, TTaskType, TTaskWithUnits } from "../../api";

export interface ProjectFormProps {
  initialData: Partial<TTaskWithUnits>;
  onSave: (data: Record<string, any>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

export type TTaskFormDefaults = {
  id?: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  amount: number;
  status: TTaskStatus;
  type: TTaskType;
  parent_id: string | null;
  units_id: string;
};
