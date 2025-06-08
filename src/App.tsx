import { Route, Routes, useNavigate } from "react-router";
import "./App.css";
import { AppLayout, type User } from "./components/layout/appLayout";
import { Dashboard } from "./components/routes/dashboard";
import { ProjectsList } from "./components/routes/projectsList";
import { Project } from "./components/routes/project";
import { ProjectLayout } from "./components/layout/projectLayout";
import { Schedule } from "./components/routes/schedule";
import { Finance } from "./components/routes/finance";
import { Document } from "./components/routes/document";
import { Login } from "./components/routes/login";

import "wx-react-gantt/dist/gantt.css";
import { supabase } from "./api/getClient";
import { useEffect, useState } from "react";

function App() {
  const navigate = useNavigate();
  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
    }
    return user;
  };

  const [user, setUser] = useState({ id: "-1", email: "anonimous" });

  useEffect(() => {
    const data = getUser();
    if (data) {
      setUser(data);
    }
  }, []);

  return (
    <AppLayout user={user as User}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/project">
          <Route index element={<ProjectsList />} />
          <Route element={<ProjectLayout />}>
            <Route path=":pid" element={<Project />} />
            <Route path=":pid/schedule" element={<Schedule />} />
            <Route path=":pid/finance" element={<Finance />} />
            <Route path=":pid/document" element={<Document />} />
          </Route>
        </Route>
        <Route path="/login" element={<Login />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
