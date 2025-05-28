import type { AppProps } from "next/app";
import RootLayout from "@/app/layout";

import Head from "next/head";
import { TranslationProvider } from "@/contexts/Translation";
import CSR from "@/components/CSR";
import { ApplicationProvider } from "@/contexts/Application";
import ApiProvider from "@/contexts/Api";
import { ApiClient } from "@/lib/api";
import { useEffect, useState } from "react";

const App = ({ Component, pageProps }: AppProps) => {
  const [api, initializeApi] = useState<ApiClient>();

  useEffect(() => {
    const api = new ApiClient();
    initializeApi(api);
  }, []);

  if (!api) return <></>;

  return (
    <CSR>
      <Head>
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Cache-Control" content="no-cache" />
      </Head>
      <RootLayout>
        <ApiProvider api={api}>
          <ApplicationProvider>
            <TranslationProvider>
              <AppCover {...pageProps} Component={Component} />
            </TranslationProvider>
          </ApplicationProvider>
        </ApiProvider>
      </RootLayout>
    </CSR>
  );
};

const AppCover = ({ Component, pageProps }: AppProps) => {
  return <Component {...pageProps} />;
};
export default App;
