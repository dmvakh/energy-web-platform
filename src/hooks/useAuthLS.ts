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
    const loadUserWithProfile = async () => {
      const { data, error } = await supabase.auth.getSession();

      const sessionUser = data.session?.user;

      if (error || !sessionUser) {
        setUser(guestUser);
        return;
      }

      // получаем профиль
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sessionUser.id)
        .single();

      if (profile && !profileError) {
        // добавляем профиль в user_metadata
        const fullUser = {
          ...sessionUser,
          user_metadata: {
            ...sessionUser.user_metadata,
            profile, // будет доступен как user.user_metadata.profile
          },
        };
        setUser(fullUser);
      } else {
        setUser(sessionUser);
      }
    };

    loadUserWithProfile();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const sessionUser = session?.user;

        if (!sessionUser) {
          setUser(guestUser);
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", sessionUser.id)
          .single();

        if (profile && !error) {
          setUser({
            ...sessionUser,
            user_metadata: {
              ...sessionUser.user_metadata,
              profile,
            },
          });
        } else {
          setUser(sessionUser);
        }
      },
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  return user;
}
