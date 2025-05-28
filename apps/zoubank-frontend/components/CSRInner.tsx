import { Box } from "@mui/material";

const CSRInner = ({ children }: { children: JSX.Element | JSX.Element[] }) => {
  return <Box sx={{ height: "100%" }}>{children}</Box>;
};

export default CSRInner;
