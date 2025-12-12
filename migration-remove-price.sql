-- マイグレーション: productsテーブルからpriceカラムを削除
-- Supabaseのデータベースエディタで実行してください

-- Step 1: 制約を確認してから削除
-- priceカラムに関連する制約がある場合は削除
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_price_check;

-- Step 2: priceカラムを削除
ALTER TABLE products DROP COLUMN IF EXISTS price;

-- 完了メッセージ
-- SELECT 'Price column successfully removed from products table' AS message;
