import {
  SidebarBody,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from "../catalyst/sidebar";
import HomeModernIcon from "@heroicons/react/20/solid/HomeModernIcon";
import RectangleGroupIcon from "@heroicons/react/20/solid/RectangleGroupIcon";
import DocumentTextIcon from "@heroicons/react/20/solid/DocumentTextIcon";

export const BodyBlock = () => {
  return (
    <SidebarBody>
      <SidebarSection>
        <SidebarItem href="/">
          <RectangleGroupIcon className="w-5 h-5" />
          <SidebarLabel>Dashboard</SidebarLabel>
        </SidebarItem>
        <SidebarItem href="/project">
          <HomeModernIcon className="w-5 h-5" />
          <SidebarLabel>Projects</SidebarLabel>
        </SidebarItem>
        <SidebarItem href="/contracts">
          <DocumentTextIcon className="w-5 h-5" />
          <SidebarLabel>Contracts</SidebarLabel>
        </SidebarItem>
        <SidebarItem href="/payments">
          <DocumentTextIcon className="w-5 h-5" />
          <SidebarLabel>Payments</SidebarLabel>
        </SidebarItem>
      </SidebarSection>
    </SidebarBody>
  );
};
