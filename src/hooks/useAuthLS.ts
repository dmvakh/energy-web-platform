import { useEffect, useState } from "react";
import { supabase } from "../api";
import type { User } from "@supabase/supabase-js";

const guestUser: User = {
  id: "guest",
  aud: "public",
  role: "guest",
  email: "guest@example.com",
  email_confirmed_at: undefined,
  phone: "",
  last_sign_in_at: undefined,
  app_metadata: {
    provider: "guest",
    providers: [],
  },
  user_metadata: {},
  created_at: "",
  identities: [],
};

export function useAuthUser(): User {
  const [user, setUser] = useState<User>(guestUser);

  useEffect(() => {
    const initUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Ошибка получения сессии:", error);
        setUser(guestUser);
      } else {
        setUser(data.session?.user ?? guestUser);
      }
    };

    initUser();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? guestUser);
      },
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  return user;
}
