import { useEffect, useCallback, useMemo } from "react";
import { useAppStore } from "../store";
import type { TPaymentPayload } from "../api";

/** Хук для работы с кошельками пользователя. */
export function useWallets(userId: string) {
  const rawWallets = useAppStore((s) => s.paymentsStore.walletsByUser[userId]);
  const loading = useAppStore((s) => s.paymentsStore.loading);
  const getWallets = useAppStore((s) => s.paymentsStore.getWallets);

  const wallets = useMemo(() => rawWallets ?? [], [rawWallets]);

  useEffect(() => {
    if (userId !== "guest") {
      getWallets(userId);
    }
  }, [userId, getWallets]);

  const reload = useCallback(() => {
    if (userId !== "guest") {
      getWallets(userId);
    }
  }, [userId, getWallets]);

  return { wallets, loading, reload };
}

/** Хук для работы с платежами проекта. */
export function useProjectPayments(projectId: string) {
  const rawPayments = useAppStore(
    (s) => s.paymentsStore.paymentsByProject[projectId],
  );
  const loading = useAppStore((s) => s.paymentsStore.loading);
  const getProjectPayments = useAppStore(
    (s) => s.paymentsStore.getProjectPayments,
  );
  const createPayment = useAppStore((s) => s.paymentsStore.createPayment);
  const updatePaymentStatus = useAppStore(
    (s) => s.paymentsStore.updatePaymentStatus,
  );

  const payments = useMemo(() => rawPayments ?? [], [rawPayments]);

  useEffect(() => {
    getProjectPayments(projectId);
  }, [projectId, getProjectPayments]);

  const reload = useCallback(() => {
    getProjectPayments(projectId);
  }, [projectId, getProjectPayments]);

  const create = useCallback(
    (payload: TPaymentPayload) => createPayment(payload),
    [createPayment],
  );

  const updateStatus = useCallback(
    (id: string, status: "pending" | "captured" | "failed") =>
      updatePaymentStatus(id, status),
    [updatePaymentStatus],
  );

  return { payments, loading, reload, create, updateStatus };
}

/** Хук для работы со всеми платежами пользователя. */
export function useMyPayments() {
  const rawMyPayments = useAppStore((s) => s.paymentsStore.myPayments);
  const loading = useAppStore((s) => s.paymentsStore.loading);
  const getMyPayments = useAppStore((s) => s.paymentsStore.getMyPayments);

  const myPayments = useMemo(() => rawMyPayments ?? [], [rawMyPayments]);

  useEffect(() => {
    getMyPayments();
  }, [getMyPayments]);

  const reload = useCallback(() => {
    getMyPayments();
  }, [getMyPayments]);

  return { payments: myPayments, loading, reload };
}
