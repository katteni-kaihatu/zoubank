import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useApi } from "@/contexts/Api";

export type UserInfo = {
  id: string;
  accountNumber: string;
  balance: string;
  branchName: string;
  resoniteUserId: string;
  role: string;

  incomingTransfers?: Transaction[];
  outgoingTransfers?: Transaction[];
};

export type Transaction = {
  id: number;
  amount: string;
  createdAt: string;
  senderUserId: string;
  recipientUserId: string;

  sender: UserInfo;
  recipient: UserInfo;

  externalData?: unknown;
};

type ApplicationContextType = {
  appReady: boolean;
  loggedIn: boolean;

  userInfo: UserInfo | null;

  logout: () => void;
  reloadUserInfo: () => void;
  sendTransaction: (
    recipientUserId: string,
    amount: number,
    memo?: string,
    customData?: Record<string, unknown>,
  ) => Promise<boolean>;
};

const ApplicationContext = createContext<ApplicationContextType | undefined>(
  undefined,
);

export const ApplicationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const api = useApi();
  const [appReady, setAppReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const logout = useCallback(() => {
    // cookie connect.sid を消す
    api.logout().then((result) => {
      if (result) {
        setLoggedIn(false);
      }
    });
  }, [api]);

  const reloadUserInfo = useCallback(() => {
    api
      .getUserInfo()
      .then((userInfo) => {
        if (userInfo) {
          setLoggedIn(true);
          setUserInfo(userInfo);
        } else {
          setLoggedIn(false);
        }
      })
      .catch(() => {
        setLoggedIn(false);
      });
  }, [api]);

  const sendTransaction = useCallback(
    async (recipientUserId: string, amount: number, memo?: string, customData: Record<string, unknown> = {}) => {
      if (!userInfo) return false;
      if (amount <= 0) {
        console.error("invalid amount");
        return false;
      }

      if (!recipientUserId) {
        console.error("invalid recipientUserId");
        return false;
      }
      if (
        await api.sendTransfer({
          senderId: userInfo.id,
          recipientId: recipientUserId,
          amount: amount,
          memo,
          customData
        })
      ) {
        reloadUserInfo();
        return true;
      } else {
        return false;
      }
    },
    [api, userInfo, reloadUserInfo],
  );

  useEffect(() => {
    if (!api) {
      console.log("api is not initialized");
    }

    api
      .getUserInfo()
      .then((userInfo) => {
        console.log(userInfo);
        if (userInfo) {
          setLoggedIn(true);
          setUserInfo(userInfo);
        } else {
          setLoggedIn(false);
        }

        setAppReady(true);
      })
      .catch(() => {
        setLoggedIn(false);
        setAppReady(true);
      });
  }, [api]);

  const value = useMemo(() => {
    return {
      appReady,
      loggedIn,
      logout,
      userInfo,
      reloadUserInfo,
      sendTransaction,
    };
  }, [appReady, loggedIn, logout, userInfo, reloadUserInfo, sendTransaction]);

  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplication = () => {
  const context = useContext(ApplicationContext);
  if (context === undefined) {
    throw new Error(
      "useApplicationContext must be used within a ApplicationProvider",
    );
  }
  return context;
};
