import {
  AppBar,
  Button,
  Container,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useApplication } from "@/contexts/Application";
import { useState } from "react";
import { Zou } from "@/components/Zou";

export type BankHeaderProps = {
  children?: React.ReactNode;
};

function BankHeader(_props: BankHeaderProps) {
  const app = useApplication();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  if (!app.loggedIn) {
    return (
      <AppBar position="relative" color="primary" elevation={1}>
        <Container>
          <Toolbar variant="dense">
            <Typography
              variant="h6"
              color="inherit"
              component="div"
              sx={{ flexGrow: 1 }}
            >
              <Zou />銀 &nbsp;
              <Typography variant="subtitle1" display="inline">
                未ログイン
              </Typography>
            </Typography>
          </Toolbar>
        </Container>
      </AppBar>
    );
  }

  return (
    <AppBar position="relative" color="primary" elevation={1}>
      <Container>
        <Toolbar variant="dense">
          <Typography
            variant="h6"
            color="inherit"
            component="div"
            sx={{ flexGrow: 1 }}
          >
            <Zou />銀 &nbsp;
            <Typography variant="subtitle1" display="inline">
              {app.userInfo?.branchName} {app.userInfo?.accountNumber}
            </Typography>
          </Typography>
          <Button variant="text" color="inherit" onClick={handleClick}>
            <Typography>{app.userInfo?.resoniteUserId}</Typography>
            <ArrowDropDownIcon />
          </Button>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              "aria-labelledby": "basic-button",
            }}
          >
            <MenuItem
              onClick={() => {
                window.open("https://auth.resonite.love/", "_blank");
              }}
            >
              ログイン設定
            </MenuItem>
            <MenuItem
              onClick={() => {
                location.href = "/settings";
              }}
            >
              口座設定
            </MenuItem>
            <MenuItem onClick={app.logout}>ログアウト</MenuItem>
          </Menu>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default BankHeader;
