# Supabase マイグレーション手順（売上管理システム）

## 実行方法

### 【方法1】Supabase Dashboard（Web UI）

1. **Supabaseにログイン**
   - https://supabase.com/dashboard にアクセス
   - プロジェクト「Orderly」を選択

2. **SQL Editorを開く**
   - 左メニュー「SQL Editor」をクリック
   - 「+ New query」ボタンをクリック

3. **SQLを貼り付け**
   - `database-schema-sales.sql` の内容を全てコピー
   - エディタに貼り付け

4. **実行**
   - 右下の「Run」ボタンをクリック
   - ✅ Success! と表示されれば完了

5. **確認**
   - 左メニュー「Table Editor」をクリック
   - `menus`, `recipes`, `sales`, `sales_details` が表示されることを確認

---

### 【方法2】Supabase CLI（ローカル）

```powershell
# 1. Supabase CLIインストール（初回のみ）
npm install -g supabase

# 2. プロジェクトにログイン
supabase login

# 3. プロジェクトIDを確認
# Dashboard → Settings → General → Project ID をコピー

# 4. マイグレーション実行
supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"

# または、SQLファイルを直接実行
supabase db execute --file database-schema-sales.sql
```

---

### 【方法3】VS Code拡張機能（PostgreSQL）

1. **拡張機能インストール**
   - VS Code Extensions で「PostgreSQL」を検索
   - Chris Kolkman氏の「PostgreSQL」をインストール

2. **接続設定**
   - Supabase Dashboard → Settings → Database
   - Connection String をコピー
   - VS Code で F1 → "PostgreSQL: Add Connection"

3. **SQL実行**
   - `database-schema-sales.sql` を開く
   - 右クリック → "Run Query"

---

## 実行後の確認クエリ

```sql
-- 全テーブル一覧
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('menus', 'recipes', 'sales', 'sales_details');

-- menusテーブル構造確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'menus'
ORDER BY ordinal_position;

-- 既存データ件数確認
SELECT 
  (SELECT COUNT(*) FROM menus) AS menus_count,
  (SELECT COUNT(*) FROM recipes) AS recipes_count,
  (SELECT COUNT(*) FROM sales) AS sales_count,
  (SELECT COUNT(*) FROM sales_details) AS sales_details_count;
```

---

## サンプルデータ投入（テスト用）

マイグレーション成功後、以下のサンプルデータを投入すると動作確認が簡単になります:

```sql
-- 1. メニューサンプル（仮のstore_id使用）
INSERT INTO menus (store_id, name, price, category) VALUES
  ('00000000-0000-0000-0000-000000000001', 'ポテトサラダ', 500, '前菜'),
  ('00000000-0000-0000-0000-000000000001', '生ビール（中）', 600, 'ドリンク'),
  ('00000000-0000-0000-0000-000000000001', 'ハンバーグステーキ', 1200, 'メイン');

-- 2. レシピサンプル（仮のproduct_id使用）
-- ※ 実際のproducts.idを確認してから実行してください
INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id) VALUES
  (
    (SELECT id FROM menus WHERE name = 'ポテトサラダ' LIMIT 1),
    (SELECT id FROM products WHERE name LIKE '%じゃがいも%' LIMIT 1),
    200,
    'g'
  ),
  (
    (SELECT id FROM menus WHERE name = 'ポテトサラダ' LIMIT 1),
    (SELECT id FROM products WHERE name LIKE '%マヨネーズ%' LIMIT 1),
    50,
    'ml'
  );

-- 3. 売上サンプル
INSERT INTO sales (store_id, sales_date, total_amount, source, status) VALUES
  ('00000000-0000-0000-0000-000000000001', '2025-12-12 18:30:00', 1600, 'manual', 'confirmed');

-- 4. 売上明細サンプル
INSERT INTO sales_details (sales_id, menu_id, menu_name_detected, quantity_sold, unit_price_at_sale, subtotal, is_matched) VALUES
  (
    (SELECT id FROM sales ORDER BY created_at DESC LIMIT 1),
    (SELECT id FROM menus WHERE name = 'ポテトサラダ' LIMIT 1),
    'ポテトサラダ',
    2,
    500,
    1000,
    true
  );
```

---

## エラー時の対処法

### エラー: `relation "stores" does not exist`
**原因:** storesテーブルが未作成  
**対処:** 先に既存のマイグレーション（`database-setup.sql`）を実行してください

### エラー: `function uuid_generate_v4() does not exist`
**原因:** PostgreSQL拡張が未有効化  
**対処:** Supabase Dashboardで以下を実行
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### エラー: `column "stock_quantity" does not exist`
**原因:** productsテーブルのカラム名が異なる  
**対処:** 以下で確認
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'products';
```

---

## 推奨: Row Level Security (RLS) 設定

セキュリティ強化のため、以下のポリシーを追加することを推奨します:

```sql
-- RLS有効化
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_details ENABLE ROW LEVEL SECURITY;

-- 認証ユーザーのみアクセス可能
CREATE POLICY "Users can view their store menus"
  ON menus FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert menus"
  ON menus FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update menus"
  ON menus FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- 同様にrecipes, sales, sales_detailsにも適用
```

---

## 次のステップ

マイグレーション完了後:
1. ✅ テーブル作成確認
2. ✅ サンプルデータ投入
3. → **メニュー管理画面（CRUD）の実装**へ進む
