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
  user: User;
  children: ReactNode;
}

export const AppLayout = ({ user, children }: AppLayoutProps) => {
  return (
    <SidebarLayout
      navbar={<NavBlock />}
      sidebar={
        <Sidebar>
          <HeaderBlock />
          <BodyBlock />
          <FooterBlock user={user} />
        </Sidebar>
      }
    >
      {children}
    </SidebarLayout>
  );
};
