import { supabase } from ".";
import type { TTaskWithUnits } from ".";

export const fetchTasks = async (type: string): Promise<TTaskWithUnits[]> => {
  const result = await supabase
    .from("tasks")
    .select(
      `
      id,
      createdAt:created_at,
      title,
      description,
      creatorId:creator_id,
      startDate:start_date,
      endDate:end_date,
      amount,
      status,
      type,
      parentId:parent_id,
      files,
      measurementUnits:measurement_units (
        title
      )
    `,
    )
    .eq("type", type);

  if (result.error) {
    throw Error(`${result.error} ${result.statusText}`);
  }

  return result.data;
};

export const fetchTaskById = async (id: string): Promise<TTaskWithUnits> => {
  const result = await supabase
    .from("tasks")
    .select(
      `
      id,
      createdAt:created_at,
      title,
      description,
      creatorId:creator_id,
      startDate:start_date,
      endDate:end_date,
      amount,
      status,
      type,
      parentId:parent_id,
      files,
      measurementUnits:measurement_units (
        title
      )
    `,
    )
    .eq("id", id)
    .limit(1)
    .single();

  if (result.error) {
    throw Error(`${result.error} ${result.statusText}`);
  }
  return result.data;
};

export const saveTask = async (data: object, projectId?: number) => {
  let result;
  if (projectId) {
    result = await supabase.from("tasks").update(data).eq("id", projectId);
  } else {
    result = await supabase.from("tasks").insert(data);
  }
  if (result.error) {
    throw Error(`${result.error} ${result.statusText}`);
  }
  return result.data;
};
