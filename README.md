# 在庫管理システム

React + TypeScript + Vite + Supabase で構築された多店舗対応の在庫管理システムです。

## 🚀 主な機能

### 1. ログイン機能
- セキュアな認証システム
- ロールベースのアクセス制御（管理者、店長、スタッフ）
- 自動ログイン機能
- セッション管理

### 2. 商品バーコードスキャン機能
- スマートフォンカメラを使用したバーコード/QRコード読み取り
- 対応形式: EAN-13, EAN-8, UPC-A, CODE-128, QRコード
- 手動入力も対応
- 商品情報の自動入力
- スキャン履歴機能

### 3. 発注書の自動生成機能
- 在庫数が閾値を下回った商品の自動検出
- 発注候補リストの自動生成
- 発注数量の自動計算
- PDF形式での発注書出力
- 発注履歴の管理

### 4. 多店舗対応
- 店舗ごとの在庫管理
- 店舗切り替え機能
- 店舗別のデータ分離
- 管理者による店舗追加機能

### 5. その他の機能
- リアルタイム在庫監視
- 在庫不足アラート
- 商品カテゴリ管理
- 供給元管理
- チャット機能
- 分析・レポート機能

## 🛠️ 技術スタック

- **フロントエンド**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, Lucide React
- **バックエンド**: Supabase (PostgreSQL, Auth, Realtime)
- **状態管理**: React Context API
- **フォーム**: React Hook Form
- **通知**: React Hot Toast
- **バーコードスキャン**: html5-qrcode
- **PDF生成**: jsPDF

## 📦 インストール

1. リポジトリをクローン
```bash
git clone <repository-url>
cd project
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定
```bash
cp env.example .env
```

`.env`ファイルを編集してSupabaseの設定を追加：
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. 開発サーバーを起動
```bash
npm run dev
```

## 🗄️ データベース設定

Supabaseで以下のテーブルを作成してください：

### ユーザー関連
- `users` - ユーザー情報
- `stores` - 店舗情報
- `sessions` - セッション管理

### 商品・在庫関連
- `products` - 商品情報
- `inventories` - 在庫情報
- `suppliers` - 供給元情報

### 発注関連
- `orders` - 発注書
- `order_items` - 発注商品

### その他
- `chat_messages` - チャットメッセージ

## 🔐 認証設定

Supabaseの認証設定で以下を有効化：
- Email認証
- セッション管理
- ロールベースアクセス制御

## 📱 使用方法

### ログイン
デモアカウント：
- 管理者: admin@demo.com / password
- 店長: manager@demo.com / password
- スタッフ: staff@demo.com / password

### バーコードスキャン
1. 在庫管理ページで「スキャン」ボタンをクリック
2. カメラにバーコードを向ける
3. 自動で商品情報が読み込まれる

### 自動発注
1. 発注管理ページで「自動発注」ボタンをクリック
2. 在庫不足商品が自動でリストアップされる
3. 発注数量を調整して発注書を作成

### 店舗切り替え
1. ヘッダーの店舗セレクターをクリック
2. 切り替えたい店舗を選択
3. 店舗別のデータが表示される

## 🚀 デプロイ

### Vercel
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
# distフォルダをNetlifyにアップロード
```

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

プルリクエストやイシューの報告を歓迎します。

## 📞 サポート

質問や問題がある場合は、GitHubのイシューで報告してください。

