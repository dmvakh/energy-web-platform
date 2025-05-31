import { Avatar } from "../catalyst/avatar";
import {
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
} from "../catalyst/sidebar";


export const HeaderBlock = () => {
  return (
    <SidebarHeader>
      <SidebarItem href='/'>
        <Avatar src='https://doodleipsum.com/700/avatar-2' />
        <SidebarLabel>Energy</SidebarLabel>
      </SidebarItem>
    </SidebarHeader>
  );
};
