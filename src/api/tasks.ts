import { supabase } from "./getClient";

export const getTasks = async () => {
  const result = await supabase.from("tasks").select();
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
