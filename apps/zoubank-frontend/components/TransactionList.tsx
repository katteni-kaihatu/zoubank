import { Transaction, useApplication } from "@/contexts/Application";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from "@mui/material";
import { useApi } from "@/contexts/Api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Zou } from "@/components/Zou";

const usernameCache = new Map<
  string,
  Promise<{ data: string; updatedAt: number }>
>();
const useUsername = (userId: string) => {
  const api = useApi();
  const [username, setUserName] = useState<string>();
  useEffect(() => {
    if (userId.startsWith("U-")) {
      (async () => {
        try {
          const cachePromise = usernameCache.get(userId);
          const cached = cachePromise ? await cachePromise : undefined;

          if (cached && Date.now() - cached.updatedAt < 1000 * 60 * 60) {
            setUserName(cached.data);
            return;
          }

          const request = (async () => {
            try {
              const { username } =
                await api.getResoniteUserDataFromUserId(userId);
              return { data: username, updatedAt: Date.now() };
            } catch (e) {
              console.error(e);
              return { data: userId, updatedAt: Date.now() };
            }
          })();

          usernameCache.set(userId, request);

          setUserName((await request).data);
        } catch (e) {
          console.error(e);
        }
      })();
    }
  }, [api, userId]);

  return username ?? userId;
};

function TransactionElement(props: {
  senderUserId: string;
  transaction: Transaction;
}) {
  const app = useApplication();
  const username = useUsername(
    props.transaction.senderUserId === props.senderUserId
      ? props.transaction.recipient.resoniteUserId
      : props.transaction.sender.resoniteUserId,
  );

  return (
    <Card key={props.transaction.id}>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          {new Date(props.transaction.createdAt).toLocaleString()}
        </Typography>
        <Typography sx={{ fontSize: 14 }}>
          {props.transaction.senderUserId === app.userInfo?.id
            ? "送金"
            : "受取"}
        </Typography>
        <Typography>{username}</Typography>
        <Typography>
          {props.transaction.amount} <Zou width="18px" height="18px" />
        </Typography>
        {props.transaction.externalData !== null &&
          typeof props.transaction.externalData === "object" &&
          "memo" in props.transaction.externalData &&
          typeof props.transaction.externalData.memo === "string" && (
            <Typography>{props.transaction.externalData.memo}</Typography>
          )}
      </CardContent>
    </Card>
  );
}

export type TransactionListProps = {
  incomingTransfers: Transaction[];
  outgoingTransfers: Transaction[];
};

function TransactionList(props: TransactionListProps) {
  const app = useApplication();

  const [viewSize, setViewSize] = useState(5);

  const { incomingTransfers, outgoingTransfers } = props;
  const transactions = useMemo(
    () =>
      incomingTransfers
        .concat(outgoingTransfers)
        .sort((a, b) => {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        })
        .slice(0, viewSize),
    [incomingTransfers, outgoingTransfers, viewSize],
  );

  const addViewSize = useCallback(() => {
    setViewSize((size) => size + 5);
  }, [setViewSize]);

  return (
    <Card>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} gutterBottom>
          取引履歴
        </Typography>
        <Box display="flex" flexDirection="column" gap={2}>
          {transactions.map((transaction) => {
            return (
              <TransactionElement
                key={transaction.id}
                senderUserId={app.userInfo?.id || ""}
                transaction={transaction}
              />
            );
          })}
        </Box>
      </CardContent>
      <CardActions sx={{ flexDirection: "row-reverse" }}>
        <Button size="small" onClick={addViewSize}>
          もっと見る
        </Button>
      </CardActions>
    </Card>
  );
}

export default TransactionList;
