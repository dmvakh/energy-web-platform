import {
  SidebarBody,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from "../catalyst/sidebar";
import HomeModernIcon from "@heroicons/react/20/solid/HomeModernIcon";
import RectangleGroupIcon from "@heroicons/react/20/solid/RectangleGroupIcon";

export const BodyBlock = () => {
  return (
    <SidebarBody>
      <SidebarSection>
        <SidebarItem href='/'>
          <RectangleGroupIcon />
          <SidebarLabel>Dashboard</SidebarLabel>
        </SidebarItem>
        <SidebarItem href='/project'>
          <HomeModernIcon />
          <SidebarLabel>Projects</SidebarLabel>
        </SidebarItem>
      </SidebarSection>
    </SidebarBody>
  );
};
