import { supabase } from "./getClient";

export const getProjects = async () => {
  const result = await supabase.from("projects").select();
  if (result.error) {
    throw Error(`${result.error} ${result.statusText}`);
  }
  return result.data;
};

export const saveProject = async (data: object, projectId?: number) => {
  let result;
  if (projectId) {
    result = await supabase.from("projects").update(data).eq("id", projectId);
  } else {
    result = await supabase.from("projects").insert(data);
  }
  if (result.error) {
    throw Error(`${result.error} ${result.statusText}`);
  }
  return result.data;
};
