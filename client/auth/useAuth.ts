import { useEffect, useState } from "react";

export function useAuth() {
  const [userId, setUserId] = useState<number | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("avm_token");
    const storedRole = localStorage.getItem("avm_role");
    const storedUserId = localStorage.getItem("avm_user_id");

    if (storedToken && storedUserId) {
      setToken(storedToken);
      setRole(storedRole);
      setUserId(Number(storedUserId));
    }

    setLoading(false);
  }, []);

  return {
    token,
    role,
    userId,
    loading,
    isAuthenticated: !!token,
  };
}
