import React, { useEffect, useState, useCallback } from "react";
import { useAppStore } from "../../store";
import { Button } from "../catalyst";
import { Loader } from "../loader";
import { useOutletContext } from "react-router";
import type { TTaskWithUnits, TAssignment, TUserProfile } from "../../api";
import type { User } from "@supabase/supabase-js";
import { fetchUsersByEmail, supabase } from "../../api";

export const TaskAssignment: React.FC = () => {
  const { task, isAuthor } = useOutletContext<{
    task: TTaskWithUnits;
    user: User;
    isAuthor: boolean;
  }>();
  const taskId = task.id;
  const {
    assignments,
    loading,
    getAssignments,
    createAssignment,
    deleteAssignment,
  } = useAppStore((s) => s.assignmentsStore);

  const [query, setQuery] = useState("");
  const [userId, setUserId] = useState("");
  const [suggestions, setSuggestions] = useState<TUserProfile[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const getSess = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error("Ошибка при получении сессии:", error.message);
        return;
      }
      if (!session) {
        console.log("Нет активной сессии");
        return;
      }

      // 2. Разбираем поля
      // expires_in — число секунд до истечения
      const expiresInSec = session.expires_in; // например, 3600

      // expires_at — Unix-время (секунды), когда токен перестанет быть валидным
      // конвертируем в миллисекунды и в объект Date
      const expiresAtMs = session.expires_at * 1000;
      const expiresAtDate = new Date(expiresAtMs);

      // 3. Выводим информацию
      console.log(`Сессия истекает через: ${expiresInSec} сек.`);
      console.log(
        `Точная дата/время истечения: ${expiresAtDate.toLocaleString("ru-RU")}`,
      );

      // 4. Можно вычислить, сколько осталось «рукой»
      const nowMs = Date.now();
      const msLeft = expiresAtMs - nowMs;
      const secLeft = Math.max(0, Math.floor(msLeft / 1000));
      const minLeft = Math.floor(secLeft / 60);
      const secRemainder = secLeft % 60;
      console.log(`Осталось примерно: ${minLeft} мин ${secRemainder} сек.`);

      // 5. И проверка — уже истекло или нет
      if (msLeft <= 0) {
        console.warn("⚠️ Сессия уже истекла");
      } else {
        console.log("✅ Сессия ещё валидна");
      }
    };
    getSess();
  }, []);

  // загрузить текущие назначения один раз
  useEffect(() => {
    if (taskId && !assignments?.[taskId]) {
      getAssignments(taskId);
    }
  }, [taskId, getAssignments, assignments]);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const users = await fetchUsersByEmail(query);
        setSuggestions(users);
      } catch (e) {
        console.error("search users error", e);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // formatter для дат
  const formatDate = useCallback((iso: string) => {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const onAssign = async () => {
    if (!userId || !startDate || !taskId) return;
    await createAssignment(taskId, userId, startDate, endDate || undefined);
    setQuery("");
    setUserId("");
    setStartDate("");
    setEndDate("");
    setSuggestions([]);
    await getAssignments(taskId);
  };

  const onDelete = async (assignmentIds: string[]) => {
    await deleteAssignment(assignmentIds);
  };

  console.log(loading, assignments[taskId]);

  if (loading || !taskId) return <Loader />;
  const current: TAssignment[] = assignments[taskId] ?? [];

  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold">Assignments</h2>

      <ul className="space-y-2">
        {current.length === 0 && (
          <li className="text-gray-500">No assignments yet.</li>
        )}
        {current.map((a) => {
          const assignmentsIds: string[] = [];
          assignmentsIds.push(a.activeAssignmentId);
          if (a.removedAssignmentId) {
            assignmentsIds.push(a.removedAssignmentId);
          }
          return (
            <li
              key={`${assignmentsIds.join(``)}`}
              className="flex items-center justify-between bg-gray-50 p-3 rounded"
            >
              <span>
                {a.taskTitle} – {a.userEmail} — {formatDate(a.startDate)}
                {a.endDate ? ` → ${formatDate(a.endDate)}` : ""}
              </span>
              {isAuthor && (
                <Button onClick={() => onDelete(assignmentsIds)}>Delete</Button>
              )}
            </li>
          );
        })}
      </ul>

      {isAuthor && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 relative">
          {/* Email autocomplete */}
          <div className="md:col-span-1 relative">
            <label className="block text-sm font-medium">User Email</label>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setUserId(""); // сбрасываем ранее выбранный
              }}
              className="mt-1 block w-full rounded border p-2"
              placeholder="Type to search..."
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-48 overflow-auto">
                {suggestions.map((u) => (
                  <li
                    key={u.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setQuery(u.email);
                      setUserId(u.id);
                      setSuggestions([]);
                    }}
                  >
                    {u.first_name} {u.last_name} &lt;{u.email}&gt;
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Даты */}
          <div>
            <label className="block text-sm font-medium">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full rounded border p-2"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={onAssign} disabled={!userId || !startDate}>
              Assign
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};
