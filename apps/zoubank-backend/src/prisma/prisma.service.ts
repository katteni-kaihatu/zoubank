import {
    INestApplication,
    Injectable,
    Logger,
    OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    isConnected = false;

    logger = new Logger(PrismaService.name);
    async onModuleInit() {
        try {
            await this.$connect();
            this.isConnected = true;
            this.logger.log('connected to database');
        } catch (error) {
            this.logger.error('failed to connect to database');

            // retry
            setTimeout(async () => {
                this.logger.log('retrying to connect to database');
                await this.onModuleInit();
            }, 5000);
        }
    }

    async enableShutdownHooks(app: INestApplication) {
        process.on('beforeExit', async () => {
            await app.close();
        });
    }
}