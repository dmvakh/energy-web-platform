// src/components/contract/ContractForm.tsx
import {
  useEffect,
  useState,
  type FC,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useParams, useNavigate } from "react-router";
import { useAppStore } from "../../store";
import { useAuthUser } from "../../hooks";
import { downloadDocument, type TContract } from "../../api";
import { Button } from "../catalyst";

export const ContractForm: FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const user = useAuthUser();
  const navigate = useNavigate();

  const {
    contractsStore: {
      selected: c,
      loading: contractsLoading,
      getById,
      create,
      save,
      uploadFile,
    },
    tasksStore: {
      tasks,
      loading: tasksLoading,
      fetched: tasksFetched,
      getTasks,
    },
  } = useAppStore();

  const [taskId, setTaskId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [userB, setUserB] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  // 1) Загрузить проекты один раз
  useEffect(() => {
    if (user && !tasksFetched && !tasksLoading) {
      getTasks();
    }
  }, [user, tasksFetched, tasksLoading, getTasks]);

  // 2) При редактировании — подгрузить контракт
  useEffect(() => {
    if (isEdit && id) {
      getById(id);
    }
  }, [isEdit, id, getById]);

  // 3) Заполнить форму при получении контракта
  useEffect(() => {
    if (isEdit && c) {
      setTaskId(c.task_id);
      setTitle(c.title);
      setDescription(c.description);
      setStartDate(c.start_date);
      setEndDate(c.end_date ?? "");
      setUserB(c.user_b);
    }
  }, [isEdit, c]);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    // Сначала создаём/обновляем контракт без file_url
    const payload = {
      task_id: taskId,
      title,
      description,
      start_date: startDate,
      end_date: endDate || null,
      user_a: user.id,
      user_b: userB,
      file_url: "",
      creator_id: user.id,
    };

    let contract: TContract;
    if (isEdit && id) {
      await save(id, payload);
      contract = c!;
    } else {
      contract = await create(payload);
    }

    // Затем, если выбран файл, загружаем и обновляем путь
    if (file) {
      const folder = `contracts/${user.id}_${userB}_${contract.id}`;
      const path = `${folder}/${file.name}`;
      await uploadFile(path, file);
      await save(contract.id, { file_url: path });
    }

    navigate("/contracts");
  };

  if (!user) return null;
  if (contractsLoading || tasksLoading || !tasksFetched) {
    return <p>Загрузка…</p>;
  }

  // Фильтруем только проекты текущего пользователя
  const myProjects = tasks.filter((t) => t.creatorId === user.id);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 bg-white rounded shadow"
    >
      {/* Project select */}
      <div>
        <label
          htmlFor="project"
          className="block text-sm font-medium text-gray-700"
        >
          Проект
        </label>
        <select
          id="project"
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          className="mt-1 block w-full rounded border p-2 bg-white"
          required
        >
          <option value="">— Выберите проект —</option>
          {myProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Заголовок
        </label>
        <input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded border p-2"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Описание
        </label>
        <textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded border p-2"
          rows={4}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700"
          >
            Дата начала
          </label>
          <input
            id="startDate"
            type="date"
            name="start_date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full rounded border p-2"
            required
          />
        </div>
        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700"
          >
            Дата окончания
          </label>
          <input
            id="endDate"
            type="date"
            name="end_date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full rounded border p-2"
          />
        </div>
      </div>

      {/* Side B UUID */}
      <div>
        <label
          htmlFor="userB"
          className="block text-sm font-medium text-gray-700"
        >
          UUID стороны B
        </label>
        <input
          id="userB"
          name="user_b"
          value={userB}
          onChange={(e) => setUserB(e.target.value)}
          className="mt-1 block w-full rounded border p-2"
          required
        />
      </div>

      {/* File upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Файл (PDF)
        </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={onFileChange}
          className="mt-1 block w-full"
        />
        {isEdit && c?.file_url && (
          <p className="mt-2 text-sm">
            Текущий файл:{" "}
            <Button onClick={() => downloadDocument(c.file_url)}>
              Скачать
            </Button>
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-4">
        <Button
          type="submit"
          disabled={!taskId || !title || !startDate || !userB}
        >
          {isEdit ? "Сохранить контракт" : "Создать контракт"}
        </Button>
        {isEdit && (
          <Button type="button" onClick={() => navigate(-1)}>
            Отмена
          </Button>
        )}
      </div>
    </form>
  );
};
