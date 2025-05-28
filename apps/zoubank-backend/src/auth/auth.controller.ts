import {Controller, Delete, Get, HttpCode, HttpException, Logger, Post, Req} from '@nestjs/common';
import { Request } from 'express'
import {JwtService} from "../jwt/jwt.service";
import {UserService} from "../user/user.service";


@Controller('auth')
export class AuthController {
    logger = new Logger(AuthController.name);

    constructor(private readonly userService: UserService,
                private readonly jwtService: JwtService) {}

    @Get()
    getHello(): string {
        return 'Hello World!';
    }

    @Post("/")
    async login(@Req() req: Request) {
        try {
            const authorizationHeader = req.header("Authorization")
            this.logger.log("Authorization header: " + authorizationHeader)
            const jwt = authorizationHeader?.split("Bearer ")[1]

            const result = await this.jwtService.verify(jwt)
            this.logger.log("JWT verified")
            if (result.payload.resoniteUserId) {
                const resultUserId = result.payload.resoniteUserId as string
                const user = await this.userService.upsertUserByResoniteUserId(resultUserId)
                req.session.user = user
                return user
            } else {
                new HttpException("Unauthorized", 401)
            }
        } catch (e) {
            this.logger.error("Failed to verify JWT", e)
            throw new HttpException("Unauthorized", 401)
        }
    }

    @Delete("/")
    @HttpCode(204)
    async logout(@Req() req: Request) {
        req.session.destroy((err) => {
            if(err) {
                this.logger.error("Failed to destroy session", err)
                throw new HttpException("Failed to destroy session", 500)
            }
        })
        return
    }
}

