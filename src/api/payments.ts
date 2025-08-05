import { supabase } from "./getClient";
import { camelizeObject } from "../utils";
import { type ApiPayment, type ApiWallet } from ".";

// /** Типы в camelCase */
// export type Payment = ReturnType<typeof camelizeObject<ApiPayment>>;
// export type Wallet = ReturnType<typeof camelizeObject<ApiWallet>>;

import type { Camelize } from "../utils/types";

export type Payment = Camelize<ApiPayment> & {
  payee: { email: string };
  payer: { email: string };
};
export type Wallet = Camelize<ApiWallet>;

/**
 * Создаёт новый платёж.
 */

export type TPaymentPayload = {
  payerId: string;
  payeeId: string;
  taskId: string;
  objectType: "CONTRACT" | "INVOICE";
  objectId?: string;
  walletId: string;
  amount: number;
  description?: string;
};

export async function createPayment(
  payload: TPaymentPayload,
): Promise<Payment> {
  const { data, error } = await supabase
    .from("payments")
    .insert({
      payer_id: payload.payerId,
      payee_id: payload.payeeId,
      task_id: payload.taskId,
      object_type: payload.objectType,
      object_id: payload.objectId ?? null,
      wallet_id: payload.walletId,
      amount: payload.amount,
      description: payload.description ?? null,
    })
    .select(
      `
      *
      ,payer:profiles!payments_payer_id_fkey(email)
      ,payee:profiles!payments_payee_id_fkey(email)
    `,
    )
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
    .from("payments")
    .update({ status })
    .eq("id", id)
    .select(
      `
      *
      ,payer:profiles!payments_payer_id_fkey(email)
      ,payee:profiles!payments_payee_id_fkey(email)
    `,
    )
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
  taskId: string,
): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select(
      `
        *
        ,payer:profiles!payments_payer_id_fkey(email)
        ,payee:profiles!payments_payee_id_fkey(email)
      `,
    )
    .eq("task_id", taskId)
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
    .from("payments")
    .select(
      `
        *
        ,payer:profiles!payments_payer_id_fkey(email)
        ,payee:profiles!payments_payee_id_fkey(email)
      `,
    )
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
    .from("wallets")
    .select("*")
    .eq("user_id", userId);
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to fetch wallets");
  }
  return data.map((d) => camelizeObject<Wallet>(d));
}
