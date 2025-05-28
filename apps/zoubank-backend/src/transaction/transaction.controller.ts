import {Controller, Post, Session, Headers, Body, HttpException, Logger} from '@nestjs/common';
import {UserService} from "../user/user.service";
import {SessionData} from "express-session";
import {Prisma, User} from "@prisma/client";
import {TransactionService} from "./transaction.service";
import * as crypto from "node:crypto";

import * as process from "node:process";

@Controller('transaction')
export class TransactionController {
    logger = new Logger(this.constructor.name);

    constructor(private readonly userService: UserService,
                private readonly transactionService: TransactionService) {
    }

    @Post("/")
    async createTransaction(@Session() session: SessionData,
                            @Headers("Authorization") authHeader: string,
                            @Body() data: any) {
        // TODO: サービスに移動するべき
        // セッションを持っているか、APIトークンを持っているかを確認
        const APIToken = authHeader?.split("Bearer ")[1]
        if (!APIToken && !session.user?.id) {
            this.logger.error("API Token or Session is required")
            throw new HttpException("Unauthorized", 401)
        }
        const sessionUser: User = session.user

        const apiTokenHash = !APIToken ? "" :crypto.createHash('sha256').update(APIToken).digest('hex');
        const apiUser = !APIToken ? null : await this.userService.findUserByAPITokenHash(apiTokenHash)

        // どちらかのユーザーが存在しない場合はエラー
        if (!sessionUser && !apiUser) {
            this.logger.error("User not found")
            throw new HttpException("Unauthorized", 401)
        }

        const user = sessionUser || apiUser

        const fromUserId = data.senderId ?? apiUser?.id
        const toUserId = data.recipientId
        const amount = new Prisma.Decimal(data.amount)

        if (!fromUserId || !toUserId || !amount) {
            throw new HttpException("Bad Request", 400)
        }

        // マイナスの金額は送金できない
        if (amount.lessThan(new Prisma.Decimal(0))) {
            throw new HttpException("Bad Request", 400)
        }



        // ADMINユーザー以外は自分のアカウントからの送金のみ可能
        if (user.role !== "ADMIN" && user.id !== fromUserId) {
            throw new HttpException("Bad Request", 400)
        }

        // User取得
        const fromUser = await this.userService.getUserByUnknownId(fromUserId)
        let toUser = await this.userService.getUserByUnknownId(toUserId)

        // 送金元と送金先が同じユーザーの場合はエラー
        if (fromUser.id === toUser.id) {
            throw new HttpException("Bad Request", 400)
        }

        // もしtoUserがいなかったら、作成する
        if(!toUser.id) {
            this.logger.log("User not found, creating new user")
            toUser = await this.userService.createUser({
                resoniteUserId: toUserId
            })
        }


        // 送金元の残高が足りない場合はエラー
        if (fromUser.role === "USER" && fromUser.balance.lessThan(amount)) {
            throw new HttpException("Not Enough Balance", 400)
        }

        const externalData = {
            memo: data.memo ?? "",
            customData: data.customData ?? {}
        }

        const result = await this.transactionService.createTransaction(fromUser, toUser, amount, externalData)
        if(!result) {
            throw new HttpException("Failed to create transaction", 500)
        }

        return {message: "Transaction completed"}
    }
}
