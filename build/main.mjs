import express from 'express';
import cors from 'cors';
import { importSPKI, jwtVerify } from "jose";
import { generateUUID, getUserObj } from "./util.mjs";
import { PrismaClient } from "@prisma/client";
import { getGame, getGameWithoutCreate, getUser, getUserFromId, getUserFromResoniteId, incrementGameFailure, incrementGameSuccess, setGameState, setGameUser } from "./bank.mjs";
import { WebSocketServer } from "ws";
import http from "http";
import json2emap from "json2emap";
const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server: server });
app.use(cors());
app.use(express.json());
const getPublicKey = async () => {
    const result = await fetch("https://auth.neauth.app/api/publickey");
    const json = await result.json();
    return json.key;
};
const pubkey = await importSPKI(await getPublicKey(), "EdDSA");
console.log("pubkey is loaded.");
const authMiddleware = async (req, res, next) => {
    const auth_header = req.headers.authorization;
    console.log("auth_header", auth_header);
    if (!auth_header) {
        res.status(401).json({
            success: false,
            message: "Authorization header is not found."
        });
        return;
    }
    const token = auth_header.split(" ")[1];
    if (!token) {
        res.status(401).json({
            success: false,
            message: "Token is not found."
        });
        return;
    }
    try {
        const jwtResult = await jwtVerify(token, pubkey, {
            algorithms: ["EdDSA"]
        });
        const userObj = getUserObj(jwtResult.payload);
        const user = await getUser(prisma, userObj);
        // @ts-ignore
        req.user = user;
        next();
    }
    catch (e) {
        res.status(401).json({
            success: false,
            message: "Token is invalid."
        });
        return;
    }
};
// 🐘の残高を返却する
app.get("/v1/balance", async (req, res) => {
    const query = req.query;
    const userId = query.userId;
    console.log("GET /v1/balance userId", userId);
    if (!userId) {
        res.send("userId is not found.");
        return;
    }
    const user = await getUserFromResoniteId(prisma, userId);
    if (!user) {
        res.send("user is not found.");
        return;
    }
    res.send(user.balance.toString());
});
app.get("/v1/ranking", async (req, res) => {
    const users = await prisma.user.findMany({
        orderBy: {
            balance: "desc"
        },
        include: {
            Game: true
        }
    });
    let userResult = users.map((user) => {
        const gamerate = user.Game.map(game => {
            if ((game.zouOK + game.zouNG) === 0) {
                return 0;
            }
            return game.zouOK / (game.zouOK + game.zouNG);
        }).filter(r => r !== 0);
        const avg = gamerate
            .reduce((a, b) => a + b, 0) / gamerate.length;
        return {
            resoniteUserId: user.resoniteUserId,
            balance: user.balance,
            avg: avg
        };
    });
    if (req.query.json) {
        res.send(userResult);
    }
    else {
        res.send(json2emap(userResult));
    }
});
const wssMap = new Map();
app.get("/v1/newgame", authMiddleware, async (req, res) => {
    // @ts-ignore
    const user = req.user;
    const query = req.query;
    const gameid = query.gameid;
    console.log("gameid", gameid);
    if (!gameid) {
        res.status(400).json({
            success: false,
            message: "gameid is not found."
        });
        return;
    }
    const game = await getGameWithoutCreate(prisma, gameid);
    console.log(game);
    if (!game) {
        return res.status(400).json({
            success: false,
            message: "game is not found."
        });
    }
    const ws = wssMap.get(gameid);
    ws === null || ws === void 0 ? void 0 : ws.send("gamestart");
    await setGameUser(prisma, gameid, user.id);
});
wss.on('connection', async (ws, request) => {
    console.log("on Websocket Connection");
    const uri = request.url;
    const gameId = uri.split("/")[2];
    const game = await getGame(prisma, gameId);
    if (game.gamestate === "finished") {
        console.log("game is already finished");
        ws.close();
        return;
    }
    wssMap.set(gameId, ws);
    console.log("gameId", gameId);
    let zouList = [];
    ws.on('message', async (message) => {
        console.log('received: %s', message);
        const commands = message.toString().split(":");
        switch (commands[0]) {
            case "getBalance":
                const game = await getGame(prisma, gameId);
                console.log("getBalance", game.userId);
                if (!game.userId) {
                    ws.send("ERR:userがまだ認証されていません");
                }
                else {
                    const user = await getUserFromId(prisma, game.userId);
                    ws.send(`balance:${user === null || user === void 0 ? void 0 : user.balance}`);
                }
                break;
            case "getZou":
                const game2 = await getGame(prisma, gameId);
                if (!game2.userId) {
                    ws.send("ERR:userがまだ認証されていません");
                    return;
                }
                const newUUID = generateUUID();
                zouList.push(newUUID);
                ws.send(`zou:${newUUID}`);
                break;
            case "postZou":
                const zouId = commands[1];
                const result = commands[2];
                if (zouList.includes(zouId)) {
                    if (result === "True") {
                        await incrementGameSuccess(prisma, gameId);
                        ws.send("post:OK");
                    }
                    else if (result === "False") {
                        await incrementGameFailure(prisma, gameId);
                        ws.send("post:NG");
                    }
                    else {
                        ws.send("post:neutral");
                    }
                    // remove zouId from zouList
                    zouList = zouList.filter((zou) => zou !== zouId);
                }
                else {
                    ws.send("ERR:zouIdが見つかりません");
                }
                break;
            case "gameend":
                await setGameState(prisma, gameId, "finished");
                wssMap.delete(gameId);
                ws.close();
                break;
            default:
                break;
        }
    });
});
// @ts-ignore
app.on('upgrade', (request, socket, head) => {
    console.log("on Upgrade");
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
server.listen(3000, () => {
    console.log('server started at http://localhost:3000');
});
