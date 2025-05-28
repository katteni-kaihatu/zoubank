import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import * as session from 'express-session';
import * as process from "node:process";

import 'dotenv/config'

import RedisStore from "connect-redis"
import {createClient} from "redis"

declare module 'express-session' {
    interface SessionData {
        user: any
    }
}


async function bootstrap() {
    if (!process.env.SESSION_SECRET) {
        throw new Error("SESSION_SECRET is not found.")
    }

    const app = await NestFactory.create(AppModule);
    app.enableCors({
        credentials: true,
    });

    let redisClient = createClient({
        url: process.env.REDIS_URL,
    })
    redisClient.connect().catch(console.error)

    let redisStore = new RedisStore({
        client: redisClient,
        prefix: "zoubank:",
    })

    app.use(
        session({
            name: "zoubank-session",
            store: redisStore,
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: {
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            },
        }),
    );

    await app.listen(3000);
}

bootstrap();
