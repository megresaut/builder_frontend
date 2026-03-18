import { useEffect, useState } from "react";
import { getAccessToken, refreshAccessToken, isTokenValid } from "@/api/auth";

export function useAuth() {
  const [userId, setUserId] = useState<number | null>(() => {
    const v = localStorage.getItem("avm_user_id");
    return v ? Number(v) : null;
  });
  const [role, setRole] = useState<string | null>(
    () => localStorage.getItem("avm_role")
  );

  // If we already have a valid token in memory (hydrated from localStorage
  // at module load), skip the loading state entirely — no async work needed.
  const hasValidToken = isTokenValid(getAccessToken());

  const [loading, setLoading] = useState(!hasValidToken);
  const [authenticated, setAuthenticated] = useState(hasValidToken);

  useEffect(() => {
    // Token was already valid on mount — nothing to do
    if (hasValidToken) return;

    let cancelled = false;

    // No valid token — try refreshing via httpOnly cookie
    refreshAccessToken().then((newToken) => {
      if (cancelled) return;
      if (newToken) {
        setRole(localStorage.getItem("avm_role"));
        const uid = localStorage.getItem("avm_user_id");
        if (uid) setUserId(Number(uid));
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [hasValidToken]);

  return {
    token: getAccessToken(),
    role,
    userId,
    loading,
    isAuthenticated: authenticated,
  };
}
