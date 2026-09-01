import { useEffect, useState } from "react";
import { getSessionUser, type SessionUser } from "../services/auth";

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    getSessionUser().then((user) => {
      if (mounted) setCurrentUser(user);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return currentUser;
}
