# ZouBank - 詳細仕様書

## 概要

ZouBankは、仮想世界「Resonite」内で使用される仮想通貨「Zou（象）」を管理するためのWebベースの銀行システムです。ユーザーはResoniteアカウントでログインし、残高確認、送金、取引履歴の確認などの銀行業務を行うことができます。

## システムアーキテクチャ

### 技術スタック

#### バックエンド
- **フレームワーク**: NestJS v10.0.0（TypeScriptベースのNode.jsフレームワーク）
- **データベース**: PostgreSQL + Prisma ORM v5.12.1
- **セッション管理**: Express Sessions + Redis
- **認証**: JWT（jose）+ セッションベース認証
- **ランタイム**: Node.js v20.12.2（Volta管理）

#### フロントエンド
- **フレームワーク**: Next.js v14.1.4（Pages Router）
- **UIライブラリ**: Material-UI v5.15.15
- **状態管理**: React Context API
- **言語**: TypeScript v5.3
- **スタイリング**: Emotion (CSS-in-JS)

#### インフラストラクチャ
- **コンテナ化**: Docker（Dockerfile提供）
- **セッションストア**: Redis
- **モノレポ管理**: pnpm workspaces

## データベース設計

### User（ユーザー）テーブル
| フィールド | 型 | 説明 |
|---------|---|------|
| id | String (CUID) | 主キー |
| resoniteUserId | String | ResoniteユーザーID（一意制約） |
| role | UserRole | ユーザー権限（USER/BOT/ADMIN） |
| APITokenHash | String? | APIトークンのSHA-256ハッシュ |
| balance | Decimal | 口座残高（デフォルト: 0.0） |
| branchName | String | 支店名 |
| accountNumber | String | 口座番号 |

### Transaction（取引）テーブル
| フィールド | 型 | 説明 |
|---------|---|------|
| id | Int | 主キー（自動増分） |
| amount | Decimal | 取引金額 |
| createdAt | DateTime | 取引日時 |
| senderUserId | String? | 送金者ID（Userテーブルへの外部キー） |
| recipientUserId | String? | 受取人ID（Userテーブルへの外部キー） |
| externalData | Json | メモやカスタムデータを格納 |

### UserRole（ユーザー権限）
- **USER**: 一般ユーザー（残高制限あり）
- **BOT**: ボットアカウント（API経由での自動取引用）
- **ADMIN**: 管理者（無限残高、特権操作可能）

## API仕様

### 認証エンドポイント（/auth）

#### POST /auth - ログイン
**リクエスト**:
- Headers: `Authorization: Bearer {RLToken}`
- RLTokenはResonite.loveから発行されるJWTトークン

**レスポンス**:
```json
{
  "id": "user_id",
  "resoniteUserId": "U-username",
  "role": "USER",
  "balance": "1000.00",
  "branchName": "東京支店",
  "accountNumber": "1234567"
}
```

#### DELETE /auth - ログアウト
**レスポンス**: 204 No Content

### ユーザーエンドポイント（/user）

#### GET /user - 現在のユーザー情報取得
**認証**: セッション必須
**レスポンス**:
```json
{
  "id": "user_id",
  "resoniteUserId": "U-username",
  "role": "USER",
  "balance": "1000.00",
  "branchName": "東京支店",
  "accountNumber": "1234567",
  "incomingTransfers": [...],
  "outgoingTransfers": [...]
}
```

#### PUT /user - ユーザー情報更新
**認証**: セッション必須
**リクエスト**:
```json
{
  "branchName": "大阪支店",
  "accountNumber": "7654321"
}
```

#### GET /user/:userId - 特定ユーザー情報取得
**パラメータ**: 
- userId: 内部IDまたはResoniteユーザーID（U-xxx形式）

#### GET /user/:userId/balance - 残高照会
**レスポンス**: 数値（残高）

### 管理者エンドポイント（/admin）

#### POST /admin/user - ユーザー作成
**認証**: 管理者APIトークン必須
**リクエスト**:
```json
{
  "resoniteUserId": "U-newuser",
  "role": "USER",
  "branchName": "新宿支店",
  "accountNumber": "1111111"
}
```
**レスポンス**: 作成されたユーザー情報（APIトークン含む）

### 取引エンドポイント（/transaction）

#### POST /transaction - 送金
**認証**: セッションまたはAPIトークン
**リクエスト**:
```json
{
  "senderId": "sender_id",
  "recipientId": "recipient_id",
  "amount": 100,
  "memo": "お昼代",
  "customData": { "customTransactionId": "xyz123" }
}
```

**取引ルール**:
- 一般ユーザー: 残高以内の送金のみ可能
- 管理者: 無限残高（送金しても残高減らない）
- 存在しない受取人の場合、自動的にユーザー作成

### プロキシエンドポイント（/proxy）

#### GET /proxy/resonite/users/:userId
Resonite APIへのプロキシ（30分キャッシュ付き）

## 認証・セキュリティ

### 認証方式

1. **セッションベース認証**
   - Webフロントエンド用
   - Redisに保存（有効期限: 30日）
   - Cookie名: "zoubank-session"

2. **JWT認証**
   - 外部認証サーバー（auth.resonite.love）からのトークン
   - EdDSAアルゴリズムで検証
   - 初回ログイン時のみ使用

3. **APIトークン認証**
   - プログラマティックアクセス用
   - SHA-256でハッシュ化してDBに保存
   - Bearerトークン形式

### セキュリティ機能
- パスワードハッシュ化（bcrypt）
- APIトークンのハッシュ化（SHA-256）
- CORS設定（認証情報付き）
- ロールベースアクセス制御（RBAC）
- トランザクションの原子性保証

## フロントエンド仕様

### ページ構成

1. **ホーム（/）**
   - 残高表示
   - 送金フォーム
   - 取引履歴一覧

2. **ログイン（/login）**
   - Resonite.love OAuth連携
   - リダイレクト処理

3. **送金（/send）**
   - URLパラメータ対応
   - 受取人情報表示
   - バッチ送金対応

4. **設定（/settings）**
   - 支店名・口座番号変更
   - 口座番号検証（7桁）

### 主要コンポーネント

- **Header**: ナビゲーションバー、言語切替
- **BankHeader**: ユーザー情報、ドロップダウンメニュー
- **TransactionList**: 取引履歴表示（ページネーション付き）
- **Zou**: 通貨アイコン表示

### 状態管理

**Context構成**:
- ApiContext: API通信管理
- ApplicationContext: アプリケーション全体の状態
- TranslationContext: 多言語対応（日本語/英語/韓国語）

### 特徴的な機能

1. **多言語対応**: 日本語、英語、韓国語をサポート
2. **リアルタイム残高更新**: 取引後の自動更新
3. **ディープリンク**: 送金パラメータ付きURL対応
4. **キャッシング**: ユーザー名キャッシュによるパフォーマンス向上
5. **レスポンシブデザイン**: モバイル対応

## 環境変数

### バックエンド
- `SESSION_SECRET`: セッション暗号化キー
- `REDIS_URL`: Redis接続文字列
- `DATABASE_URL`: PostgreSQL接続文字列
- `APP_AUDIENCE`: JWT検証用オーディエンス
- `ADMIN_API_TOKEN`: 初期管理者APIトークン

### フロントエンド
- 環境変数不要（APIプロキシ経由で通信）

## 開発・運用

### 開発環境セットアップ
1. pnpm installでパッケージインストール
2. PostgreSQLとRedisの準備
3. Prismaマイグレーション実行
4. 環境変数設定
5. 開発サーバー起動

### ビルド・デプロイ
- Dockerコンテナでのデプロイ対応
- フロントエンド: Next.jsの静的ビルド
- バックエンド: NestJSのプロダクションビルド

### モニタリング・ログ
- NestJSの標準ログ機能
- エラーハンドリング
- トランザクションログ

## 今後の拡張可能性

1. **取引制限機能**: 日次・月次の送金上限設定
2. **通知機能**: 取引通知のWebSocket実装
3. **レポート機能**: 取引履歴のエクスポート
4. **多要素認証**: セキュリティ強化
5. **API rate limiting**: DoS攻撃対策
6. **監査ログ**: コンプライアンス対応