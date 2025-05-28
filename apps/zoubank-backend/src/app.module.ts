import {Module} from '@nestjs/common';
import {JwtService} from './jwt/jwt.service';
import {AuthService} from './auth/auth.service';
import {UserService} from './user/user.service';
import {PrismaService} from './prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';

import {AuthController} from './auth/auth.controller';
import {UserController} from './user/user.controller';
import { AdminController } from './admin/admin.controller';
import { TransactionController } from './transaction/transaction.controller';
import { TransactionService } from './transaction/transaction.service';
import { ProxyController } from './proxy/proxy.controller';
import { ProxyService } from './proxy/proxy.service';

@Module({
    imports: [ConfigModule.forRoot()],
    controllers: [UserController, AuthController, AdminController, TransactionController, ProxyController],
    providers: [PrismaService, AuthService, JwtService, UserService, TransactionService, ProxyService],
})
export class AppModule {
}
