import React from "react";
import { Badge } from "../catalyst";
import { Text } from "../catalyst";
import type { Wallet } from "../../api/payments";
import { formatMoney } from "../../utils";

type WalletBalanceProps = {
  wallets: Wallet[];
};

export const WalletBalance: React.FC<WalletBalanceProps> = ({ wallets }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-5">
    {wallets.map((w) => (
      <div
        key={w.id}
        className="bg-white border rounded-lg p-4 flex flex-col items-start"
      >
        <Badge className="uppercase">{w.currency}</Badge>
        <Text className="mt-2">{formatMoney(w.balance, w.currency)}</Text>
      </div>
    ))}
  </div>
);
