// src/api/index.ts

import { AssignmentStatus, supabase } from ".";
import type {
  TTaskWithUnits,
  TMeasurementUnit,
  TAssignmentStatus,
  TAssignment,
} from ".";

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
    .eq("type", type)
    .overrideTypes<TTaskWithUnits[]>();

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
    .single()
    .overrideTypes<TTaskWithUnits>();

  if (result.error) {
    throw new Error(`${result.error.message} (${result.status})`);
  }
  return result.data;
};

export const saveTask = async (data: object, projectId?: string) => {
  let result;
  try {
    if (projectId) {
      result = await supabase.from("tasks").update(data).eq("id", projectId);
    } else {
      result = await supabase.from("tasks").insert(data).select("*");
    }
    console.log("result", result);
    if (result.error) {
      throw new Error(`${result.error.message} (${result.status})`);
    }
  } catch (err) {
    console.error(err);
  }
};

export const fetchUnits = async (): Promise<TMeasurementUnit[]> => {
  const { data, error } = await supabase
    .from("measurement_units")
    .select("id, title")
    .overrideTypes<TMeasurementUnit[]>();

  if (error) {
    throw new Error(`${error.name} (${error.message} / ${error.details})`);
  }

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
    .single()
    .overrideTypes<TTaskWithUnits>();

  if (error) {
    throw new Error(`${error.name} (${error.details} ${error.message})`);
  }

  return data;
};

export const saveAssignment = async (
  taskId: string,
  userId: string,
  startDate: string,
  endDate?: string,
): Promise<TAssignment> => {
  const records: Array<{
    task_id: string;
    user_id: string;
    status: TAssignmentStatus;
    assigned_at: string;
  }> = [];

  records.push({
    task_id: taskId,
    user_id: userId,
    status: AssignmentStatus.ACTIVE,
    assigned_at: startDate,
  });

  if (endDate) {
    records.push({
      task_id: taskId,
      user_id: userId,
      status: AssignmentStatus.REMOVED,
      assigned_at: endDate,
    });
  }

  const { data, error } = await supabase
    .from("task_assignment")
    .insert(records)
    .select(
      `
      id,
      userId:user_id,
      taskId:task_id,
      status,
      assignedAt:assigned_at
    `,
    )
    .overrideTypes<
      {
        id: string;
        userId: string;
        taskId: string;
        status: TAssignmentStatus;
        assignedAt: string;
      }[]
    >();

  if (error) {
    throw new Error(
      `saveAssignment error: ${error.name} (${error.message} ${error.details})`,
    );
  }

  const result: TAssignment = {
    ...data[0],
    startDate: data[0].assignedAt,
    endDate: data?.[1].assignedAt ?? null,
  };

  return result;
};

export const fetchAssignments = async (
  taskId: string,
): Promise<TAssignment[]> => {
  const { data, error } = await supabase
    .from("task_assignment_intervals")
    .select(
      `
      assignmentId:assignment_id,
      taskId:task_id,
      taskTitle:task_title,
      userId:user_id,
      userFirstName:user_first_name,
      userLastName:user_last_name,
      userEmail:user_email,
      creatorFirstName:creator_first_name,
      creatorLastName:creator_last_name,
      creatorEmail:creator_email,
      startDate:start_date,
      endDate:end_date
      `,
    )
    .eq("task_id", taskId)
    .order("user_id", { ascending: true })
    .order("start_date", { ascending: true })
    .overrideTypes<TAssignment[]>();

  if (error) {
    throw new Error(
      `fetchAssignments error: ${error.name} (${error.message} ${error.details})`,
    );
  }
  return data;
};

export const deleteAssignment = async (
  assignmentId: string,
): Promise<{ id: string; taskId: string }> => {
  const { data, error } = await supabase
    .from("task_assignment")
    .delete()
    .eq("id", assignmentId)
    .select("id, taskId:task_id")
    .single()
    .overrideTypes<{ id: string; taskId: string }>();

  if (error) {
    throw new Error(
      `deleteAssignment error: ${error.name} (${error.message} ${error.details})`,
    );
  }
  return data;
};
