import type { TTaskWithUnits } from "../../api";

export interface ProjectFormProps {
  initialData: Partial<TTaskWithUnits>;
  onSave: (data: Record<string, any>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}
