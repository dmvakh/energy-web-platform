import { useEffect } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import EllipsisHorizontalIcon from "@heroicons/react/20/solid/EllipsisHorizontalIcon";
import { Button, Heading } from "../catalyst";
import clsx from "clsx";
import { useAppStore, type TAppStore } from "../../store";
import { useNavigate } from "react-router";

const statuses = {
  PENDING: "text-gray-600 bg-gray-50 ring-gray-500/10",
  IN_PROGRESS: "text-green-700 bg-green-50 ring-green-600/20",
  REVIEW: "text-red-700 bg-red-50 ring-red-600/10",
  COMPLETED: "text-blue-700 bg-red-50 ring-red-600/10",
};

export const ProjectsList = () => {
  const { tasks, getTasks, resetTask, setTask } = useAppStore(
    (s: TAppStore) => s.tasksStore,
  );
  const navigate = useNavigate();

  useEffect(() => {
    resetTask();
    getTasks();
  }, []);

  const toTask = (id: string): void => {
    setTask(id);
    navigate(`/project/${id}`);
  };

  return (
    <>
      <div className="flex w-full flex-wrap items-end justify-between gap-4 border-b border-zinc-950/10 pb-6 dark:border-white/10">
        <Heading>Projects</Heading>
        <Button>New project</Button>
      </div>

      <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="overflow-hidden rounded-xl border border-gray-200"
          >
            <div className="flex items-center gap-x-4 border-b border-gray-900/5 bg-gray-50 p-6">
              {/* <img
                alt={task.name}
                src={task.imageUrl}
                className="size-12 flex-none rounded-lg bg-white object-cover ring-1 ring-gray-900/10"
              /> */}
              <div className="text-sm/6 font-medium text-gray-900">
                {task.title}
              </div>
              <Menu as="div" className="relative ml-auto">
                <MenuButton className="-m-2.5 block p-2.5 text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Open options</span>
                  <EllipsisHorizontalIcon
                    aria-hidden="true"
                    className="size-5"
                  />
                </MenuButton>
                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-0.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                >
                  <MenuItem>
                    <a
                      onClick={() => toTask(task.id)}
                      className="block px-3 py-1 text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"
                    >
                      View<span className="sr-only">, {task.title}</span>
                    </a>
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>
            <dl className="-my-3 divide-y divide-gray-100 px-6 py-4 text-sm/6">
              <div className="flex justify-between gap-x-4 py-3">
                <dt className="text-gray-500">Start</dt>
                <dd className="text-gray-700">
                  <time dateTime={task.startDate}>{task.startDate}</time>
                </dd>
              </div>
              <div className="flex justify-between gap-x-4 py-3">
                <dt className="text-gray-500">End</dt>
                <dd className="text-gray-700">
                  <time dateTime={task.endDate}>{task.endDate}</time>
                </dd>
              </div>
              <div className="flex justify-between gap-x-4 py-3">
                <dt className="text-gray-500">Balance</dt>
                <dd className="flex items-start gap-x-2">
                  <div className="font-medium text-gray-900">
                    {/* {task.transactions_summary[0].total_amount} */}
                    100500
                  </div>
                  <div
                    className={clsx(
                      statuses[task.status],
                      "rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                    )}
                  >
                    {task.status}
                  </div>
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
};
