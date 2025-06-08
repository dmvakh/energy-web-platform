import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import EllipsisHorizontalIcon from "@heroicons/react/20/solid/EllipsisHorizontalIcon";
import { Button, Heading } from "../catalyst";
import clsx from "clsx";
import { getProjects } from "../../api/projects";

const statuses = {
  Paid: "text-green-700 bg-green-50 ring-green-600/20",
  Withdraw: "text-gray-600 bg-gray-50 ring-gray-500/10",
  Overdue: "text-red-700 bg-red-50 ring-red-600/10",
};
type Status = keyof typeof statuses;

const clients: {
  id: number;
  name: string;
  imageUrl: string;
  lastInvoice: {
    date: string;
    dateTime: string;
    amount: string;
    status: Status;
  };
}[] = [
  {
    id: 1,
    name: "Project #1",
    imageUrl: "https://tailwindcss.com/plus-assets/img/logos/48x48/tuple.svg",
    lastInvoice: {
      date: "December 13, 2024",
      dateTime: "2024-12-13",
      amount: "$2,000.00",
      status: "Overdue",
    },
  },
  {
    id: 2,
    name: "Project #2",
    imageUrl:
      "https://tailwindcss.com/plus-assets/img/logos/48x48/savvycal.svg",
    lastInvoice: {
      date: "January 22, 2025",
      dateTime: "2025-01-22",
      amount: "$14,000.00",
      status: "Paid",
    },
  },
  {
    id: 3,
    name: "Project #3",
    imageUrl: "https://tailwindcss.com/plus-assets/img/logos/48x48/reform.svg",
    lastInvoice: {
      date: "January 23, 2025",
      dateTime: "2025-01-23",
      amount: "$7,600.00",
      status: "Paid",
    },
  },
];

export const ProjectsList = () => {
  return (
    <>
      <div className="flex w-full flex-wrap items-end justify-between gap-4 border-b border-zinc-950/10 pb-6 dark:border-white/10">
        <Heading>Projects</Heading>
        <Button>New project</Button>
      </div>

      <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8">
        {clients.map((client) => (
          <li
            key={client.id}
            className="overflow-hidden rounded-xl border border-gray-200"
          >
            <div className="flex items-center gap-x-4 border-b border-gray-900/5 bg-gray-50 p-6">
              <img
                alt={client.name}
                src={client.imageUrl}
                className="size-12 flex-none rounded-lg bg-white object-cover ring-1 ring-gray-900/10"
              />
              <div className="text-sm/6 font-medium text-gray-900">
                {client.name}
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
                      href="/project/id/"
                      className="block px-3 py-1 text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"
                    >
                      View<span className="sr-only">, {client.name}</span>
                    </a>
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>
            <dl className="-my-3 divide-y divide-gray-100 px-6 py-4 text-sm/6">
              <div className="flex justify-between gap-x-4 py-3">
                <dt className="text-gray-500">Last update</dt>
                <dd className="text-gray-700">
                  <time dateTime={client.lastInvoice.dateTime}>
                    {client.lastInvoice.date}
                  </time>
                </dd>
              </div>
              <div className="flex justify-between gap-x-4 py-3">
                <dt className="text-gray-500">Amount</dt>
                <dd className="flex items-start gap-x-2">
                  <div className="font-medium text-gray-900">
                    {client.lastInvoice.amount}
                  </div>
                  <div
                    className={clsx(
                      statuses[client.lastInvoice.status],
                      "rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                    )}
                  >
                    {client.lastInvoice.status}
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
