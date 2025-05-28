import {Injectable} from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service";
import {Prisma, User} from "@prisma/client";

@Injectable()
export class TransactionService {
    constructor(private readonly prismaService: PrismaService) {
    }


    async createTransaction(fromUser: Pick<User, "id" | "role">,
                      toUser: Pick<User, "id" | "role">,
                      amount: Prisma.Decimal,
                      externalData: any
    ) {
        // トランザクションで処理する

        if(fromUser.role === "USER") {
            return this.prismaService.$transaction([
                this.prismaService.user.update({
                    where: {id: fromUser.id},
                    data: {balance: {decrement: amount}}
                }),
                this.prismaService.user.update({
                    where: {id: toUser.id},
                    data: {balance: {increment: amount}}
                }),
                this.prismaService.transaction.create({
                    data: {
                        amount: amount,
                        sender: {connect: {id: fromUser.id}},
                        recipient: {connect: {id: toUser.id}},
                        externalData: externalData
                    }
                })
            ])
        } else {
            return this.prismaService.$transaction([
                this.prismaService.user.update({
                    where: {id: toUser.id},
                    data: {balance: {increment: amount}}
                }),
                this.prismaService.transaction.create({
                    data: {
                        amount: amount,
                        sender: {connect: {id: fromUser.id}},
                        recipient: {connect: {id: toUser.id}},
                        externalData: externalData
                    }
                })
            ])
        }
    }
}
