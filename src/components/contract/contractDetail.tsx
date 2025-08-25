// src/components/ContractDetail.tsx
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useAppStore } from "../../store";
import { useAuthUser } from "../../hooks";
import { Button } from "@headlessui/react";
import { downloadDocument } from "../../api";

export function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthUser();
  const navigate = useNavigate();
  const {
    contractsStore: {
      selected: c,
      loading,
      getById,
      save,
      delete: deleteContract,
    },
  } = useAppStore();

  useEffect(() => {
    if (id) {
      getById(id);
    }
  }, [id, getById]);

  if (!user || loading || !c) {
    return <p>Загрузка…</p>;
  }

  const isCreator = user.id === c.creator_id;
  const isSideB = user.id === c.user_b;

  const onSignA = () => {
    save(c.id, { date_signed_a: new Date().toISOString() });
  };
  const onSignB = () => {
    save(c.id, { date_signed_b: new Date().toISOString() });
  };
  const onDelete = () => {
    deleteContract(c.id).then(() => navigate("/contracts"));
  };
  const onEdit = () => {
    navigate(`/contracts/${c.id}/edit`);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl">{c.title}</h1>
      <p>{c.description}</p>
      <p>
        Период: {c.start_date} — {c.end_date ?? "—"}
      </p>
      <Button
        onClick={() => {
          downloadDocument(c.file_url);
        }}
        className="underline"
      >
        Скачать PDF
      </Button>
      <p>Статус: {c.status}</p>

      {c.status === "DRAFT" && isCreator && (
        <div className="space-x-2">
          <button onClick={onEdit} className="btn">
            Редактировать
          </button>
          <button onClick={onSignA} className="btn">
            Подписать (A)
          </button>
          <button onClick={onDelete} className="btn text-red-600">
            Удалить
          </button>
        </div>
      )}

      {c.status === "PENDING" && isSideB && (
        <button onClick={onSignB} className="btn">
          Подписать (B)
        </button>
      )}
    </div>
  );
}
