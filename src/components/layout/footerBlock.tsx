import { Avatar } from "../catalyst/avatar";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "../catalyst/dropdown";
import { SidebarFooter, SidebarItem } from "../catalyst/sidebar";

import ArrowRightStartOnRectangleIcon from "@heroicons/react/16/solid/ArrowRightStartOnRectangleIcon";
import ChevronUpIcon from "@heroicons/react/16/solid/ChevronUpIcon";
import { type FC } from "react";
import { supabase } from "../../api";
import { useAuthUser } from "../../hooks";
import { useNavigate } from "react-router";

export const FooterBlock: FC = () => {
  const user = useAuthUser();
  const navigate = useNavigate();
  const handleLogout = async () => {
    console.log("user", user);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Ошибка выхода:", error.message);
    }
    navigate("/login");
  };

  return (
    <SidebarFooter className="max-lg:hidden">
      <Dropdown>
        <DropdownButton as={SidebarItem}>
          <span className="flex min-w-0 items-center gap-3">
            <Avatar
              src="https://doodleipsum.com/700/avatar-2"
              className="size-10"
              square
              alt="user avatar"
            />
            <span className="min-w-0">
              {/* <span className='block truncate text-sm/5 font-medium text-zinc-950 dark:text-white'>
                Erica
              </span> */}
              <span className="block truncate text-xs/5 font-normal text-zinc-500 dark:text-zinc-400">
                {user?.email ?? "Anonymous User"}
              </span>
            </span>
          </span>
          <ChevronUpIcon />
        </DropdownButton>
        <DropdownMenu className="min-w-64" anchor="top start">
          {/* <DropdownItem href='/my-profile'>
            <UserIcon />
            <DropdownLabel>My profile</DropdownLabel>
          </DropdownItem> */}
          {/* <DropdownDivider /> */}
          <DropdownItem onClick={handleLogout}>
            <ArrowRightStartOnRectangleIcon />
            <DropdownLabel>Sign out</DropdownLabel>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </SidebarFooter>
  );
};
