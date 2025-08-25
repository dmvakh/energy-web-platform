import { useMemo, useCallback, type FC } from "react";
import { Button } from "../catalyst";

export type TLocalMilestone = {
  id?: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  amount?: number | null;
  late_penalty_per_day?: number | null;
};

export type Props = {
  disabled: boolean; // +/− только в DRAFT
  contractStart: string;
  contractEnd: string | null;
  list: TLocalMilestone[];
  onChange: (next: TLocalMilestone[]) => void;
};

export const MilestonesEditor: FC<Props> = ({
  disabled,
  contractStart,
  contractEnd,
  list,
  onChange,
}) => {
  const addItem = useCallback(() => {
    onChange([
      ...list,
      {
        title: "",
        description: "",
        start_date: contractStart,
        end_date: contractEnd ?? contractStart,
        amount: null,
        late_penalty_per_day: null,
      },
    ]);
  }, [list, onChange, contractStart, contractEnd]);

  const removeItem = useCallback(
    (idx: number) => {
      const copy: TLocalMilestone[] = [...list];
      copy.splice(idx, 1);
      onChange(copy);
    },
    [list, onChange],
  );

  const onField = useCallback(
    (idx: number, field: keyof TLocalMilestone, value: string) => {
      const current = list[idx];
      if (!current) return;

      // валидация диапазона дат
      if ((field === "start_date" || field === "end_date") && value) {
        const min = contractStart;
        const max = contractEnd ?? value;
        if (field === "start_date" && value < min) return;
        if (contractEnd && field === "end_date" && value > max) return;
      }

      let updated: TLocalMilestone = current;

      switch (field) {
        case "title":
          updated = { ...current, title: value };
          break;
        case "description":
          updated = { ...current, description: value };
          break;
        case "start_date":
          updated = { ...current, start_date: value };
          break;
        case "end_date":
          updated = { ...current, end_date: value };
          break;
        case "amount": {
          const num = value === "" ? null : Number(value);
          if (value !== "" && Number.isNaN(num)) return;
          updated = { ...current, amount: num };
          break;
        }
        case "late_penalty_per_day": {
          const num = value === "" ? null : Number(value);
          if (value !== "" && Number.isNaN(num)) return;
          updated = { ...current, late_penalty_per_day: num };
          break;
        }
        case "id":
          // id не редактируется
          return;
        default:
          return;
      }

      const next: TLocalMilestone[] = [...list];
      next[idx] = updated;
      onChange(next);
    },
    [list, contractStart, contractEnd, onChange],
  );

  const rows = useMemo(
    () =>
      list.map((m, i) => (
        <div key={m.id ?? i} className="border rounded p-3 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Заголовок</label>
              <input
                value={m.title}
                onChange={(e) => onField(i, "title", e.target.value)}
                className="mt-1 block w-full rounded border p-2"
                disabled={disabled}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Сумма</label>
              <input
                type="number"
                step="0.01"
                value={m.amount ?? ""}
                onChange={(e) => onField(i, "amount", e.target.value)}
                className="mt-1 block w-full rounded border p-2"
                disabled={disabled}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Описание</label>
            <textarea
              value={m.description ?? ""}
              onChange={(e) => onField(i, "description", e.target.value)}
              className="mt-1 block w-full rounded border p-2"
              disabled={disabled}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Начало</label>
              <input
                type="date"
                value={m.start_date}
                onChange={(e) => onField(i, "start_date", e.target.value)}
                className="mt-1 block w-full rounded border p-2"
                disabled={disabled}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Окончание</label>
              <input
                type="date"
                value={m.end_date}
                onChange={(e) => onField(i, "end_date", e.target.value)}
                className="mt-1 block w-full rounded border p-2"
                disabled={disabled}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Пеня / день</label>
              <input
                type="number"
                step="0.01"
                value={m.late_penalty_per_day ?? ""}
                onChange={(e) =>
                  onField(i, "late_penalty_per_day", e.target.value)
                }
                className="mt-1 block w-full rounded border p-2"
                disabled={disabled}
              />
            </div>
          </div>

          {!disabled && (
            <div className="flex justify-end">
              <Button type="button" onClick={() => removeItem(i)}>
                − Удалить
              </Button>
            </div>
          )}
        </div>
      )),
    [list, disabled, onField, removeItem],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Майлстоуны</h3>
        {!disabled && (
          <Button type="button" onClick={addItem}>
            + Добавить
          </Button>
        )}
      </div>
      {rows}
      {list.length === 0 && (
        <p className="text-sm text-gray-500">Пока нет майлстоунов.</p>
      )}
    </div>
  );
};
