# 案①: セッションベースの取引委任システム

## 概要
Resoniteゲーム内でのUX改善のため、ワールド滞在中に限定的な取引権限をBotに委任するシステム。ユーザーは一度ブラウザで認証・許可すれば、その後はゲーム内で認証なしで一定額まで取引可能になる。

## 基本的な流れ

### 1. ブラウザでの委任設定
- ユーザーがブラウザでZouBankにログイン
- 「ワールド内取引を許可」ボタンを押す
- 以下の制限を設定：
  - 有効期限（例：2時間）
  - 取引上限金額（例：1000 Zou）
  - （オプション）特定のワールドIDでの利用制限
- システムが一時的な委任トークンを発行（6-8文字の短いコード）

### 2. ゲーム内での利用
- ユーザーが委任トークンをゲーム内に入力（手動入力しやすい短いコード）
- ゲーム内のBotがこのトークンを保持
- Botは制限内であれば認証不要で送金APIを実行可能
- 上限額または有効期限に達したら自動的に無効化

## 技術的実装案

### データベース拡張
```prisma
model DelegationToken {
  id                String   @id @default(cuid())
  token             String   @unique // 6-8文字の英数字
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  maxAmount         Decimal  // 取引上限額
  remainingAmount   Decimal  // 残り利用可能額
  expiresAt         DateTime // 有効期限
  createdAt         DateTime @default(now())
  worldId           String?  // Resoniteワールド識別子（オプション）
  isActive          Boolean  @default(true)
  
  // 利用履歴
  transactions      DelegatedTransaction[]
  
  @@index([token])
  @@index([userId])
}

model DelegatedTransaction {
  id              Int      @id @default(autoincrement())
  tokenId         String
  token           DelegationToken @relation(fields: [tokenId], references: [id])
  transactionId   Int
  transaction     Transaction @relation(fields: [transactionId], references: [id])
  createdAt       DateTime @default(now())
}
```

### 新規APIエンドポイント

#### POST /delegation/create
**認証**: セッション必須
**リクエスト**:
```json
{
  "maxAmount": 1000,
  "expiresIn": 7200,  // 秒単位（2時間）
  "worldId": "wrld_xxx"  // オプション
}
```
**レスポンス**:
```json
{
  "token": "ABC123",
  "expiresAt": "2024-04-10T12:00:00Z",
  "maxAmount": "1000.00"
}
```

#### POST /delegation/transaction
**認証**: 不要（トークンで認証）
**リクエスト**:
```json
{
  "token": "ABC123",
  "recipientId": "U-recipient",
  "amount": 100,
  "memo": "ゲーム内アイテム購入"
}
```

#### GET /delegation/status/:token
**認証**: 不要
**レスポンス**:
```json
{
  "isActive": true,
  "remainingAmount": "900.00",
  "expiresAt": "2024-04-10T12:00:00Z",
  "transactionCount": 1
}
```

#### DELETE /delegation/:token
**認証**: セッション必須（トークン作成者のみ）

### フロントエンド画面案

#### 新規ページ: /delegation
- 現在有効な委任トークン一覧
- 新規委任トークン作成フォーム
  - スライダーで金額設定
  - 有効期限選択（30分、1時間、2時間、4時間）
  - ワールドID入力（オプション）
- 各トークンの利用状況表示
  - 残り金額のプログレスバー
  - 最近の取引履歴
  - 即座に無効化ボタン

## セキュリティ考慮事項

1. **トークンの短縮化と安全性のバランス**
   - 6-8文字の英数字（大文字小文字区別なし）
   - 十分なランダム性を確保
   - ブルートフォース対策（試行回数制限）

2. **利用制限**
   - 金額上限で被害を限定
   - 短い有効期限（最大4時間）
   - 1ユーザーあたりの同時有効トークン数制限

3. **監査とモニタリング**
   - すべての委任取引をログ記録
   - 異常な利用パターンの検知
   - ユーザーへの利用通知（オプション）

4. **緊急停止機能**
   - ユーザーによる即座の無効化
   - 管理者による強制無効化

## メリット

- **UXの大幅改善**: ゲーム内で毎回ブラウザを開く必要がない
- **セキュリティ**: 完全な認証情報をゲーム内に保存しない
- **柔軟性**: ワールドごと、時間ごとに細かく制御可能
- **透明性**: 利用状況をリアルタイムで確認可能

## デメリット・課題

- **トークン管理**: ユーザーがトークンを忘れる可能性
- **複雑性増加**: システムが複雑になる
- **悪用リスク**: トークンが第三者に知られた場合のリスク

## 今後の拡張案

1. **QRコード対応**: 将来的にResoniteがQR読み取り対応した場合の準備
2. **ワールド認証**: 特定の信頼できるワールドのみで利用可能にする
3. **グループ委任**: 複数人で共有できる委任トークン
4. **自動補充**: 残額が少なくなったら自動で追加（上限あり）