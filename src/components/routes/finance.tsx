import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import { useProjectPayments, useWallets } from "../../hooks/usePayments";
import { PaymentList, WalletBalance, PaymentForm } from "../payments";
import { useAuthUser } from "../../hooks";
import { Section, Button } from "../catalyst";
import { useAppStore } from "../../store";

export const Finance: React.FC = () => {
  const user = useAuthUser();
  const { projectId } = useOutletContext<{ projectId: string }>();
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const {
    payments,
    reload: paymentsReload,
    updateStatus,
  } = useProjectPayments(projectId!);
  const { wallets, reload: walletsReload } = useWallets(user.id);
  const { contracts, getList: getContracts } = useAppStore(
    (s) => s.contractsStore,
  );
  const { documents, getTaskDocuments } = useAppStore((s) => s.documentsStore);

  useEffect(() => {
    paymentsReload();
  }, [paymentsReload]);

  useEffect(() => {
    if (!contracts.length) {
      getContracts();
    }
  }, []);

  useEffect(() => {
    if (!documents?.tasks?.[projectId]?.length) {
      getTaskDocuments(projectId);
    }
  }, []);

  const switchModal = () => {
    setModalIsOpen((prev) => !prev);
  };

  const onuUdateStatus = (
    id: string,
    status: "pending" | "captured" | "failed",
  ) => {
    updateStatus(id, status).then(() => {
      paymentsReload();
      walletsReload();
    });
  };

  return (
    <Section className="p-5">
      <WalletBalance wallets={wallets} />
      <Button className="mb-5 mt-5" disabled={!wallets} onClick={switchModal}>
        Pay
      </Button>
      <PaymentList payments={payments} onUpdateStatus={onuUdateStatus} />
      <PaymentForm
        open={modalIsOpen}
        wallets={wallets}
        documents={documents}
        contracts={contracts}
        projectId={projectId}
        onClose={() => {
          walletsReload();
          setModalIsOpen(false);
        }}
      />
    </Section>
  );
};
