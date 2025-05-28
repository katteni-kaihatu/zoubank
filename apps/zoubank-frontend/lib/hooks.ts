import { useApi } from "@/contexts/Api";
import { useEffect, useState } from "react";

export type ResoniteUser = {
  id: string;
  username: string;
  profile?: {
    iconUrl: string;
  };
};

type Response<T> =
  | {
      status: "success";
      data: T;
    }
  | {
      status: "error";
    }
  | {
      status: "loading";
    };

const resoniteUserCache = new Map<
  string,
  Promise<{ data: ResoniteUser | null; updatedAt: number }>
>();

export const useResoniteUser = (userId: string): Response<ResoniteUser> => {
  const api = useApi();
  const [user, setUser] = useState<Response<ResoniteUser>>({
    status: "loading",
  });
  useEffect(() => {
    if (userId.startsWith("U-")) {
      (async () => {
        try {
          const cachePromise = resoniteUserCache.get(userId);
          const cached = cachePromise ? await cachePromise : undefined;

          if (cached && Date.now() - cached.updatedAt < 1000 * 60 * 60) {
            setUser(
              cached.data
                ? {
                    status: "success",
                    data: cached.data,
                  }
                : {
                    status: "error",
                  },
            );
            return;
          }

          const request = (async (): Promise<{
            data: ResoniteUser | null;
            updatedAt: number;
          }> => {
            try {
              const user = await api.getResoniteUserDataFromUserId(userId);
              return { data: user, updatedAt: Date.now() };
            } catch (e) {
              console.error(e);
              return { data: null, updatedAt: Date.now() };
            }
          })();

          resoniteUserCache.set(userId, request);

          const user = await request;

          if (user.data && user.data.id === userId) {
            setUser({
              status: "success",
              data: user.data,
            });
          } else {
            setUser({
              status: "error",
            });
          }
        } catch (e) {
          console.error(e);
          setUser({
            status: "error",
          });
        }
      })();
    } else {
      (async () => {
        const zoubankUser = await api.getZouBankUserFromUserId(userId);

        if(!zoubankUser) {
            setUser({
                status: "error",
            });
            return;
        }

        setUser({
          status: "success",
          data: {
            id: userId,
            username: zoubankUser.resoniteUserId,
          },
        });
      })();
    }
  }, [api, userId]);

  return user;
};
