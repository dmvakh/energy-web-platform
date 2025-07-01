import React, { useEffect, useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import EllipsisHorizontalIcon from "@heroicons/react/20/solid/EllipsisHorizontalIcon";
import {
  Button,
  Heading,
  DescriptionList,
  DescriptionTerm,
  DescriptionDetails,
} from "../catalyst";
import clsx from "clsx";
import { useAppStore, type TAppStore } from "../../store";
import { useNavigate } from "react-router";
import { useAuthUser } from "../../hooks";
import { ProjectForm, type TTaskFormDefaults } from "../projectForm";
import { saveTask, UserRoles } from "../../api";
import type { TTaskStatus, TUserRoles } from "../../api";

const statuses: Record<TTaskStatus, string> = {
  PENDING: "text-gray-600 bg-gray-50 ring-gray-500/10",
  IN_PROGRESS: "text-green-700 bg-green-50 ring-green-600/20",
  REVIEW: "text-red-700 bg-red-50 ring-red-600/10",
  COMPLETED: "text-blue-700 bg-blue-50 ring-blue-600/20",
};

export const ProjectsList: React.FC = () => {
  const { tasks, getTasks, resetTask, setTask, deleteTask, units, getUnits } =
    useAppStore((s: TAppStore) => s.tasksStore);

  const navigate = useNavigate();
  const user = useAuthUser();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    resetTask();
    if (!tasks.length) {
      getTasks();
    }
  }, [resetTask, getTasks, tasks.length]);

  useEffect(() => {
    if (!units.length) {
      getUnits();
    }
  }, [units.length, getUnits]);

  const toTask = (id: string): void => {
    setTask(id);
    navigate(`/project/${id}`);
  };

  const role: TUserRoles =
    user.user_metadata?.profile?.role ?? UserRoles.WORKER;

  const canCreate = role === UserRoles.ADMIN || role === UserRoles.MANAGER;

  const handleCreate = (): void => setShowForm(true);
  const handleCancel = (): void => setShowForm(false);

  const handleSaveNew = async (data: TTaskFormDefaults) => {
    await saveTask(data);
    await getTasks();
    setShowForm(false);
  };

  return (
    <>
      <div className="flex w-full flex-wrap items-end justify-between gap-4 border-b border-zinc-950/10 pb-6 dark:border-white/10">
        <Heading>Projects</Heading>
        {canCreate && <Button onClick={handleCreate}>New project</Button>}
      </div>

      {showForm && (
        <div className="mt-6">
          <ProjectForm
            initialData={{}}
            onSave={handleSaveNew}
            onCancel={handleCancel}
            saving={false}
          />
        </div>
      )}

      {!showForm && (
        <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="overflow-hidden rounded-xl border border-gray-200"
            >
              <div className="flex items-center gap-x-4 border-b border-gray-900/5 bg-gray-50 p-6">
                <div className="text-sm/6 font-medium text-gray-900">
                  {task.title}
                </div>
                <Menu as="div" className="relative ml-auto">
                  <MenuButton className="-m-2.5 block p-2.5 text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Open options</span>
                    <EllipsisHorizontalIcon
                      aria-hidden="true"
                      className="h-5 w-5"
                    />
                  </MenuButton>
                  <MenuItems
                    transition
                    className="absolute right-0 z-10 mt-0.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none"
                  >
                    <MenuItem>
                      <button
                        onClick={() => toTask(task.id)}
                        className="block w-full text-left px-3 py-1 text-sm/6 text-gray-900 hover:bg-gray-50 focus:outline-none"
                      >
                        View
                      </button>
                    </MenuItem>
                    <MenuItem>
                      <button
                        onClick={() => {
                          deleteTask(task.id);
                        }}
                        className="block w-full text-left px-3 py-1 text-sm/6 text-gray-900 hover:bg-gray-50 focus:outline-none"
                      >
                        Delete
                      </button>
                    </MenuItem>
                  </MenuItems>
                </Menu>
              </div>

              <DescriptionList className="divide-y divide-gray-100 px-6 py-4 text-sm/6">
                <div className="flex justify-between gap-x-4 py-3">
                  <DescriptionTerm>Start</DescriptionTerm>
                  <DescriptionDetails>
                    <time dateTime={task.startDate}>{task.startDate}</time>
                  </DescriptionDetails>
                </div>
                <div className="flex justify-between gap-x-4 py-3">
                  <DescriptionTerm>End</DescriptionTerm>
                  <DescriptionDetails>
                    <time dateTime={task.endDate}>{task.endDate}</time>
                  </DescriptionDetails>
                </div>
                <div className="flex justify-between gap-x-4 py-3">
                  <DescriptionTerm>Balance</DescriptionTerm>
                  <DescriptionDetails>
                    <div className="flex items-start gap-x-2">
                      <div className="font-medium text-gray-900">100500</div>
                      <div
                        className={clsx(
                          statuses[task.status],
                          "rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                        )}
                      >
                        {task.status}
                      </div>
                    </div>
                  </DescriptionDetails>
                </div>
              </DescriptionList>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};
