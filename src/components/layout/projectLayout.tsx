import { NavLink, Outlet, useLocation, useParams } from "react-router";
import { Heading } from "../catalyst";
import clsx from "clsx";
import { useAppStore, type TAppStore } from "../../store";
import { useEffect } from "react";
import { Loader } from "../loader";

const tabs = [
  { name: "Обзор", href: "", current: false },
  // { name: "План", href: "schedule", current: false },
  // { name: "Финансы", href: "finance", current: true },
  { name: "Документы", href: "document", current: false },
  { name: "Назначения", href: "assign", current: false },
];

export const ProjectLayout = () => {
  const { selectedTask, getTaskById } = useAppStore(
    (s: TAppStore) => s.tasksStore,
  );
  const { id } = useParams();
  const location = useLocation();
  useEffect(() => {
    if (!selectedTask && id) {
      getTaskById(id);
    }
  }, []);

  if (!selectedTask) {
    return <Loader />;
  }

  return (
    <>
      <div className="flex w-full flex-wrap items-end justify-between gap-4 border-b border-zinc-950/10 pb-6 dark:border-white/10">
        <Heading>Project: {selectedTask.title}</Heading>
      </div>
      <div className="my-4">
        <div className="grid grid-cols-1 sm:hidden">
          {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
          <select
            defaultValue={tabs.find((tab) => tab.current)?.name ?? tabs[0].name}
            aria-label="Select a tab"
            className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
          >
            {tabs.map((tab) => (
              <option key={tab.name}>{tab.name}</option>
            ))}
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav aria-label="Tabs" className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const to = `/project/${id}/${tab.href}`;
                const isActive =
                  location.pathname === to ||
                  location.pathname === to.replace(/\/\.$/, "");
                return (
                  <NavLink
                    key={tab.name}
                    to={to}
                    className={clsx(
                      "border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap",
                      {
                        "border-indigo-500 text-indigo-600": isActive,
                        "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700":
                          !isActive,
                      },
                    )}
                  >
                    {tab.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
      <Outlet context={{ task: selectedTask }} />
    </>
  );
};
