"use client";

import "./global.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div style={{ height: "100%" }}>{children}</div>;
}
