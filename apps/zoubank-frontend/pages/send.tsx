import { Header } from "@/components/Header";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  CssBaseline,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import BankHeader from "@/components/BankHeader";
import { useApplication } from "@/contexts/Application";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Zou } from "@/components/Zou";
import { useRouter } from "next/router";
import {} from "@mui/icons-material";
import { ResoniteUser, useResoniteUser } from "@/lib/hooks";
import { resdb2url } from "@/lib/util";

type LocalTransactionLog = {
  status: "success" | "error";
  amount: number;
};

const LocalTransactionLogView = (props: { log: LocalTransactionLog }) => {
  switch (props.log.status) {
    case "success":
      return (
        <Alert severity="success">
          {props.log.amount} <Zou /> を送金しました
        </Alert>
      );
    case "error":
      return (
        <Alert severity="error">
          {props.log.amount} <Zou />
          の送金に失敗しました
        </Alert>
      );
  }
};

const SendCard = (props: {
  user: ResoniteUser;
  amount: number;
  memo?: string;
  customTransactionId?: string;
}) => {
  const app = useApplication();
  const [amount, setAmount] = useState<number>(props.amount);
  const [memo, setMemo] = useState<string | undefined>(props.memo);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LocalTransactionLog[]>([]);

  const iconUrl = resdb2url(props.user.profile?.iconUrl ?? "").data;
  const username = props.user.username;

  const errorText = useMemo(() => {
    if (amount > parseInt(app.userInfo?.balance ?? "0")) {
      return "残高を超えています";
    }
    return null;
  }, [amount, app.userInfo?.balance]);

  const amountTextFieldOnChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = parseInt(e.target.value);
      if (!isNaN(value) && value > 0) {
        setAmount(value);
      }
    },
    [setAmount],
  );
  const memoTextFieldOnChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setMemo(e.target.value);
    },
    [setMemo],
  );

  const sendTransaction = useCallback(async () => {
    if (loading) return;
    try {
      setLoading(true);
      const pack = props.customTransactionId ? { customTransactionId: props.customTransactionId }: {};
      const result = await app.sendTransaction(props.user.id, amount, memo, pack);
      if (!result) {
        throw new Error("failed to send transaction");
      }
      const startTime = Date.now();
      setLogs((logs) => [{ status: "success", amount }, ...logs]);
      await (() =>
        new Promise((resolve) =>
          setTimeout(resolve, Math.max(0, 1000 - (Date.now() - startTime))),
        ))();
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setLogs((logs) => [{ status: "error", amount }, ...logs]);
    }
  }, [loading, app, props.user.id, amount, setLoading, setLogs, memo]);

  return (
    <Card>
      <CardHeader title="送金" />
      <CardContent>
        <Box display="flex" flexDirection="column" gap={1}>
          <Avatar
            sx={{ width: 78, height: 78, alignSelf: "center" }}
            src={iconUrl}
          />
          <Typography sx={{ fontSize: 32, textAlign: "center" }} gutterBottom>
            {`${username} さんに送る`}
          </Typography>
          <TextField
            label="金額"
            type="number"
            value={amount}
            onChange={amountTextFieldOnChange}
            error={errorText !== null}
            helperText={errorText}
          />
          <TextField
            label="メモ"
            type="text"
            value={memo}
            onChange={memoTextFieldOnChange}
          />
          <Button
            variant="contained"
            fullWidth
            sx={{ height: 64 }}
            onClick={sendTransaction}
            disabled={loading || errorText !== null}
          >
            {loading ? <CircularProgress color="primary" /> : "送金する"}
          </Button>
          {logs.map((log, i) => (
            <LocalTransactionLogView key={i} log={log} />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

function SendPage() {
  const app = useApplication();

  useEffect(() => {
    if (app.appReady && !app.loggedIn) {
      // save path and query for after login
      localStorage.setItem("redirectPath", location.pathname + location.search);
      location.href = "/login";
    }
  }, [app]);
  const router = useRouter();

  const { sendTo: rawSendTo, amount: rawAmount, memo: RawMemo, customTransactionId: RawCTId } = router.query;

  const resoniteUser = useResoniteUser(
    typeof rawSendTo === "string" ? rawSendTo : "",
  );
  const amount =
    typeof rawAmount === "string" &&
    !isNaN(parseInt(rawAmount)) &&
    parseInt(rawAmount) > 0
      ? parseInt(rawAmount)
      : 1;
  const memo = typeof RawMemo === "string" ? RawMemo : undefined;
  const customTransactionId = typeof RawCTId === "string" ? RawCTId : undefined;

  return (
    <Box>
      <CssBaseline />
      <Header />
      <BankHeader />
      <Container sx={{ paddingTop: 2, height: "100%" }} maxWidth="md">
        <Grid
          item
          xs={12}
          md={8}
          display="flex"
          alignSelf="center"
          flexDirection="column"
          gap={1}
        >
          {app.appReady &&
            app.loggedIn &&
            app.userInfo &&
            resoniteUser.status === "success" && (
              <>
                <Card>
                  <CardContent>
                    <Typography sx={{ fontSize: 14 }} gutterBottom>
                      {app.userInfo.branchName} {app.userInfo.accountNumber}
                    </Typography>
                    <Typography sx={{ fontSize: 36, textAlign: "right" }}>
                      {app.userInfo.balance} <Zou height="40px" width="40px" />
                    </Typography>
                  </CardContent>
                </Card>

                <SendCard
                  user={resoniteUser.data}
                  amount={amount}
                  memo={memo}
                  customTransactionId={customTransactionId}
                />
              </>
            )}
          {resoniteUser.status === "loading" ||
            (!app.loggedIn && <Alert severity="info">読み込み中</Alert>)}
          {resoniteUser.status === "error" && (
            <>
              <Alert severity="error">
                「{rawSendTo}」をIDに持つユーザーは見つかりませんでした。
              </Alert>
            </>
          )}
        </Grid>
      </Container>
    </Box>
  );
}

export default SendPage;
