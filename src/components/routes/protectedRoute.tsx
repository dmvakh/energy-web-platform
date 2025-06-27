import { Navigate } from "react-router";
import { useEffect, useState } from "react";
import { supabase } from "../../api";
import { Loader } from "../loader";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true); // ⬅️ добавлено

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      setIsAuthenticated(!!data?.user);
      setIsChecking(false); // ⬅️ только после завершения
    };

    checkAuth();
  }, []);

  if (isChecking) {
    return <Loader />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};
