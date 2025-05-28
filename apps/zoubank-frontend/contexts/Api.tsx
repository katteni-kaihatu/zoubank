import { createContext, ReactNode, useContext } from "react";
import { ApiClient } from "@/lib/api";

const ApiContext = createContext<ApiClient | undefined>(undefined);

export interface ApiProviderProps {
  children: ReactNode;
  api: ApiClient;
}

export default function ApiProvider(props: ApiProviderProps): ReactNode {
  return (
    <ApiContext.Provider value={props.api}>
      {props.children}
    </ApiContext.Provider>
  );
}

export function useApi(): ApiClient {
  return useContext(ApiContext) as ApiClient;
}
