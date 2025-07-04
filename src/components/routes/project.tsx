import React, { useState } from "react";
import { useOutletContext } from "react-router";
import { saveTask } from "../../api";
import type { TTaskWithUnits } from "../../api";
import { useAppStore } from "../../store";
import { Button } from "../catalyst";
import { Loader } from "../loader";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "../catalyst";
import { ProjectForm, type TTaskFormDefaults } from "../projectForm";

export const Project: React.FC = () => {
  const { task, isAuthor } = useOutletContext<{
    task: TTaskWithUnits;
    isAuthor: boolean;
  }>();

  const getTaskById = useAppStore((s) => s.tasksStore.getTaskById);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (data: TTaskFormDefaults) => {
    if (!task.id) {
      throw new Error("Incorrect task id");
    }
    setSaving(true);
    try {
      await saveTask(data, task.id);
      await getTaskById(task.id);
      setEditing(false);
    } catch (error) {
      console.error("Error saving task:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!task) {
    return <Loader />;
  }

  return (
    <>
      {isAuthor && !editing && (
        <Button onClick={() => setEditing(true)}>Edit</Button>
      )}

      {editing ? (
        <ProjectForm
          initialData={{
            ...task,
          }}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
          saving={saving}
        />
      ) : (
        <DescriptionList>
          <div className="flex justify-between">
            <DescriptionTerm>Title</DescriptionTerm>
            <DescriptionDetails>{task.title}</DescriptionDetails>
          </div>
          <div className="flex justify-between">
            <DescriptionTerm>Description</DescriptionTerm>
            <DescriptionDetails>{task.description}</DescriptionDetails>
          </div>
          <div className="flex justify-between">
            <DescriptionTerm>Start</DescriptionTerm>
            <DescriptionDetails>{task.startDate}</DescriptionDetails>
          </div>
          <div className="flex justify-between">
            <DescriptionTerm>End</DescriptionTerm>
            <DescriptionDetails>{task.endDate}</DescriptionDetails>
          </div>

          {task.amount && (
            <div className="flex justify-between">
              <DescriptionTerm>Amount</DescriptionTerm>
              <DescriptionDetails>
                {task.amount} {task.measurementUnits.title}
              </DescriptionDetails>
            </div>
          )}
          <div className="flex justify-between">
            <DescriptionTerm>Status</DescriptionTerm>
            <DescriptionDetails>{task.status}</DescriptionDetails>
          </div>
        </DescriptionList>
      )}
    </>
  );
};
