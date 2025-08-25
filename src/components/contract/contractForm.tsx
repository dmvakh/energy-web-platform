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
import { MilestonesEditor, type TLocalMilestone } from ".";
import {
  fetchMilestonesByParent,
  upsertMilestonesForParent,
  type TMilestoneUpsertItem,
} from "../../api/tasks";

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

  // сумма контракта (может заполнить проект, если там пусто)
  const [amount, setAmount] = useState<string>("");

  // поиск стороны B
  const [userBQuery, setUserBQuery] = useState<string>("");
  const [userBOptions, setUserBOptions] = useState<TUserProfile[]>([]);
  const [userBId, setUserBId] = useState<string>("");

  // файл
  const [file, setFile] = useState<File | null>(null);

  // локальные майлстоуны
  const [milestones, setMilestones] = useState<TLocalMilestone[]>([]);

  // 1) загрузка проектов
  useEffect(() => {
    if (user && !tasksFetched && !tasksLoading) {
      getTasks();
    }
  }, [user, tasksFetched, tasksLoading, getTasks]);

  // 2) редактирование — тянем контракт
  useEffect(() => {
    if (isEdit && id) {
      getById(id);
    }
  }, [isEdit, id, getById]);

  // 3) при выборе проекта — тянем майлстоуны из API задач
  useEffect(() => {
    if (!taskId) {
      setMilestones([]);
      return;
    }
    (async () => {
      const list = await fetchMilestonesByParent(taskId);
      setMilestones(
        list.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description ?? "",
          start_date: m.startDate,
          end_date: m.endDate ?? "",
          amount: m.amount ?? null,
          late_penalty_per_day: m?.latePenaltyPerDay ?? null,
        })),
      );
    })();
  }, [taskId]);

  // 4) заполняем форму из контракта
  useEffect(() => {
    if (isEdit && c) {
      setTaskId(c.task_id);
      setTitle(c.title);
      setDescription(c.description);
      setStartDate(c.start_date);
      setEndDate(c.end_date ?? "");
      setUserBId(c.user_b);
      setUserBQuery("");
      setAmount(c.amount != null ? String(c.amount) : "");
    }
  }, [isEdit, c]);

  // 5) автоподстановка суммы проекта (если контракт новый и проект имеет amount)
  useEffect(() => {
    if (!taskId) return;
    const project = tasks.find((t) => t.id === taskId);
    if (project && amount === "") {
      if (project.amount != null) {
        setAmount(String(project.amount));
      }
    }
  }, [taskId, tasks, amount]); // один раз при смене проекта

  // 6) поиск user_b
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

  // валидация дат майлстоунов
  const isMilestonesDatesValid = milestones.every((m) => {
    if (!m.start_date || !m.end_date) return false;
    if (m.start_date < startDate) return false;
    if (endDate && m.end_date > endDate) return false;
    return true;
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    if (!userBId) return;
    if (!isMilestonesDatesValid) return;

    const contractAmount =
      amount === ""
        ? null
        : Number.isNaN(Number(amount))
          ? null
          : Number(amount);

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
      amount: contractAmount, // 👈 новая сумма контракта
    };

    let contract: TContract;
    if (isEdit && id) {
      await save(id, payload);
      contract = c!;
    } else {
      contract = await create(payload);
    }

    // файл
    if (file) {
      const folder = `contracts/${user.id}_${userBId}_${contract.id}`;
      const path = `${folder}/${file.name}`;
      await uploadFile(path, file);
      await save(contract.id, { file_url: path });
    }

    // upsert майлстоунов через API задач
    if (taskId) {
      const upserts: TMilestoneUpsertItem[] = milestones.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description ?? "",
        start_date: m.start_date,
        end_date: m.end_date,
        amount: m.amount ?? null,
        late_penalty_per_day: m.late_penalty_per_day ?? null,
      }));
      await upsertMilestonesForParent(taskId, upserts);
    }

    navigate("/contracts");
  };

  if (!user) return null;
  if (contractsLoading || tasksLoading || !tasksFetched) {
    return <p>Загрузка…</p>;
  }

  // только проекты, созданные текущим пользователем
  const myProjects = tasks.filter((t) => t.creatorId === user.id);

  // редактирование майлстоунов только в DRAFT (для нового — считаем DRAFT)
  const isDraft = !isEdit || c?.status === "DRAFT";

  const isSubmitDisabled =
    !taskId || !title || !startDate || !userBId || !isMilestonesDatesValid;

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

      {/* Amount (контракт) */}
      <div>
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-gray-700"
        >
          Сумма контракта
        </label>
        <input
          id="amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 block w-full rounded border p-2"
          placeholder="Если у проекта не задана — укажите здесь"
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

      {/* Side B search */}
      <div>
        <label
          htmlFor="userBQuery"
          className="block text-sm font-medium text-gray-700"
        >
          Сторона B — поиск по e-mail
        </label>
        <input
          id="userBQuery"
          value={userBQuery}
          onChange={(e) => setUserBQuery(e.target.value)}
          placeholder="Начните вводить e-mail…"
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
            Пользователь выбран ранее.
          </p>
        )}
      </div>

      {/* Milestones editor */}
      <MilestonesEditor
        disabled={!isDraft}
        contractStart={startDate}
        contractEnd={endDate || null}
        list={milestones}
        onChange={setMilestones}
      />

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
