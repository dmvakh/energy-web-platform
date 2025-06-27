import { useOutletContext } from "react-router";
import { type TTaskWithUnits } from "../../api";
import { downloadDocument } from "../../api";
import { useEffect } from "react";
import { useAppStore } from "../../store";
import { Button } from "../catalyst";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Loader } from "../loader";

export const Document = () => {
  const { task } = useOutletContext<{ task: TTaskWithUnits }>();
  const getTaskDocuments = useAppStore(
    (s) => s.documentsStore.getTaskDocuments,
  );
  const tasksDocuments = useAppStore((s) => s.documentsStore.documents.tasks);
  const documentsFolder = `tasks/${task.id}`;
  useEffect(() => {
    getTaskDocuments(task.id);
  }, [getTaskDocuments, task.id]);

  if (!task || !tasksDocuments?.[task.id]) {
    return <Loader />;
  }

  return (
    <article>
      <ul>
        {tasksDocuments[task.id].map((doc) => {
          return (
            <li key={doc.id}>
              {doc.name}
              <Button
                className="ml-2 cursor-pointer"
                onClick={() =>
                  downloadDocument(`${documentsFolder}/${doc.name}`)
                }
              >
                <ArrowDownTrayIcon className="w-5 h-5 text-gray-500" />
              </Button>
            </li>
          );
        })}
      </ul>
    </article>
  );
};
