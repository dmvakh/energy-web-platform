import { supabase } from ".";
import type { FileObject } from "@supabase/storage-js";
export const fetchRawDocuments = async (
  path: string,
  bucket: string = "files",
): Promise<FileObject[]> => {
  const result = await supabase.storage.from(bucket).list(path, {
    sortBy: { column: "name", order: "asc" },
  });

  if (result.error) {
    throw Error(`${result.error.name} ${result.error.message}`);
  }
  return result.data;
};

export const downloadDocument = async (
  fullPath: string,
  bucket: string = "files",
) => {
  console.log("fullPath", fullPath);
  const result = await supabase.storage
    .from(bucket)
    .createSignedUrl(fullPath, 180);
  if (result.error) {
    throw Error(`${result.error.name} ${result.error.message}`);
  }
  window.open(result.data.signedUrl, "_blank");
};
