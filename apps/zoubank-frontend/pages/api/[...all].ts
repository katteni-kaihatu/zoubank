// pages/api/[...all].ts
import { createProxyMiddleware } from "http-proxy-middleware";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

const proxy = createProxyMiddleware({
  target: process.env.NEXT_PUBLIC_API_URL ?? "http://backend:3000",
  changeOrigin: true,
  pathRewrite: {
    "^/api": "", // /apiを削除
  },
});

const api = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "OPTIONS") {
    res.end();
    return;
  }
  return proxy(req, res);
};

export default api;
