// src/api/tasks.ts

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
      ),
      latePenaltyPerDay:late_penalty_per_day
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
): Promise<void> => {
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

  const { error } = await supabase.from("task_assignment").insert(records);

  if (error) {
    throw new Error(
      `saveAssignment error: ${error.name} (${error.message} ${error.details})`,
    );
  }
};

export const fetchAssignments = async (
  taskId: string,
): Promise<TAssignment[]> => {
  const { data, error } = await supabase
    .from("task_assignment_intervals")
    .select(
      `
      activeAssignmentId:active_assignment_id,
      removedAssignmentId:removed_assignment_id,
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
  assignmentIds: string[],
): Promise<{ id: string; taskId: string; status: string }[]> => {
  const { data, error } = await supabase
    .from("task_assignment")
    .delete()
    .in("id", assignmentIds)
    .select("id, taskId:task_id, status")
    .order("status", { ascending: true })
    .overrideTypes<{ id: string; taskId: string; status: string }[]>();

  if (error) {
    throw new Error(
      `deleteAssignment error: ${error.name} (${error.message} ${error.details})`,
    );
  }
  return data;
};

export type TMilestoneUpsertItem = {
  id?: string;
  title: string;
  description?: string | null;
  start_date: string; // ISO "YYYY-MM-DD"
  end_date: string | null; // ISO или null
  amount?: number | null;
  late_penalty_per_day?: number | null;
  units_id?: string | null;
};

export async function fetchMilestonesByParent(
  parentId: string,
): Promise<TTaskWithUnits[]> {
  const { data, error } = await supabase
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
      measurementUnits:measurement_units ( id, title )
    `,
    )
    .eq("parent_id", parentId)
    .eq("type", "PROJECT")
    .order("start_date", { ascending: true })
    .overrideTypes<TTaskWithUnits[]>();

  if (error) {
    throw new Error(`${error.name} (${error.message} ${error.details})`);
  }
  return data ?? [];
}

export async function upsertMilestonesForParent(
  parentId: string,
  nextList: TMilestoneUpsertItem[],
): Promise<TTaskWithUnits[]> {
  // текущее состояние
  const prev = await fetchMilestonesByParent(parentId);
  const prevMap = new Map(prev.map((m) => [m.id, m]));
  const nextIds = new Set<string>();

  // UPDATE / INSERT
  for (const n of nextList) {
    if (!n.title || !n.start_date) continue;

    if (n.id && prevMap.has(n.id)) {
      nextIds.add(n.id);
      const { error } = await supabase
        .from("tasks")
        .update({
          title: n.title,
          description: n.description ?? null,
          start_date: n.start_date,
          end_date: n.end_date,
          amount: n.amount ?? null,
          late_penalty_per_day: n.late_penalty_per_day ?? null,
          units_id: n.units_id ?? null,
        })
        .eq("id", n.id);

      if (error) {
        throw new Error(`${error.name} (${error.message} ${error.details})`);
      }
    } else {
      const { error } = await supabase.from("tasks").insert({
        title: n.title,
        description: n.description ?? null,
        start_date: n.start_date,
        end_date: n.end_date,
        amount: n.amount ?? null,
        status: "PENDING",
        type: "PROJECT", // майлстоун = PROJECT
        parent_id: parentId,
        units_id: n.units_id ?? null,
        late_penalty_per_day: n.late_penalty_per_day ?? null,
      });

      if (error) {
        throw new Error(`${error.name} (${error.message} ${error.details})`);
      }
    }
  }

  // DELETE
  for (const old of prev) {
    if (!nextList.some((n) => n.id === old.id)) {
      const { error } = await supabase.from("tasks").delete().eq("id", old.id);
      if (error) {
        throw new Error(`${error.name} (${error.message} ${error.details})`);
      }
    }
  }

  // вернуть свежее состояние
  return await fetchMilestonesByParent(parentId);
}
