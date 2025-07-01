import { supabase } from "./getClient";
import type { TUserProfile } from "./types";

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

export const fetchUsersByEmail = async (
  emailSubstr: string,
): Promise<TUserProfile[]> => {
  const { data, error } = await supabase
    .rpc("search_profiles_by_email", { email_substr: emailSubstr })
    .select()
    .overrideTypes<TUserProfile[]>();

  if (error) {
    throw new Error(
      `fetchUsersByEmail error: ${error.name} (${error.message} ${error.details})`,
    );
  }
  return data;
};
