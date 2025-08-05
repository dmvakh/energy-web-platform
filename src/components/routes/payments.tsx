import React, { useEffect } from "react";
import { useAuthUser, useMyPayments, useWallets } from "../../hooks";
import { PaymentList, WalletBalance } from "../payments";
import { Loader } from "../loader";
import { Button, Section } from "../catalyst";

export const PaymentsStandalone: React.FC = () => {
  const user = useAuthUser();
  const { payments, loading, reload } = useMyPayments();
  const { wallets } = useWallets(user.id);

  useEffect(() => {
    reload();
  }, [reload]);

  if (loading) {
    return <Loader />;
  }
  return (
    <>
      <WalletBalance wallets={wallets} />
      <Button className="mb-5" onClick={reload}>
        Reload
      </Button>
      <Section className="p-5">
        <h1 className="text-2xl font-bold">Мои платежи</h1>
        <PaymentList payments={payments} />
      </Section>
    </>
  );
};
