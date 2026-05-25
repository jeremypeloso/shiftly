import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../lib/auth";

export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkUser() {
      const user = await getCurrentUser();

      if (!mounted) return;

      setAllowed(!!user);
      setChecking(false);
    }

    checkUser();

    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return <div>Chargement...</div>;
  }

  if (!allowed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}