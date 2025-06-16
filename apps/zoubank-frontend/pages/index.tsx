import { Header } from "@/components/Header";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  CssBaseline,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import BankHeader from "@/components/BankHeader";
import { useApplication } from "@/contexts/Application";
import { useEffect, useState, useCallback, useRef } from "react";
import TransactionList from "@/components/TransactionList";
import { Zou } from "@/components/Zou";
import { useApi } from "@/contexts/Api";

interface UserOption {
  id: string;
  resoniteUserId: string;
  accountNumber: string;
  branchName: string;
}

function IndexPage() {
  const app = useApplication();
  const api = useApi();

  useEffect(() => {
    console.log(app.appReady, app.loggedIn);
    if (app.appReady && !app.loggedIn) {
      location.href = "/login";
    }
  }, [app]);

  const [sendTo, setSendTo] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [memo, setMemo] = useState<string>();
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const searchUsers = useCallback(
    async (query: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(async () => {
        if (query.length < 2) {
          setUserOptions([]);
          return;
        }
        setIsSearching(true);
        try {
          const results = await api.searchUsers(query);
          setUserOptions(results || []);
        } catch (error) {
          console.error("Failed to search users:", error);
          setUserOptions([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    },
    [api]
  );

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  if (!app.appReady || !app.loggedIn) return <></>;

  return (
    <Box>
      <CssBaseline />
      <Header />
      <BankHeader />
      <Container sx={{ paddingTop: 2, height: "100%" }} maxWidth="md">
        <Grid container spacing={1}>
          <Grid
            item
            xs={12}
            md={8}
            display="flex"
            flexDirection="column"
            gap={1}
          >
            <Card>
              <CardContent>
                <Typography sx={{ fontSize: 14 }} gutterBottom>
                  {app.userInfo?.branchName} {app.userInfo?.accountNumber}
                </Typography>
                <Typography sx={{ fontSize: 36, textAlign: "right" }}>
                  {app.userInfo?.balance} <Zou height="40px" width="40px" />
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="送金" />
              <CardContent>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Autocomplete
                    value={sendTo}
                    onChange={(event, newValue) => {
                      setSendTo(newValue || "");
                    }}
                    inputValue={sendTo}
                    onInputChange={(event, newInputValue, reason) => {
                      if (reason === "input") {
                        setSendTo(newInputValue);
                        searchUsers(newInputValue);
                      }
                    }}
                    options={userOptions.map((user) => user.resoniteUserId)}
                    loading={isSearching}
                    loadingText="検索中..."
                    noOptionsText="ユーザーが見つかりません"
                    renderOption={(props, option) => {
                      const user = userOptions.find((u) => u.resoniteUserId === option);
                      return (
                        <li {...props}>
                          <Box>
                            <Typography variant="body1">{option}</Typography>
                            {user && (
                              <Typography variant="caption" color="text.secondary">
                                {user.branchName} {user.accountNumber}
                              </Typography>
                            )}
                          </Box>
                        </li>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="送金先 (ユーザー名 または UserID)"
                        size="small"
                        fullWidth
                        helperText="ユーザー名の一部または口座番号で検索できます"
                      />
                    )}
                    freeSolo
                  />
                  <TextField
                    label="金額"
                    fullWidth
                    size="small"
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value))}
                    error={amount > parseInt(app.userInfo?.balance || "0")}
                    type="number"
                    helperText={
                      amount > parseInt(app.userInfo?.balance || "0")
                        ? "残高を超えています"
                        : ""
                    }
                  />
                  <TextField
                    label="メモ"
                    fullWidth
                    size="small"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    type="text"
                  />
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => {
                      app.sendTransaction(sendTo, amount, memo);
                    }}
                  >
                    送金する
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <TransactionList
              incomingTransfers={app.userInfo?.incomingTransfers || []}
              outgoingTransfers={app.userInfo?.outgoingTransfers || []}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default IndexPage;
