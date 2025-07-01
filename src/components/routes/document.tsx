import { useOutletContext } from "react-router";
import { type TTaskWithUnits } from "../../api";
import { downloadDocument } from "../../api";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../../store";
import { Button } from "../catalyst";
import {
  ArrowDownTrayIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Loader } from "../loader";
import { supabase } from "../../api";

// TODO: обсудить что можно удалять

export const Document = () => {
  const { task } = useOutletContext<{ task: TTaskWithUnits }>();
  const getTaskDocuments = useAppStore(
    (s) => s.documentsStore.getTaskDocuments,
  );
  const tasksDocuments = useAppStore((s) => s.documentsStore.documents.tasks);
  const documentsFolder = `tasks/${task.id}`;
  const [uploading, setUploading] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task.id) {
      getTaskDocuments(task.id);
    }
  }, [getTaskDocuments, task.id]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setUploading(true);

    for (const file of files) {
      const path = `${documentsFolder}/${file.name}`;
      const result = await supabase.storage.from("files").upload(path, file, {
        upsert: true,
      });
      console.log("path", path);
      if (result.error) {
        console.error(
          "Ошибка загрузки файла:",
          result.error.name,
          result.error.message,
          result.error.stack,
        );
        console.error();
      }
    }

    setUploading(false);
    getTaskDocuments(task.id);
  };

  const confirmDelete = (fileName: string) => {
    setDeletingFile(fileName);
  };

  const cancelDelete = () => {
    setDeletingFile(null);
  };

  const handleDelete = async () => {
    if (!deletingFile) return;

    setDeleting(true);
    const fullPath = `${documentsFolder}/${deletingFile}`;
    const { error } = await supabase.storage.from("files").remove([fullPath]);

    if (error) {
      console.error("Ошибка удаления файла:", error.message);
    } else {
      await getTaskDocuments(task.id);
    }

    setDeleting(false);
    setDeletingFile(null);
  };

  if (!task) {
    return <Loader />;
  }

  return (
    <article className="space-y-4">
      <ul className="space-y-2">
        {tasksDocuments?.[task.id]?.map((doc) => (
          <li key={doc.id} className="flex items-center gap-2">
            <span>{doc.name}</span>
            <Button
              className="cursor-pointer ml-1"
              onClick={() => downloadDocument(`${documentsFolder}/${doc.name}`)}
            >
              <ArrowDownTrayIcon className="w-5 h-5 text-gray-500" />
            </Button>
            <Button
              className="cursor-pointer ml-1"
              onClick={() => confirmDelete(doc.name)}
            >
              <TrashIcon className="w-5 h-5 text-red-500" />
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-4">
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          {uploading ? "Загрузка..." : "Загрузить файлы"}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {deletingFile && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Удалить файл?</h2>
            <p className="mb-6 text-sm text-gray-700">
              Вы уверены, что хотите удалить{" "}
              <span className="font-medium">{deletingFile}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <Button onClick={cancelDelete}>Отмена</Button>
              <Button onClick={handleDelete} disabled={deleting}>
                {deleting ? "Удаление..." : "Удалить"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
