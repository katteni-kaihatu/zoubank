import {Injectable, Logger} from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service";
import {User} from "@prisma/client";

import * as crypto from "node:crypto";
import * as process from "node:process";

function exclude<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const clone = {...obj}
    keys.forEach(key => {
        delete clone[key]
    })
    return clone
}

@Injectable()
export class UserService {
    logger = new Logger(this.constructor.name)

    constructor(private prismaService: PrismaService) {
        this.logger.log("UserService initialized")

        this.prismaService.user.findUnique({
            where: {
                id: "ADMIN"
            }
        }).then(async admin => {
            if(!process.env.ADMIN_API_TOKEN) {
                this.logger.error("ADMIN_API_TOKEN is not set")
                return
            }
            if (!admin) {
                const AdminAPIToken = process.env.ADMIN_API_TOKEN
                const AdminAPITokenHash = crypto.createHash('sha256').update(AdminAPIToken).digest('hex');
                await this.prismaService.user.create({
                    data: {
                        id: "ADMIN",
                        resoniteUserId: "ADMIN",
                        accountNumber: "00000000",
                        APITokenHash: AdminAPITokenHash,
                        branchName: "本店",
                        role: "ADMIN",
                        balance: 0,
                    }
                })
                this.logger.log("Admin user created Token: ", AdminAPIToken)
            } else {
                this.logger.log("Admin user already exists")
            }
        })
    }

    async getUserById(id: User["resoniteUserId"]) {
        const user = await this.prismaService.user.findUnique({
            where: {id: id},
            include: {
                incomingTransfers: {
                    include: {
                        sender: true,
                        recipient: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                outgoingTransfers: {
                    include: {
                        sender: true,
                        recipient: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        })
        return exclude(user, ["APITokenHash"])
    }

    async getUserByResoniteUserId(resoniteUserId: User["resoniteUserId"]) {
        const user = await this.prismaService.user.findUnique({
            where: {resoniteUserId: resoniteUserId},
            include: {
                incomingTransfers: {
                    include: {
                        sender: true,
                        recipient: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                outgoingTransfers: {
                    include: {
                        sender: true,
                        recipient: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            },
        })
        return exclude(user, ["APITokenHash"])
    }

    async getUserByUnknownId(id: string) {
        if(id.startsWith("U-")) {
            return this.getUserByResoniteUserId(id)
        } else {
            return this.getUserById(id)
        }
    }

    async createUser(data: Pick<User, "resoniteUserId">) {
        const newUser = await this.prismaService.user.create({
            data: {
                resoniteUserId: data.resoniteUserId,
                // 7桁のランダムな数字を文字列に変換してアカウント番号として設定
                accountNumber: Math.floor(1000000 + Math.random() * 9000000).toString(),
                branchName: "本店",
                role: "USER",
                balance: 0,
            },
            include: {
                incomingTransfers: {
                    include: {
                        sender: true,
                        recipient: true
                    }
                },
                outgoingTransfers: {
                    include: {
                        sender: true,
                        recipient: true
                    }

                }
            }
        })
        return exclude(newUser, ["APITokenHash"])
    }

    async upsertUserByResoniteUserId(resoniteUserId: User["resoniteUserId"]) {
        // 既にユーザーが存在する場合は返す、存在しない場合は新規作成
        const user = await this.prismaService.user.upsert({
            where: {resoniteUserId: resoniteUserId},
            update: {},
            create: {
                resoniteUserId: resoniteUserId,
                accountNumber: Math.floor(1000000 + Math.random() * 9000000).toString(),
                branchName: "本店",
                role: "USER",
                balance: 0,
            }
        })
        return exclude(user, ["APITokenHash"])
    }

    async updateUser(id: User["resoniteUserId"], data: Partial<User>) {
        const user = await this.prismaService.user.update({
            where: {id: id},
            data: data
        })
        return exclude(user, ["APITokenHash"])
    }

    // for Admin
    findUserByAPITokenHash(APITokenHash: string) {
        return this.prismaService.user.findFirst({
            where: {APITokenHash: APITokenHash}
        });
    }

    createUserAdmin(data: Partial<User> & Pick<User, "resoniteUserId" | "branchName" | "accountNumber">) {
        return this.prismaService.user.create({
            data: data
        })
    }
}
