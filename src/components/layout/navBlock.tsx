import { Avatar } from "../catalyst/avatar";
import {
  Navbar,
  NavbarItem,
  NavbarSection,
  NavbarSpacer,
} from "../catalyst/navbar";

export const NavBlock = () => {
  return (
    <Navbar>
      <NavbarSpacer />
      <NavbarSection>
        <NavbarItem href='/' aria-label='Home'>
          <Avatar src='https://doodleipsum.com/700/avatar-2' square />
        </NavbarItem>
      </NavbarSection>
    </Navbar>
  );
};
