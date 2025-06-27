import { useOutletContext } from "react-router";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "../catalyst";
import type { TTaskWithUnits } from "../../api";

export const Project = () => {
  const { task } = useOutletContext<{ task: TTaskWithUnits }>();
  // TODO: get task by id and save to store (if user reload page)
  return (
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
          <DescriptionTerm>amount</DescriptionTerm>
          <DescriptionDetails>
            {task.amount} {task.measurementUnits.title}
          </DescriptionDetails>
        </>
      )}

      <DescriptionTerm>status</DescriptionTerm>
      <DescriptionDetails>{task.status}</DescriptionDetails>
    </DescriptionList>
  );
};
