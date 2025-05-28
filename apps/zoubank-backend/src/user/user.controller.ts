import {Body, Controller, Get, HttpException, Logger, Param, Put, Session} from '@nestjs/common';
import {UserService} from "./user.service";
import {User} from "@prisma/client";

@Controller('user')
export class UserController {
    logger = new Logger(this.constructor.name);

    constructor(private userService: UserService) {
    }

    @Get("/")
    getUserInfo(@Session() session: Record<string, any>) {
        if (!session.user?.id) {
            throw new HttpException("Unauthorized", 401)
        }

        return this.userService.getUserById(session.user.id)
    }

    @Put("/")
    updateUser(@Session() session: Record<string, any>, @Body() data: Pick<User, "accountNumber" | "branchName">) {
        if (!session.user?.id) {
            throw new HttpException("Unauthorized", 401)
        }

        return this.userService.updateUser(session.user.id, data)
    }

    @Get("/:userId/balance")
    async getBalance(@Param("userId") userId: string) {
        let user = null
        if(userId.startsWith("U-")) {
            user = await this.userService.getUserByResoniteUserId(userId)

        } else {
            user = await this.userService.getUserById(userId)
        }

        if (!user.id) {
            // ユーザを作る
            if(userId.startsWith("U-")) {
                user = await this.userService.createUser({resoniteUserId: userId})
            } else {
                // 404
                throw new HttpException("User not found", 404)
            }
        }
        return Number(user.balance)
    }

    // ユーザー情報を取得するエンドポイント
    // resoniteUserId または id でユーザー情報を取得する
    @Get("/:userId")
    async getUserInfoById(@Param("userId") userId: string) {
        let user = null
        if(userId.startsWith("U-")) {
            user = await this.userService.getUserByResoniteUserId(userId)

        } else {
            user = await this.userService.getUserById(userId)
        }

        if (!user.id) {
            // ユーザを作る
            if(userId.startsWith("U-")) {
                user = await this.userService.createUser({resoniteUserId: userId})
            } else {
                // 404
                throw new HttpException("User not found", 404)
            }
        }
        return user
    }
}
