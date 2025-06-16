# ZouBank 開発環境セットアップガイド

## 必要な環境

- Docker Desktop (Docker & Docker Compose)
- Node.js v20.12.2 (オプション: ローカル開発用)
- Git

## クイックスタート

### 1. リポジトリのクローン

```bash
git clone https://github.com/yourusername/zoubank.git
cd zoubank
```

### 2. 環境変数の設定

```bash
# ルートディレクトリに.envファイルを作成
cp .env.example .env

# 必要に応じて.envファイルを編集
# デフォルト値で開発環境は動作します
```

### 3. Docker Composeで起動

```bash
# 開発環境の起動
docker-compose -f docker-compose.dev.yml up -d

# ログを見る場合
docker-compose -f docker-compose.dev.yml logs -f

# 特定のサービスのログを見る
docker-compose -f docker-compose.dev.yml logs -f backend
```

### 4. データベースのマイグレーション

```bash
# バックエンドコンテナに入る
docker-compose -f docker-compose.dev.yml exec backend sh

# マイグレーションを実行
npx prisma migrate dev

# コンテナから出る
exit
```

### 5. アクセス

- **フロントエンド**: http://localhost:3001
- **バックエンドAPI**: http://localhost:3000
- **PostgreSQL**: localhost:5432 (ユーザー: postgres, パスワード: postgres)
- **Redis**: localhost:6379

## 開発フロー

### コードの変更

- `apps/zoubank-backend/` - バックエンドのソースコード
- `apps/zoubank-frontend/` - フロントエンドのソースコード

ファイルを編集すると、自動的にホットリロードされます。

### データベーススキーマの変更

```bash
# 1. schema.prismaを編集

# 2. マイグレーションを作成
docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate dev --name your_migration_name

# 3. Prisma Clientを再生成
docker-compose -f docker-compose.dev.yml exec backend npx prisma generate
```

### 新しいパッケージの追加

```bash
# バックエンド
docker-compose -f docker-compose.dev.yml exec backend npm install package-name
docker-compose -f docker-compose.dev.yml restart backend

# フロントエンド
docker-compose -f docker-compose.dev.yml exec frontend npm install package-name
docker-compose -f docker-compose.dev.yml restart frontend
```

## デバッグ

### バックエンドのデバッグ

1. VSCodeの場合、`.vscode/launch.json`を作成:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to Backend",
      "port": 9229,
      "restart": true,
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

2. docker-compose.dev.ymlのbackendサービスに以下を追加:

```yaml
command: npm run start:debug
ports:
  - "3000:3000"
  - "9229:9229"  # デバッグポート
```

### ログの確認

```bash
# すべてのサービスのログ
docker-compose -f docker-compose.dev.yml logs

# 特定のサービスのログ
docker-compose -f docker-compose.dev.yml logs backend

# リアルタイムでログを追跡
docker-compose -f docker-compose.dev.yml logs -f
```

## テスト実行

```bash
# バックエンドのテスト
docker-compose -f docker-compose.dev.yml exec backend npm test

# フロントエンドのテスト
docker-compose -f docker-compose.dev.yml exec frontend npm test
```

## よくある問題と解決方法

### ポートが既に使用されている

```bash
# 使用中のポートを確認
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# docker-compose.dev.ymlでポートを変更
ports:
  - "3002:3000"  # 左側の数字を変更
```

### データベース接続エラー

```bash
# データベースコンテナが正常に起動しているか確認
docker-compose -f docker-compose.dev.yml ps

# データベースを再起動
docker-compose -f docker-compose.dev.yml restart db
```

### node_modulesの問題

```bash
# コンテナを停止して削除
docker-compose -f docker-compose.dev.yml down

# ボリュームも含めて削除（データも消えるので注意）
docker-compose -f docker-compose.dev.yml down -v

# 再ビルド
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d
```

## 環境の停止・削除

```bash
# 停止
docker-compose -f docker-compose.dev.yml stop

# 停止してコンテナを削除
docker-compose -f docker-compose.dev.yml down

# ボリュームも含めて完全に削除（データベースのデータも削除される）
docker-compose -f docker-compose.dev.yml down -v
```

## 本番環境との違い

開発環境では以下の設定が異なります：

1. **ホットリロード**: ファイル変更時に自動的に再起動
2. **デバッグモード**: 詳細なエラーメッセージ
3. **CORS設定**: より緩い設定
4. **認証トークン**: デフォルトの開発用トークン

本番環境では必ず以下を変更してください：
- `SESSION_SECRET`
- `ADMIN_API_TOKEN`
- データベースの認証情報
- HTTPS/TLSの設定