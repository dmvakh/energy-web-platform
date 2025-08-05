import { useEffect, Fragment } from "react";
import { Link, useNavigate } from "react-router";
import { useAppStore } from "../../store";
import { useAuthUser } from "../../hooks";
import {
  Button,
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
  Section,
} from "../catalyst";
import { Loader } from "../loader";

export function ContractsList() {
  const user = useAuthUser();
  const {
    contractsStore: { contracts, loading, getList },
  } = useAppStore();

  useEffect(() => {
    if (user) {
      getList();
    }
  }, [getList, user]);

  const navigate = useNavigate();

  if (!user) return null;
  if (loading) return <Loader />;

  console.log("contracts", contracts);

  return (
    <Section className="p-5">
      <Button onClick={() => navigate("/contracts/new")}>
        Создать контракт
      </Button>
      <DescriptionList>
        {contracts.map((c) => (
          <Fragment key={c.id}>
            <DescriptionTerm className="border p-3 rounded flex justify-between items-center">
              <Link to={`/contracts/${c.id}`} className="underline">
                {c.title}
              </Link>
              <span>{c.status}</span>
            </DescriptionTerm>
            <DescriptionDetails>
              <p>
                Start: <time dateTime={c.start_date}>{c.start_date}</time>
              </p>
              <p>
                End:{" "}
                {c.end_date && <time dateTime={c.end_date}>{c.end_date}</time>}
              </p>
              <p>Description: {c.description}</p>
              {c.date_signed_a && <p>Sign A: {c.date_signed_a}</p>}
              {c.date_signed_b && <p>Sign B: {c.date_signed_b}</p>}
              <p>
                Контракт: {c.tasks.title} (
                {`${c.tasks.start_date} - ${c.tasks.end_date}`})
              </p>
            </DescriptionDetails>
          </Fragment>
        ))}
      </DescriptionList>
    </Section>
  );
}
