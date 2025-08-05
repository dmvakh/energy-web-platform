import { useState, useEffect, useCallback } from "react";
import type { Payment, TPaymentPayload, Wallet } from "../api/payments";
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
    if (userId !== "guest") {
      load();
    }
  }, [load, userId]);

  if (userId === "guest") {
    return {
      wallets: [],
      loading: false,
      reload: load,
    };
  }

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

  const create = async (payload: TPaymentPayload) => {
    const p = await api.createPayment(payload);
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

  // Функция только для загрузки данных и обновления payments/loading=false
  const load = useCallback(async () => {
    try {
      const data = await api.fetchMyPayments();
      console.log("payments", data);
      setPayments(data);
    } catch (err) {
      console.error("Ошибка при загрузке платежей:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // При монтировании сразу выставляем loading=true и запускаем загрузку
  // useEffect(() => {
  //   setLoading(true);
  //   load();
  // }, [load]);

  // Для ручного перезапуска тоже нужно сначала включить loading
  const reload = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  return { payments, loading, reload };
}
