# マイグレーション実行ガイド（サンプルデータ付き）

## 概要

このガイドでは、売上管理システムのデータベーススキーマをSupabaseに適用し、ポテトサラダの具体例を含むサンプルデータを投入する手順を説明します。

## 前提条件

- Supabaseプロジェクトが作成済み
- プロジェクトURLとAPIキーが取得済み
- `psql`（PostgreSQL クライアント）がインストール済み、または Supabase SQL Editor を使用可能

## 実行手順

### 方法A: Supabase SQL Editor を使用（推奨）

最も簡単な方法です。

#### ステップ1: Supabase Dashboardへログイン

1. [https://app.supabase.com](https://app.supabase.com) にアクセス
2. プロジェクトを選択
3. 左メニューから **SQL Editor** をクリック

#### ステップ2: スキーマを適用

1. **+ New Query** をクリック
2. `database-schema-sales.sql` の内容をコピー＆ペースト
3. **▶ Run** ボタンをクリック

実行後、以下の確認メッセージが表示されれば成功：
```
✓ Tables created successfully
✓ Indexes created successfully
```

**もし既存テーブルエラーが出た場合:**
```sql
-- 既存テーブルを削除（注意：本番環境では実行禁止）
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS sales_details CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS menus CASCADE;
```

#### ステップ3: サンプルデータを投入

1. **+ New Query** をクリック
2. `seed.sql` の内容をコピー＆ペースト
3. **▶ Run** ボタンをクリック

実行後、以下が投入されます：
- **Products（材料）**: ジャガイモ、マヨネーズ、キュウリ、塩、コショウ
- **Menus（メニュー）**: 自家製ポテトサラダ（500円）
- **Recipes（レシピ）**: 親メニューと5つの材料の紐付け
- **Sales（売上）**: テストOCR売上1件（ポテトサラダ×3）
- **Inventories（在庫）**: 各食材の初期在庫

#### ステップ4: データを確認

以下のクエリで投入されたデータを確認：

**ポテトサラダのレシピ確認:**
```sql
SELECT 
  m.name as メニュー名,
  p.name as 材料,
  r.quantity_required as 使用量,
  r.unit_id as 単位
FROM recipes r
JOIN menus m ON r.menu_id = m.id
JOIN products p ON r.product_id = p.id
WHERE m.name = '自家製ポテトサラダ'
ORDER BY p.name;
```

**期待される出力:**
```
メニュー名             | 材料      | 使用量 | 単位
自家製ポテトサラダ     | ジャガイモ| 0.5   | 個
自家製ポテトサラダ     | キュウリ  | 0.25  | 本
自家製ポテトサラダ     | コショウ  | 0.5   | g
自家製ポテトサラダ     | マヨネーズ| 30    | g
自家製ポテトサラダ     | 塩        | 2     | g
```

**メニューと材料の親子関係:**
```sql
SELECT 
  m.id as menu_id,
  m.name as menu_name,
  m.price,
  COUNT(r.id) as recipe_count
FROM menus m
LEFT JOIN recipes r ON m.id = r.menu_id
GROUP BY m.id, m.name, m.price;
```

**期待される出力:**
```
menu_id                           | menu_name        | price | recipe_count
(UUIDが表示) | 自家製ポテトサラダ | 500.00| 5
```

**売上データの確認:**
```sql
SELECT 
  s.sales_date,
  sd.menu_name_detected,
  sd.quantity_sold,
  sd.unit_price_at_sale,
  sd.subtotal
FROM sales s
JOIN sales_details sd ON s.id = sd.sales_id
WHERE s.notes = 'サンプルOCR売上データ';
```

**期待される出力:**
```
sales_date                     | menu_name_detected | quantity_sold | unit_price_at_sale | subtotal
2025-12-12 XX:XX:XX.XXXXX+00  | ポテトサラダ      | 3             | 500.00             | 1500.00
```

### 方法B: psql コマンドラインツール を使用

より高度な方法です。

#### ステップ1: 接続文字列を取得

1. Supabase Dashboard で **Settings** → **Database**
2. **Connection string** を確認
3. **psql** タブを選択（PostgreSQL クライアント用）
4. `env` または `PGPASSWORD` の方法で認証情報を含める

#### ステップ2: スキーマを適用

```powershell
$env:PGPASSWORD = "your-supabase-password"
psql -h "your-project.supabase.co" -U postgres -d postgres -f database-schema-sales.sql
```

#### ステップ3: サンプルデータを投入

```powershell
$env:PGPASSWORD = "your-supabase-password"
psql -h "your-project.supabase.co" -U postgres -d postgres -f seed.sql
```

### 方法C: Supabase JavaScript クライアント（アプリから実行）

アプリケーションコード内から実行する場合：

```typescript
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

async function runMigrations() {
  try {
    // スキーマを適用
    const schema = fs.readFileSync('database-schema-sales.sql', 'utf-8')
    await supabase.rpc('run_sql', { sql: schema })
    
    // サンプルデータを投入
    const seed = fs.readFileSync('seed.sql', 'utf-8')
    await supabase.rpc('run_sql', { sql: seed })
    
    console.log('✓ Migration completed successfully')
  } catch (error) {
    console.error('✗ Migration failed:', error)
  }
}

runMigrations()
```

## トラブルシューティング

### エラー: "relation \"products\" does not exist"

**原因:** `database-schema-sales.sql` を実行する前に `products` テーブルがない

**解決策:**
1. 既存の `database-setup.sql` を先に実行
2. その後 `database-schema-sales.sql` を実行

実行順序：
```
database-setup.sql
  ↓
database-schema-sales.sql
  ↓
seed.sql
```

### エラー: "duplicate key value violates unique constraint"

**原因:** サンプルデータが既に投入済み

**解決策:** 
以下クエリで確認し、不要なら削除：

```sql
-- 既存データ確認
SELECT COUNT(*) FROM products WHERE name = 'ジャガイモ';

-- クリア（本番環境では注意！）
DELETE FROM recipes WHERE id IN (
  SELECT r.id FROM recipes r
  JOIN menus m ON r.menu_id = m.id
  WHERE m.name = '自家製ポテトサラダ'
);

DELETE FROM menus WHERE name = '自家製ポテトサラダ';

DELETE FROM products WHERE name IN ('ジャガイモ', 'マヨネーズ', 'キュウリ', '塩', 'コショウ');
```

### エラー: "foreign key constraint failed"

**原因:** 参照先のテーブル（例：stores）に必要なレコードがない

**解決策:**
1. `database-setup.sql` で `stores` テーブルが作成済みか確認
2. 最低1件の店舗レコードが存在するか確認：

```sql
SELECT COUNT(*) FROM stores;
```

店舗がない場合：
```sql
INSERT INTO stores (name, address, phone) VALUES 
  ('テスト店舗', 'テスト住所', '090-0000-0000');
```

## 次のステップ

データが投入されたら、UI実装時に以下を確認してください：

1. **Menu-Recipe親子関係の表示**
   - メニュー「自家製ポテトサラダ」を選択
   - 5つの材料と使用量が正しく表示されるか

2. **売上-販売メニューのマッピング**
   - OCR検知された「ポテトサラダ」が正しく メニューIDにマッピングされるか
   - 売上明細の親メニューが正しく参照されるか

3. **在庫減少ロジック**
   - ポテトサラダ×3が売上確定時
   - 自動的に各食材が消費量分減少するか確認

## ファイル構成

```
.
├── database-setup.sql           # ベーステーブル（users, stores等）
├── database-schema-sales.sql    # 売上管理スキーマ（menus, recipes, sales等）
├── seed.sql                     # サンプルデータ（ポテトサラダの例）
├── MIGRATION_GUIDE.md           # このファイル
└── SUPABASE_SETUP.md            # Supabase初期セットアップ
```

---

**作成日:** 2025-12-12  
**バージョン:** 1.0  
**最終確認:** 承認済み（ポテトサラダサンプル含む）
