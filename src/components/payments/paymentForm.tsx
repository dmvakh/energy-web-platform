import React, { useState, useEffect, type FormEvent } from "react";
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogActions,
} from "../catalyst/dialog";
import { Field, Label } from "../catalyst/fieldset";
import { Input } from "../catalyst/input";
import { Select } from "../catalyst/select";
import { Button } from "../catalyst/button";

import { useAuthUser } from "../../hooks";
import { useProjectPayments } from "../../hooks/usePayments";
import { useAppStore, type TDocuments } from "../../store";
import {
  fetchUsersByEmail,
  type TContract,
  type TUserProfile,
  type Wallet,
} from "../../api";
import type { FileObject } from "@supabase/storage-js";

type TComponentType = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  wallets: Wallet[];
  documents: TDocuments;
  contracts: TContract[];
  projectId: string;
};

export const PaymentForm: React.FC<TComponentType> = ({
  open,
  onClose,
  onSuccess,
  wallets,
  documents,
  contracts,
  projectId,
}) => {
  const user = useAuthUser();
  const { create } = useProjectPayments(projectId!);
  const { tasks: projectTasks } = useAppStore((s) => s.tasksStore);
  const { getTaskDocuments } = useAppStore((s) => s.documentsStore);

  // form state
  const [projectIdSel, setProjectIdSel] = useState<string>(projectId!);
  const [payeeQuery, setPayeeQuery] = useState("");
  const [payees, setPayees] = useState<TUserProfile[]>([]);
  const [payeeId, setPayeeId] = useState<string>("");
  const [walletId, setWalletId] = useState<string>("");
  const [paymentType, setPaymentType] = useState<
    "CONTRACT" | "INVOICE" | undefined
  >(undefined);
  const [contractId, setContractId] = useState<string>("");
  const [invoiceFileName, setInvoiceFileName] = useState<string>("");
  const [amount, setAmount] = useState("");
  // const [description, setDescription] = useState("");

  const projectContracts = contracts.filter(
    (c) => c.task_id === projectIdSel && c.status === "SIGNED",
  );

  const invoiceFiles: FileObject[] = documents.tasks?.[projectIdSel] ?? [];

  // initialize selectors when dialog opens or data changes
  useEffect(() => {
    if (!open) return;
    if (projectTasks.length) {
      setProjectIdSel(projectTasks[0].id);
    }
    if (wallets.length) {
      setWalletId(wallets[0].id);
    }
  }, [open, projectTasks, wallets]);

  // clear and reload when project changes
  useEffect(() => {
    setContractId("");
    setInvoiceFileName("");
  }, [projectIdSel]);

  useEffect(() => {
    if (!paymentType) {
      setContractId("");
      setInvoiceFileName("");
    }
    if (paymentType === "CONTRACT") {
      setContractId(contracts[0].id);
    }
    if (paymentType === "INVOICE") {
      setInvoiceFileName(documents.tasks[projectId][0].id);
    }
  }, [paymentType, documents?.tasks, contracts, projectId]);

  // search payees by email substring
  useEffect(() => {
    if (!payeeQuery) {
      setPayees([]);
      setPayeeId("");
      return;
    }
    const t = setTimeout(async () => {
      const users = await fetchUsersByEmail(payeeQuery);
      setPayees(users);
      if (users.length) setPayeeId(users[0].id);
    }, 300);
    return () => clearTimeout(t);
  }, [payeeQuery]);

  useEffect(() => {
    if (!documents?.tasks?.[projectId]?.length) {
      getTaskDocuments(projectId);
    }
  }, [documents?.tasks, getTaskDocuments, projectId]);

  // form validation
  const isObjectSelected =
    paymentType === "CONTRACT" ? !!contractId : !!invoiceFileName;
  const isFormValid =
    !!projectIdSel &&
    !!paymentType &&
    isObjectSelected &&
    !!payeeId &&
    !!walletId &&
    !!amount &&
    !isNaN(parseFloat(amount));

  // handle submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !isFormValid) return;

    const objectId = paymentType === "CONTRACT" ? contractId : invoiceFileName;

    await create({
      payerId: user.id,
      payeeId,
      taskId: projectIdSel,
      objectType: paymentType,
      objectId,
      walletId,
      amount: parseFloat(amount),
      // description: description || undefined,
    });

    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  // if no wallets, cannot pay
  if (
    open &&
    (wallets.length === 0 ||
      (invoiceFiles.length === 0 && contracts.length === 0))
  ) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Создать платёж</DialogTitle>
        <DialogDescription>
          У вас нет доступных кошельков, вы не можете совершить платеж.
        </DialogDescription>
        <DialogActions>
          <Button onClick={onClose}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Создать платёж</DialogTitle>
        <DialogDescription>
          Заполните обязательные поля, чтобы активировать кнопку «Создать»
        </DialogDescription>

        <DialogBody className="space-y-4">
          {/* Project selector */}
          <Field>
            <Label htmlFor="project">Проект</Label>
            <Select
              id="project"
              value={projectIdSel}
              onChange={(e) => setProjectIdSel(e.target.value)}
              className="mt-1 w-full"
            >
              {projectTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Select>
          </Field>

          {/* Type selector */}
          <Field>
            <Label htmlFor="type">Тип платежа</Label>
            <Select
              id="type"
              value={paymentType}
              onChange={(e) =>
                setPaymentType(e.target.value as "CONTRACT" | "INVOICE")
              }
              className="mt-1 w-full"
            >
              <option value={undefined}>🤑 select payment type 🤑</option>
              <option value="CONTRACT">Контракт</option>
              <option value="INVOICE">Счёт</option>
            </Select>
          </Field>

          {/* Conditional selectors */}
          {paymentType === "CONTRACT" && projectContracts.length > 0 && (
            <Field>
              <Label htmlFor="CONTRACT">Контракт</Label>
              <Select
                id="CONTRACT"
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
                className="mt-1 w-full"
              >
                {projectContracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {paymentType === "CONTRACT" && projectContracts.length === 0 && (
            <p className="text-sm text-red-600">
              В этом проекте нет контрактов
            </p>
          )}

          {paymentType === "INVOICE" && invoiceFiles.length > 0 && (
            <Field>
              <Label htmlFor="INVOICE">Файл счёта</Label>
              <Select
                id="INVOICE"
                value={invoiceFileName}
                onChange={(e) => setInvoiceFileName(e.target.value)}
                className="mt-1 w-full"
              >
                {invoiceFiles.map((f) => (
                  <option key={f.name} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {paymentType === "INVOICE" && invoiceFiles.length === 0 && (
            <p className="text-sm text-red-600">
              В этом проекте нет файлов счётов
            </p>
          )}

          {/* Payee search & select */}
          <Field>
            <Label htmlFor="payeeQuery">Найти получателя по e-mail</Label>
            <Input
              id="payeeQuery"
              value={payeeQuery}
              onChange={(e) => setPayeeQuery(e.target.value)}
              placeholder="Начните вводить e-mail..."
              className="mt-1 w-full"
            />
          </Field>
          {payees.length > 0 && (
            <Field>
              <Label htmlFor="payee">Получатель</Label>
              <Select
                id="payee"
                value={payeeId}
                onChange={(e) => setPayeeId(e.target.value)}
                className="mt-1 w-full"
              >
                {payees.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email} ({u.first_name} {u.last_name})
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {/* Wallet selector */}
          <Field>
            <Label htmlFor="wallet">Кошелёк</Label>
            <Select
              id="wallet"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="mt-1 w-full"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.currency}
                </option>
              ))}
            </Select>
          </Field>

          {/* Amount */}
          <Field>
            <Label htmlFor="amount">Сумма</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1 w-full"
            />
          </Field>
        </DialogBody>

        <DialogActions className="flex justify-end space-x-2">
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" disabled={!isFormValid}>
            Создать
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
