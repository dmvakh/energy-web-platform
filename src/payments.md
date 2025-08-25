# Спецификация модуля «Платежи»

## 1. Обзор

Модуль «Платежи» обеспечивает:

- хранение и учёт балансов (кошельков) пользователей в разных валютах;
- создание платежей «от» → «кому» с привязкой к записи в таблице `tasks` (тип `PROJECT` или `TASK`) и/или контракту/счету;
- автоматическое списание/зачисление средств при смене статуса платежа на `captured`;
- возможность открытия в контексте конкретного проекта (запись `tasks` с `type = 'PROJECT'`) или отдельно, показывая все свои операции;
- клиентский API, React-хуки, Zustand-хранилище, утилиты и UI-компоненты на базе Catalyst/Tailwind;
- безопасность через RLS: каждый платёж виден только отправителю и получателю; каждый кошелёк — только его владельцу.

> **Важно:** нет отдельных таблиц «projects» и «tasks»: единая таблица `tasks` содержит обе сущности, различимые по полю `type`.

---

## 2. Структура базы данных и RLS

### 2.1. Таблица `wallets`

```sql
CREATE TABLE public.wallets (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES auth.users(id),
  currency    VARCHAR(3)   NOT NULL,
  balance     NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ON public.wallets (user_id, currency);

-- RLS: владелец видит и может изменять свои кошельки
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY wallets_select ON public.wallets
  FOR SELECT USING (user_id = (SELECT auth.uid() AS uid));
CREATE POLICY wallets_update ON public.wallets
  FOR UPDATE USING (user_id = (SELECT auth.uid() AS uid));
```

### 2.2. Таблица `payments`

```sql
CREATE TABLE public.payments (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_id      UUID         NOT NULL REFERENCES auth.users(id),
  payee_id      UUID         NOT NULL REFERENCES auth.users(id),
  project_id    UUID         NOT NULL REFERENCES public.tasks(id),  -- запись tasks.type='PROJECT'
  task_id       UUID         NULL    REFERENCES public.tasks(id),  -- запись tasks.type='TASK'
  object_type   VARCHAR(20)  NOT NULL,    -- 'contract' или 'invoice'
  object_id     UUID         NULL,        -- UUID контракта или файла счёта
  wallet_id     UUID         NOT NULL REFERENCES public.wallets(id),
  amount        NUMERIC(12,2) NOT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'pending',
  description   TEXT         NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ON public.payments (payer_id);
CREATE INDEX ON public.payments (payee_id);
CREATE INDEX ON public.payments (project_id);
CREATE INDEX ON public.payments (task_id);
CREATE INDEX ON public.payments (wallet_id);
CREATE INDEX ON public.payments (object_type);
CREATE INDEX ON public.payments (object_id);
CREATE INDEX ON public.payments (status);

-- RLS: отправитель и получатель видят свои платежи; вставлять может только отправитель
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_select ON public.payments
  FOR SELECT USING (
    payer_id = (SELECT auth.uid() AS uid)
    OR payee_id = (SELECT auth.uid() AS uid)
  );
CREATE POLICY payments_insert ON public.payments
  FOR INSERT WITH CHECK (
    payer_id = (SELECT auth.uid() AS uid)
  );
CREATE POLICY payments_update ON public.payments
  FOR UPDATE USING (
    payer_id = (SELECT auth.uid() AS uid)
    OR payee_id = (SELECT auth.uid() AS uid)
  );
```

### 2.3. Авто-обновление балансов

```sql
CREATE OR REPLACE FUNCTION public._payments_update_wallets()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'captured'
     AND OLD.status <> 'captured'
  THEN
    -- списание у плательщика
    UPDATE public.wallets
      SET balance = balance - NEW.amount,
          updated_at = now()
    WHERE id = NEW.wallet_id;

    -- зачисление получателю в той же валюте
    UPDATE public.wallets w
      SET balance = w.balance + NEW.amount,
          updated_at = now()
    FROM public.wallets payer_w
    WHERE payer_w.id = NEW.wallet_id
      AND w.user_id = NEW.payee_id
      AND w.currency = payer_w.currency;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_after_update_balance
  AFTER UPDATE OF status ON public.payments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public._payments_update_wallets();
```

---

## 3. Структура проекта и файлы

```
/src
 ├─ /api
 │    ├─ getClient.ts
 │    └─ payments.ts
 ├─ /hooks
 │    └─ usePayments.ts
 ├─ /store
 │    └─ paymentsStore.ts
 ├─ /utils
 │    ├─ strings.ts
 │    └─ paymentUtils.ts
 ├─ /components
 │    ├─ /catalyst
 │    │    ├─ WalletBalance.tsx
 │    │    ├─ PaymentForm.tsx
 │    │    └─ PaymentList.tsx
 │    ├─ /layout
 │    │    └─ ProjectLayout.tsx
 │    └─ /routes
 │         ├─ Finance.tsx
 │         └─ PaymentsStandalone.tsx
 └─ App.tsx
```

---

## 4. Утилиты

### 4.1. `src/utils/strings.ts`

```ts
/**
 * Рекурсивно преобразует ключи из snake_case в camelCase.
 */
export function camelizeObject<T>(input: unknown): T {
  if (Array.isArray(input)) {
    return input.map((item) => camelizeObject(item)) as unknown as T;
  }
  if (input !== null && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
      result[camelKey] = camelizeObject(value);
    }
    return result as T;
  }
  return input as T;
}
```

### 4.2. `src/utils/paymentUtils.ts`

```ts
import { camelizeObject } from "./strings";

/**
 * Форматирует сумму с валютой.
 */
export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
  }).format(amount);
}

/** API-типы (snake_case) */
export type ApiPayment = {
  id: string;
  payer_id: string;
  payee_id: string;
  project_id: string;
  task_id?: string | null;
  object_type: "contract" | "invoice";
  object_id?: string | null;
  wallet_id: string;
  amount: number;
  status: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiWallet = {
  id: string;
  user_id: string;
  currency: string;
  balance: number;
  created_at: string;
  updated_at: string;
};
```

---

## 5. Клиентское API

### `src/api/payments.ts`

```ts
import { supabase } from "./getClient";
import { camelizeObject, ApiPayment, ApiWallet } from "../utils/paymentUtils";

/** Типы в camelCase */
export type Payment = ReturnType<typeof camelizeObject<ApiPayment>>;
export type Wallet = ReturnType<typeof camelizeObject<ApiWallet>>;

/**
 * Создаёт новый платёж.
 */
export async function createPayment(payload: {
  payerId: string;
  payeeId: string;
  projectId: string; // ID записи tasks.type='PROJECT'
  taskId?: string; // ID записи tasks.type='TASK'
  objectType: "contract" | "invoice";
  objectId?: string;
  walletId: string;
  amount: number;
  description?: string;
}): Promise<Payment> {
  const { data, error } = await supabase
    .from<ApiPayment>("payments")
    .insert({
      payer_id: payload.payerId,
      payee_id: payload.payeeId,
      project_id: payload.projectId,
      task_id: payload.taskId ?? null,
      object_type: payload.objectType,
      object_id: payload.objectId ?? null,
      wallet_id: payload.walletId,
      amount: payload.amount,
      description: payload.description ?? null,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create payment");
  }
  return camelizeObject<Payment>(data);
}

/**
 * Обновляет статус платежа.
 */
export async function updatePaymentStatus(
  id: string,
  status: "pending" | "captured" | "failed",
): Promise<Payment> {
  const { data, error } = await supabase
    .from<ApiPayment>("payments")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? `Failed to update status of ${id}`);
  }
  return camelizeObject<Payment>(data);
}

/**
 * Получает платежи по проекту (фильтр).
 */
export async function fetchPaymentsByProject(
  projectId: string,
): Promise<Payment[]> {
  const { data, error } = await supabase
    .from<ApiPayment>("payments")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to fetch payments");
  }
  return data.map((d) => camelizeObject<Payment>(d));
}

/**
 * Получает все платежи текущего пользователя (отправленные и полученные).
 */
export async function fetchMyPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from<ApiPayment>("payments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to fetch my payments");
  }
  return data.map((d) => camelizeObject<Payment>(d));
}

/**
 * Получает кошельки пользователя.
 */
export async function fetchWallets(userId: string): Promise<Wallet[]> {
  const { data, error } = await supabase
    .from<ApiWallet>("wallets")
    .select("*")
    .eq("user_id", userId);
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to fetch wallets");
  }
  return data.map((d) => camelizeObject<Wallet>(d));
}
```

---

## 6. React-хуки

### `src/hooks/usePayments.ts`

```ts
import { useState, useEffect, useCallback } from "react";
import type { Payment, Wallet } from "../api/payments";
import * as api from "../api/payments";

/**
 * Хук для работы с кошельками пользователя.
 */
export function useWallets(userId: string) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setWallets(await api.fetchWallets(userId));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { wallets, loading, reload: load };
}

/**
 * Хук для работы с платежами проекта.
 */
export function useProjectPayments(projectId: string) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPayments(await api.fetchPaymentsByProject(projectId));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (
    payload: Omit<Parameters<typeof api.createPayment>[0], "projectId">,
  ) => {
    const p = await api.createPayment({ ...payload, projectId });
    setPayments((prev) => [p, ...prev]);
    return p;
  };

  const updateStatus = async (
    id: string,
    status: "pending" | "captured" | "failed",
  ) => {
    const p = await api.updatePaymentStatus(id, status);
    setPayments((prev) => prev.map((x) => (x.id === id ? p : x)));
    return p;
  };

  return { payments, loading, reload: load, create, updateStatus };
}

/**
 * Хук для работы со всеми платежами пользователя.
 */
export function useMyPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPayments(await api.fetchMyPayments());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { payments, loading, reload: load };
}
```

---

## 7. Zustand-хранилище

### `src/store/paymentsStore.ts`

```ts
import { create } from "zustand";
import type { Payment, Wallet } from "../api/payments";
import {
  fetchPaymentsByProject,
  fetchMyPayments,
  fetchWallets,
  createPayment,
  updatePaymentStatus,
} from "../api/payments";

export type PaymentsStore = {
  walletsByUser: Record<string, Wallet[]>;
  paymentsByProject: Record<string, Payment[]>;
  myPayments: Payment[];
  loading: boolean;
  getWallets: (userId: string) => Promise<void>;
  getProjectPayments: (projectId: string) => Promise<void>;
  getMyPayments: () => Promise<void>;
  createPayment: (
    payload: Omit<Payment, "id" | "createdAt" | "updatedAt">,
  ) => Promise<Payment>;
  updatePaymentStatus: (
    id: string,
    status: "pending" | "captured" | "failed",
  ) => Promise<Payment>;
};

export const usePaymentsStore = create<PaymentsStore>((set) => ({
  walletsByUser: {},
  paymentsByProject: {},
  myPayments: [],
  loading: false,

  getWallets: async (userId) => {
    set({ loading: true });
    const w = await fetchWallets(userId);
    set((state) => ({
      walletsByUser: { ...state.walletsByUser, [userId]: w },
      loading: false,
    }));
  },

  getProjectPayments: async (projectId) => {
    set({ loading: true });
    const p = await fetchPaymentsByProject(projectId);
    set((state) => ({
      paymentsByProject: { ...state.paymentsByProject, [projectId]: p },
      loading: false,
    }));
  },

  getMyPayments: async () => {
    set({ loading: true });
    const p = await fetchMyPayments();
    set({ myPayments: p, loading: false });
  },

  createPayment: async (payload) => {
    set({ loading: true });
    const p = await createPayment(payload);
    set((state) => ({
      paymentsByProject: {
        ...state.paymentsByProject,
        [p.projectId]: [p, ...(state.paymentsByProject[p.projectId] ?? [])],
      },
      myPayments: [p, ...state.myPayments],
      loading: false,
    }));
    return p;
  },

  updatePaymentStatus: async (id, status) => {
    set({ loading: true });
    const p = await updatePaymentStatus(id, status);
    set((state) => ({
      paymentsByProject: {
        ...state.paymentsByProject,
        [p.projectId]: state.paymentsByProject[p.projectId].map((x) =>
          x.id === id ? p : x,
        ),
      },
      myPayments: state.myPayments.map((x) => (x.id === id ? p : x)),
      loading: false,
    }));
    return p;
  },
}));
```

---

## 8. UI-компоненты Catalyst

### 8.1. `src/components/catalyst/WalletBalance.tsx`

```tsx
import React from "react";
import type { Wallet } from "../../api/payments";
import { formatMoney } from "../../utils/paymentUtils";

type WalletBalanceProps = { wallets: Wallet[] };

export const WalletBalance: React.FC<WalletBalanceProps> = ({ wallets }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {wallets.map((w) => (
      <div key={w.id} className="bg-white shadow rounded-lg p-4">
        <div className="text-sm font-medium text-gray-500">{w.currency}</div>
        <div className="mt-2 text-xl font-semibold text-gray-900">
          {formatMoney(w.balance, w.currency)}
        </div>
      </div>
    ))}
  </div>
);
```

### 8.2. `src/components/catalyst/PaymentForm.tsx`

```tsx
import React, { useState, FormEvent } from "react";
import type { Wallet } from "../../api/payments";
import { Button } from "../catalyst/Button";
import { Input } from "../catalyst/Input";

type Payee = { id: string; name: string };

type PaymentFormProps = {
  wallets: Wallet[];
  payees: Payee[];
  onSubmit: (data: {
    payeeId: string;
    walletId: string;
    amount: number;
    description?: string;
  }) => void;
  onCancel: () => void;
};

export const PaymentForm: React.FC<PaymentFormProps> = ({
  wallets,
  payees,
  onSubmit,
  onCancel,
}) => {
  const [payeeId, setPayeeId] = useState(payees[0]?.id || "");
  const [walletId, setWalletId] = useState(wallets[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      payeeId,
      walletId,
      amount: parseFloat(amount),
      description: description || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* … поля формы … */}
      <div className="flex justify-end space-x-2">
        <Button variant="secondary" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit">Создать платёж</Button>
      </div>
    </form>
  );
};
```

### 8.3. `src/components/catalyst/PaymentList.tsx`

```tsx
import React from "react";
import type { Payment } from "../../api/payments";
import { Button } from "../catalyst/Button";
import { formatMoney } from "../../utils/paymentUtils";

type PaymentListProps = {
  payments: Payment[];
  onUpdateStatus: (
    id: string,
    status: "pending" | "captured" | "failed",
  ) => void;
};

export const PaymentList: React.FC<PaymentListProps> = ({
  payments,
  onUpdateStatus,
}) => (
  <table className="min-w-full divide-y divide-gray-200">
    <thead>
      <tr>
        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
          Дата
        </th>
        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
          Получатель
        </th>
        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
          Сумма
        </th>
        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
          Статус
        </th>
        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
          Действия
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
      {payments.map((p) => (
        <tr key={p.id}>
          <td className="px-4 py-2 text-sm text-gray-700">
            {new Date(p.createdAt).toLocaleString("ru-RU")}
          </td>
          <td className="px-4 py-2 text-sm text-gray-700">{p.payeeId}</td>
          <td className="px-4 py-2 text-sm text-gray-700">
            {formatMoney(p.amount, p.currency)}
          </td>
          <td className="px-4 py-2 text-sm text-gray-700">{p.status}</td>
          <td className="px-4 py-2 text-sm text-gray-700 space-x-2">
            {p.status !== "captured" && (
              <Button
                size="sm"
                onClick={() => onUpdateStatus(p.id, "captured")}
              >
                Подтвердить
              </Button>
            )}
            {p.status !== "failed" && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onUpdateStatus(p.id, "failed")}
              >
                Отменить
              </Button>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
```

---

## 9. Маршруты и Layout

### 9.1. Проектный контекст

- **`src/components/layout/ProjectLayout.tsx`**

  ```tsx
  <Tab to="finance">Финансы</Tab>
  ```

- **`src/components/routes/Finance.tsx`**

  ```tsx
  import React from "react";
  import { useParams } from "react-router";
  import { useProjectPayments } from "../../hooks/usePayments";
  import { useWallets } from "../../hooks/usePayments";
  import { WalletBalance } from "../catalyst/WalletBalance";
  import { PaymentList } from "../catalyst/PaymentList";
  import { PaymentForm } from "../catalyst/PaymentForm";

  export const Finance: React.FC = () => {
    const { id: projectId } = useParams<{ id: string }>();
    const { payments, loading, reload, create, updateStatus } =
      useProjectPayments(projectId!);
    const { wallets } = useWallets(/* current user id */);
    const payees = /* список участников проекта */ [];

    React.useEffect(() => {
      reload();
    }, [reload]);

    return (
      <div className="space-y-6">
        <WalletBalance wallets={wallets} />
        <PaymentList payments={payments} onUpdateStatus={updateStatus} />
        <PaymentForm
          wallets={wallets}
          payees={payees}
          onSubmit={(data) => create(data)}
          onCancel={() => {
            /* закрыть модалку */
          }}
        />
      </div>
    );
  };
  ```

### 9.2. Отдельный модуль платежей

- **`src/components/routes/PaymentsStandalone.tsx`**

  ```tsx
  import React from "react";
  import { useMyPayments } from "../../hooks/usePayments";
  import { PaymentList } from "../catalyst/PaymentList";

  export const PaymentsStandalone: React.FC = () => {
    const { payments, loading, reload } = useMyPayments();
    React.useEffect(() => {
      reload();
    }, [reload]);

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Мои платежи</h1>
        <PaymentList payments={payments} onUpdateStatus={() => {}} />
      </div>
    );
  };
  ```

### 9.3. `src/App.tsx`

```tsx
import { Route, Routes, Outlet, Navigate } from "react-router";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import Finance from "./components/routes/Finance";
import PaymentsStandalone from "./components/routes/PaymentsStandalone";

function App() {
  return (
    <Routes>
      {/* ... существующие маршруты ... */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout>
              <Outlet />
            </AppLayout>
          </ProtectedRoute>
        }
      >
        <Route path="project/:id/finance" element={<Finance />} />
        <Route path="payments" element={<PaymentsStandalone />} />
      </Route>
    </Routes>
  );
}
export default App;
```
