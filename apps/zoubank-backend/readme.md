# ZouBank

Resonite向けのシンプルな銀行システム

## 利用技術

- NestJS (TypeScript)
- Prisma ORM
- PostgreSQL
- Redis
- Docker

## ディレクトリ構成

```
src/
  admin/         # 管理者用API
  auth/          # 認証・認可
  jwt/           # JWT関連
  prisma/        # Prismaサービス
  proxy/         # プロキシAPI
  transaction/   # 取引API
  user/          # ユーザーAPI
```

## 主なAPI/機能

- ユーザー管理（登録・情報取得・更新）
- 認証（ログイン・ログアウト、APIトークン）
- 取引（送金・残高取得）
- 管理者機能（ユーザー作成・管理）
- プロキシAPI（外部連携用）

## Userの区別

`User` 一般ユーザー  
`Bot` お金を生み出せるが、送金元は自分  
`Admin` すべてができる。他人の口座にアクセスできる。

## 起動
```bash
npm i
npx prisma migrate dev
npm run start:dev
```

```bash
# docker
docker compose up -d db redis
```

## 環境変数

DATABSE_URL=postgresql://postgres:postgres@localhost:5432/postgres  
REDIS_URL=redis://localhost:6379  
SESSION_SECRET=secret // なんでもいい  
ADMIN_API_TOKEN=token // なんでもいい ADMINユーザのAPI Token  
APP_AUDIENCE=http://localhost:3001 // デバッグのフロントエンドのURL  

## テスト

```bash
npm run test
```

## 補足

- Prismaスキーマは `prisma/schema.prisma` を参照
- マイグレーションは `npx prisma migrate dev` で適用
- 開発用DB/RedisはDockerで起動可能
