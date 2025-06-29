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
import { useAuthUser } from "../../hooks";
import { ProjectForm } from "../projectForm";

export const Project: React.FC = () => {
  const { task } = useOutletContext<{ task: TTaskWithUnits }>();
  const user = useAuthUser();
  const isAuthor = user.id === task.creatorId;
  const getTaskById = useAppStore((s) => s.tasksStore.getTaskById);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (data: Record<string, any>) => {
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
          <DescriptionTerm>Title</DescriptionTerm>
          <DescriptionDetails>{task.title}</DescriptionDetails>

          <DescriptionTerm>Description</DescriptionTerm>
          <DescriptionDetails>{task.description}</DescriptionDetails>

          <DescriptionTerm>Start</DescriptionTerm>
          <DescriptionDetails>{task.startDate}</DescriptionDetails>

          <DescriptionTerm>End</DescriptionTerm>
          <DescriptionDetails>{task.endDate}</DescriptionDetails>

          {task.amount && (
            <>
              <DescriptionTerm>Amount</DescriptionTerm>
              <DescriptionDetails>
                {task.amount} {task.measurementUnits.title}
              </DescriptionDetails>
            </>
          )}

          <DescriptionTerm>Status</DescriptionTerm>
          <DescriptionDetails>{task.status}</DescriptionDetails>
        </DescriptionList>
      )}
    </>
  );
};

// import { useOutletContext } from "react-router";
// import {
//   DescriptionDetails,
//   DescriptionList,
//   DescriptionTerm,
// } from "../catalyst";
// import type { TTaskWithUnits } from "../../api";

// export const Project = () => {
//   const { task } = useOutletContext<{ task: TTaskWithUnits }>();
//   return (
//     <DescriptionList>
//       <DescriptionTerm>Title</DescriptionTerm>
//       <DescriptionDetails>{task.title}</DescriptionDetails>

//       <DescriptionTerm>Description</DescriptionTerm>
//       <DescriptionDetails>{task.description}</DescriptionDetails>

//       <DescriptionTerm>Start</DescriptionTerm>
//       <DescriptionDetails>{task.startDate}</DescriptionDetails>

//       <DescriptionTerm>End</DescriptionTerm>
//       <DescriptionDetails>{task.endDate}</DescriptionDetails>

//       {task.amount && (
//         <>
//           <DescriptionTerm>amount</DescriptionTerm>
//           <DescriptionDetails>
//             {task.amount} {task.measurementUnits.title}
//           </DescriptionDetails>
//         </>
//       )}

//       <DescriptionTerm>status</DescriptionTerm>
//       <DescriptionDetails>{task.status}</DescriptionDetails>
//     </DescriptionList>
//   );
// };
