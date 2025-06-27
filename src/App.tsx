import { Route, Routes, Outlet } from "react-router";
import "./App.css";
import { AppLayout } from "./components/layout/appLayout";
import { Dashboard } from "./components/routes/dashboard";
import { ProjectsList } from "./components/routes/projectsList";
import { Project } from "./components/routes/project";
import { ProjectLayout } from "./components/layout/projectLayout";
import { Schedule } from "./components/routes/schedule";
import { Finance } from "./components/routes/finance";
import { Document } from "./components/routes/document";
import { Login } from "./components/routes/login";

import "wx-react-gantt/dist/gantt.css";
import { ProtectedRoute } from "./components/routes/protectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout>
              <Outlet />
            </AppLayout>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="project">
          <Route index element={<ProjectsList />} />
          <Route element={<ProjectLayout />}>
            <Route path=":id" element={<Project />} />
            <Route path=":id/schedule" element={<Schedule />} />
            <Route path=":id/finance" element={<Finance />} />
            <Route path=":id/document" element={<Document />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
export default App;
