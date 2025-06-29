// src/api/index.ts

import { supabase } from ".";
import type { TTaskWithUnits, TMeasurementUnit } from ".";

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
        id,
        title
      )
    `,
    )
    .eq("type", type);

  if (result.error) {
    throw new Error(`${result.error.message} (${result.status})`);
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
        id,
        title
      )
    `,
    )
    .eq("id", id)
    .limit(1)
    .single();

  if (result.error) {
    throw new Error(`${result.error.message} (${result.status})`);
  }
  return result.data;
};

export const saveTask = async (data: object, projectId?: string) => {
  let result;
  if (projectId) {
    result = await supabase.from("tasks").update(data).eq("id", projectId);
  } else {
    result = await supabase.from("tasks").insert(data);
  }
  if (result.error) {
    throw new Error(`${result.error.message} (${result.status})`);
  }
  return result.data;
};

export const fetchUnits = async (): Promise<TMeasurementUnit[]> => {
  const { data, error } = await supabase
    .from("measurement_units")
    .select("id, title");

  if (error) {
    throw new Error(`${error.name} (${error.message} / ${error.details})`);
  }

  // data может быть null, приводим к пустому массиву
  return data ?? [];
};

export const deleteTaskById = async (
  id: string,
): Promise<Partial<TTaskWithUnits>> => {
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .select(`id`)
    .single();

  if (error) {
    throw new Error(`${error.name} (${error.details} ${error.message})`);
  }

  return data;
};

export const assignUserToTask = async (
  taskId: string,
  userId: string,
  startDate: string,
  endDate?: string,
) => {
  const records = [
    {
      task_id: taskId,
      user_id: userId,
      assigned_at: startDate,
      status: "ACTIVE",
    },
  ];

  if (endDate) {
    records.push({
      task_id: taskId,
      user_id: userId,
      assigned_at: endDate,
      status: "REMOVED",
    });
  }

  const { data, error } = await supabase
    .from("task_assignment")
    .insert(records)
    .select("id, task_id, user_id, assigned_at, status");

  if (error) {
    throw new Error(`Ошибка назначения: ${error.message} (${error.code})`);
  }

  return data;
};
