import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  CssBaseline,
  TextField,
} from "@mui/material";
import { Header } from "@/components/Header";
import BankHeader from "@/components/BankHeader";
import { useApplication } from "@/contexts/Application";
import { useEffect, useState } from "react";
import { useApi } from "@/contexts/Api";

function SettingsPage() {
  const app = useApplication();
  const api = useApi();

  const [branchName, setBranchName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");

  useEffect(() => {
    if (app.appReady && !app.loggedIn) {
      location.href = "/login";
    }

    if (app.appReady) {
      console.log(app.userInfo);
      setBranchName(app.userInfo?.branchName ?? "");
      setAccountNumber(app.userInfo?.accountNumber ?? "");
    }
  }, [app]);

  const handleSave = async () => {
    if (
      branchName.length === 0 ||
      accountNumber.length !== 7 ||
      isNaN(Number(accountNumber))
    ) {
      return;
    }

    // save
    await api.updateUserInfo({
      accountNumber: accountNumber,
      branchName: branchName,
    });

    app.reloadUserInfo();
  };

  return (
    <Box>
      <CssBaseline />
      <Header />
      <BankHeader />
      <Container sx={{ paddingTop: 2, height: "100%" }} maxWidth="md">
        <Button size="large" variant="outlined" href="/">
          {"< 戻る"}
        </Button>
      </Container>
      <Container sx={{ paddingTop: 2, height: "100%" }} maxWidth="sm">
        <Card>
          <CardHeader title="口座設定" />
          <CardContent>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="支店名"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                fullWidth
                error={branchName.length === 0}
                helperText={
                  branchName.length === 0 ? "支店名を入力してください" : ""
                }
                disabled={!app.appReady}
              />
              <TextField
                label="口座番号"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                fullWidth
                error={
                  accountNumber.length !== 7 || isNaN(Number(accountNumber))
                }
                helperText={
                  accountNumber.length !== 7 || isNaN(Number(accountNumber))
                    ? "口座番号は7桁の数字で入力してください"
                    : ""
                }
                disabled={!app.appReady}
              />
            </Box>
          </CardContent>
          <CardActions>
            <Button
              variant="contained"
              sx={{ marginLeft: "auto" }}
              onClick={handleSave}
            >
              保存
            </Button>
          </CardActions>
        </Card>
      </Container>
    </Box>
  );
}

export default SettingsPage;
