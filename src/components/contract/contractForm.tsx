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
import {
  downloadDocument,
  type TContract,
  fetchUsersByEmail,
  type TUserProfile,
} from "../../api";
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

  // поиск стороны B
  const [userBQuery, setUserBQuery] = useState<string>("");
  const [userBOptions, setUserBOptions] = useState<TUserProfile[]>([]);
  const [userBId, setUserBId] = useState<string>("");

  const [file, setFile] = useState<File | null>(null);

  // 1) грузим проекты текущего пользователя ровно один раз
  useEffect(() => {
    if (user && !tasksFetched && !tasksLoading) {
      getTasks();
    }
  }, [user, tasksFetched, tasksLoading, getTasks]);

  // 2) при редактировании подгружаем контракт
  useEffect(() => {
    if (isEdit && id) {
      getById(id);
    }
  }, [isEdit, id, getById]);

  // 3) заполняем форму из выбранного контракта
  useEffect(() => {
    if (isEdit && c) {
      setTaskId(c.task_id);
      setTitle(c.title);
      setDescription(c.description);
      setStartDate(c.start_date);
      setEndDate(c.end_date ?? "");
      setUserBId(c.user_b);
      setUserBQuery(""); // не пытаемся заранее подставлять email — оставим поле пустым
    }
  }, [isEdit, c]);

  // 4) debounce-поиск пользователeй по email для user_b
  useEffect(() => {
    if (!userBQuery || userBQuery.length < 2) {
      setUserBOptions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetchUsersByEmail(userBQuery);
        setUserBOptions(res);
      } catch {
        setUserBOptions([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [userBQuery]);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    // требуем, чтобы сторона B была выбрана из результатов (userBId)
    if (!userBId) return;

    // создаём/обновляем контракт без file_url
    const payload = {
      task_id: taskId,
      title,
      description,
      start_date: startDate,
      end_date: endDate || null,
      user_a: user.id,
      user_b: userBId,
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

    // если выбран файл — загружаем и прописываем путь относительно бакета
    if (file) {
      const folder = `contracts/${user.id}_${userBId}_${contract.id}`;
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

  // только проекты, созданные текущим пользователем
  const myProjects = tasks.filter((t) => t.creatorId === user.id);

  const isSubmitDisabled = !taskId || !title || !startDate || !userBId;

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

      {/* Side B search by email */}
      <div>
        <label
          htmlFor="userBQuery"
          className="block text-sm font-medium text-gray-700"
        >
          Сторона B — поиск по e‑mail
        </label>
        <input
          id="userBQuery"
          value={userBQuery}
          onChange={(e) => setUserBQuery(e.target.value)}
          placeholder="Начните вводить e‑mail…"
          className="mt-1 block w-full rounded border p-2"
        />
        {userBOptions.length > 0 && (
          <div className="mt-2">
            <label
              htmlFor="userBSelect"
              className="block text-sm font-medium text-gray-700"
            >
              Выберите пользователя
            </label>
            <select
              id="userBSelect"
              value={userBId}
              onChange={(e) => setUserBId(e.target.value)}
              className="mt-1 block w-full rounded border p-2 bg-white"
              required
            >
              <option value="">— Выберите пользователя —</option>
              {userBOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}{" "}
                  {u.first_name ? `(${u.first_name} ${u.last_name ?? ""})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
        {!!userBId && userBOptions.length === 0 && isEdit && (
          <p className="mt-2 text-sm text-gray-600">
            Пользователь выбран (из сохранённого контракта).
          </p>
        )}
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
        <Button type="submit" disabled={isSubmitDisabled}>
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
