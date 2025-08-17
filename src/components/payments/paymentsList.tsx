import React from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../catalyst";
import { Button } from "../catalyst";
import type { Payment } from "../../api/payments";
import { formatMoney } from "../../utils/payments";

type PaymentListProps = {
  payments: Payment[];
  onUpdateStatus?: (
    id: string,
    status: "pending" | "captured" | "failed",
  ) => void;
};

export const PaymentList: React.FC<PaymentListProps> = ({
  payments,
  onUpdateStatus,
}) => {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Дата</TableHeader>
          <TableHeader>Получатель</TableHeader>
          <TableHeader>Сумма</TableHeader>
          <TableHeader>Статус</TableHeader>
          {onUpdateStatus && <TableHeader>Действия</TableHeader>}
        </TableRow>
      </TableHead>
      <TableBody>
        {payments.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="p-1">
              {new Date(p.createdAt).toLocaleString("ru-RU")}
            </TableCell>
            <TableCell>{p.payee.email}</TableCell>
            <TableCell>{formatMoney(p.amount)}</TableCell>
            <TableCell>{p.status}</TableCell>
            {onUpdateStatus && (
              <TableCell className="flex space-x-2">
                {
                  <>
                    {p.status !== "captured" && (
                      <Button onClick={() => onUpdateStatus(p.id, "captured")}>
                        Подтвердить
                      </Button>
                    )}
                    {p.status !== "failed" && (
                      <Button
                        onClick={() => {
                          onUpdateStatus(p.id, "failed");
                        }}
                      >
                        Отменить
                      </Button>
                    )}
                  </>
                }
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
