import type { ReactNode } from "react";

import { Sidebar, SidebarLayout } from "../catalyst";

import { FooterBlock } from "../layout/footerBlock";
import { HeaderBlock } from "../layout/headerBlock";
import { BodyBlock } from "../layout/bodyBlock";
import { NavBlock } from "../layout/navBlock";

export type User = {
  id: string;
  email: string;
};

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <SidebarLayout
      navbar={<NavBlock />}
      sidebar={
        <Sidebar>
          <HeaderBlock />
          <BodyBlock />
          <FooterBlock />
        </Sidebar>
      }
    >
      {children}
    </SidebarLayout>
  );
};
