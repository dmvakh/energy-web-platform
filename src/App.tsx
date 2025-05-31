import { Route, Routes } from "react-router";
import "./App.css";
import { AppLayout, type User } from "./components/layout/appLayout";
import { Dashboard } from "./components/routes/dashboard";
import { ProjectsList } from "./components/routes/projectsList";
import { Project } from "./components/routes/project";
import { ProjectLayout } from "./components/layout/projectLayout";
import { Schedule } from "./components/routes/schedule";
import { Finance } from "./components/routes/finance";
import { Document } from "./components/routes/document";

import "wx-react-gantt/dist/gantt.css";

function App() {
  const user = { id: "1", email: "test@user.mail" };

  return (
    <AppLayout user={user as User}>
      <Routes>
        <Route path='/' element={<Dashboard />} />
        <Route path='/project'>
          <Route index element={<ProjectsList />} />
          <Route element={<ProjectLayout />}>
            <Route path=':pid' element={<Project />} />
            <Route path=':pid/schedule' element={<Schedule />} />
            <Route path=':pid/finance' element={<Finance />} />
            <Route path=':pid/document' element={<Document />} />
          </Route>
        </Route>
      </Routes>
    </AppLayout>
  );
}

export default App;
