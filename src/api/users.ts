import { supabase } from "./getClient";

export const getUser = async (userUid: string) => {
  const result = await supabase
    .from("profiles")
    .select()
    .eq("id", userUid)
    .limit(1)
    .single();
  if (result.error) {
    throw Error(`${result.error} ${result.statusText}`);
  }
  return result.data;
};
