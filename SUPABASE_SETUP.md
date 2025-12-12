# Supabase セットアップガイド

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) にアクセスしてログイン
2. 「New Project」をクリック
3. プロジェト名、データベースパスワード、リージョンを設定
4. プロジェクトが作成されるまで待機（2-3分）

## 2. データベーススキーマの実行

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `database-setup.sql` の内容をコピー
3. SQL Editorに貼り付けて「Run」を実行
4. テーブル、トリガー、RLSポリシーが作成されます

## 3. 環境変数の設定

1. Supabaseダッシュボードで「Settings」→「API」を開く
2. 以下の情報をコピー：
   - Project URL
   - anon public key
3. プロジェクトの `.env` ファイルに設定：

```env
VITE_SUPABASE_URL=<Your Project URL>
VITE_SUPABASE_ANON_KEY=<Your anon public key>
```

## 4. CORS設定

1. Supabaseダッシュボードで「Settings」→「API」を開く
2. 「CORS Configuration」セクションを探す
3. 許可するオリジンを追加：
   - 開発環境: `http://localhost:5173`
   - 本番環境: `https://your-domain.com`

## 5. 認証ユーザーの作成とusersテーブルへの同期

### 5.1 認証ユーザーの作成

1. Supabaseダッシュボードで「Authentication」→「Users」を開く
2. 「Add user」→「Create new user」をクリック
3. メールアドレスとパスワードを入力：
   - Email: `admin@demo.com`
   - Password: `DemoPass2025!`
   - Auto Confirm User: **チェックを入れる**
4. 「Create user」をクリック
5. **作成されたユーザーのUIDをコピー**（例: `473a1fb0-89fa-4388-8384-4957ac935e9c`）

### 5.2 usersテーブルへの登録

1. 「SQL Editor」を開く
2. 以下のSQLを実行（`<AUTH_UID>`を上記でコピーしたUIDに置き換え）：

```sql
-- 管理者ユーザーを登録
INSERT INTO users (id, email, name, role, store_id) VALUES
('<AUTH_UID>', 'admin@demo.com', '管理者', 'admin', '550e8400-e29b-41d4-a716-446655440001');
```

実際の例：
```sql
INSERT INTO users (id, email, name, role, store_id) VALUES
('473a1fb0-89fa-4388-8384-4957ac935e9c', 'admin@demo.com', '管理者', 'admin', '550e8400-e29b-41d4-a716-446655440001');
```

### 5.3 追加ユーザーの作成（オプション）

店長やスタッフも同様の手順で作成：

```sql
-- 店長ユーザー（本店）
INSERT INTO users (id, email, name, role, store_id) VALUES
('<MANAGER_AUTH_UID>', 'manager@demo.com', '店長 花子', 'manager', '550e8400-e29b-41d4-a716-446655440001');

-- スタッフユーザー（本店）
INSERT INTO users (id, email, name, role, store_id) VALUES
('<STAFF_AUTH_UID>', 'staff@demo.com', 'スタッフ 一郎', 'staff', '550e8400-e29b-41d4-a716-446655440001');
```

## 6. RLS（Row Level Security）の確認

セキュリティポリシーが正しく適用されているか確認：

1. 「Database」→「Tables」で各テーブルを確認
2. RLSが有効（緑色のアイコン）になっていることを確認
3. テスト環境で問題が発生する場合は、一時的にRLSを無効化：

```sql
-- テスト用にRLSを一時的に無効化（本番環境では非推奨）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventories DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

## 7. アプリケーションの起動とログイン

1. 開発サーバーを起動：
```bash
npm run dev
```

2. ブラウザで `http://localhost:5173` を開く

3. ログイン情報：
   - Email: `admin@demo.com`
   - Password: `DemoPass2025!`

## トラブルシューティング

### ログインできない場合

1. Supabase Authでユーザーが作成されているか確認
2. usersテーブルにレコードが存在するか確認：
```sql
SELECT * FROM users WHERE email = 'admin@demo.com';
```

3. UIDが一致しているか確認：
```sql
SELECT id FROM users WHERE email = 'admin@demo.com';
-- これがSupabase Authで作成したユーザーのUIDと一致する必要があります
```

### プロファイル取得エラーの場合

```sql
-- 既存のレコードを削除して再作成
DELETE FROM users WHERE email = 'admin@demo.com';

INSERT INTO users (id, email, name, role, store_id) VALUES
('<正しいAUTH_UID>', 'admin@demo.com', '管理者', 'admin', '550e8400-e29b-41d4-a716-446655440001');
```

### CORSエラーの場合

1. Supabaseの「Settings」→「API」→「CORS Configuration」を確認
2. 開発環境のURL（`http://localhost:5173`）が許可リストに追加されているか確認
3. ブラウザのキャッシュをクリア（Ctrl+Shift+Delete）
4. ハードリロード（Ctrl+Shift+R）

## 本番環境へのデプロイ

1. `.env` ファイルを本番環境用に更新
2. Supabase CORSに本番ドメインを追加
3. RLSポリシーが有効になっていることを確認
4. 本番用の認証ユーザーを作成
5. 環境変数を本番環境に設定

## セキュリティのベストプラクティス

- ✅ RLSを常に有効にする
- ✅ anon keyは公開しても安全（読み取り専用）
- ❌ service_role keyは絶対に公開しない
- ✅ 本番環境では強力なパスワードを使用
- ✅ 定期的にSupabaseのセキュリティアップデートを確認
