import React, { useState } from "react";
import { Button } from "../catalyst";
import type { ProjectFormProps, TTaskFormDefaults } from ".";
import { useAppStore } from "../../store";
import { TaskStatus, TaskType } from "../../api";
import { dateToInputFormat } from "../../utils";

export const ProjectForm: React.FC<ProjectFormProps> = ({
  initialData,
  onSave,
  onCancel,
  saving,
}) => {
  const { units, unitsLoading } = useAppStore((s) => s.tasksStore);
  const defaults: TTaskFormDefaults = {
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    start_date: initialData?.startDate ?? dateToInputFormat(),
    end_date: initialData?.endDate ?? "",
    amount: initialData?.amount ?? 0,
    status: initialData?.status ?? TaskStatus.PENDING,
    type: initialData?.type ?? TaskType.PROJECT,
    parent_id: initialData?.parentId ?? null,
    units_id: initialData?.measurementUnits?.id ?? "",
  };

  if (initialData?.id) {
    defaults.id = initialData.id;
  }

  const [formValues, setFormValues] = useState(defaults);
  const isNew = !formValues.id;
  const submitLabel = saving
    ? isNew
      ? "Creating..."
      : "Saving..."
    : isNew
      ? "Create"
      : "Save";

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ ...formValues });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          name="title"
          value={formValues.title}
          onChange={handleChange}
          className="mt-1 block w-full rounded border p-2"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea
          name="description"
          value={formValues.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded border p-2"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Start</label>
          <input
            type="date"
            name="start_date"
            value={formValues.start_date}
            onChange={handleChange}
            className="mt-1 block w-full rounded border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">End</label>
          <input
            type="date"
            name="end_date"
            value={formValues.end_date}
            onChange={handleChange}
            className="mt-1 block w-full rounded border p-2"
          />
        </div>
      </div>

      {/* Amount & Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Amount</label>
          <input
            type="number"
            name="amount"
            value={formValues.amount}
            onChange={handleChange}
            className="mt-1 block w-full rounded border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Status</label>
          <select
            name="status"
            value={formValues.status}
            onChange={handleChange}
            className="mt-1 block w-full rounded border p-2"
          >
            {Object.values(TaskStatus).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Units */}
      <div>
        <label className="block text-sm font-medium">Units</label>
        <select
          name="units_id"
          value={formValues.units_id}
          onChange={handleChange}
          disabled={unitsLoading}
          className="mt-1 block w-full rounded border p-2 bg-white disabled:opacity-50"
        >
          {unitsLoading ? (
            <option>Loading units...</option>
          ) : (
            <>
              <option value="">Select unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.title}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      {/* Submit / Cancel */}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {submitLabel}
        </Button>
        <Button type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
