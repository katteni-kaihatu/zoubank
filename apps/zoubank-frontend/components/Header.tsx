import { AppBar, Toolbar, Typography } from "@mui/material";
import { LanguageButton } from "./LanguageButton";
import { useTranslation } from "../contexts/Translation";
import { Zou } from "@/components/Zou";

export const Header = () => {
  const { language, setLanguage } = useTranslation();

  return (
    <AppBar position="static" color="inherit" elevation={1}>
      <Toolbar variant="dense">
        <Typography
          variant="h6"
          color="inherit"
          component="div"
          sx={{ flexGrow: 1 }}
        >
          <Zou />
          Bank &nbsp;
          <Typography variant="subtitle2" display="inline">
            via Resonite.Love
          </Typography>
        </Typography>
        <LanguageButton language={language} setLanguage={setLanguage} />
      </Toolbar>
    </AppBar>
  );
};
