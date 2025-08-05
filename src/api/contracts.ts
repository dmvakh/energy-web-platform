import { supabase } from ".";
import type { TContract, TContractPayload } from ".";

export async function fetchContracts(): Promise<TContract[]> {
  const { data, error } = await supabase
    .from("contracts")
    .select(
      `
        *
        ,tasks (
          title
          ,start_date
          ,end_date
        )
      `,
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data!;
}

export async function fetchContractById(id: string): Promise<TContract> {
  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data!;
}

export async function createContractAPI(
  payload: TContractPayload,
): Promise<TContract> {
  const { data, error } = await supabase
    .from("contracts")
    .insert([payload])
    .select("*")
    .single();
  if (error) throw error;
  return data!;
}

export async function updateContractAPI(
  id: string,
  payload: Partial<TContractPayload>,
): Promise<TContract> {
  const { data, error } = await supabase
    .from("contracts")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data!;
}

export async function deleteContractAPI(id: string): Promise<void> {
  const { error } = await supabase.from("contracts").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadContractFile(
  path: string,
  file: File,
  bucket: string = "files",
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;

  return url;
}
