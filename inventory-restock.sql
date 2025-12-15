-- 在庫一括リストックスクリプト
-- 目的: 最低在庫を下回っている全在庫を補充します
-- 実行環境: Supabase SQLエディタ

-- ポリシーにより店舗制約がある場合でも、管理者ロールで実行してください

-- 1) 最低在庫の2倍まで補充（上限は最大在庫にクリップ）
UPDATE inventories i
SET current_stock = LEAST(
  GREATEST(i.current_stock, i.minimum_stock * 2),
  NULLIF(i.maximum_stock, 0)
),
    last_updated = NOW(),
    updated_at = NOW()
WHERE i.minimum_stock > 0
  AND (i.current_stock < i.minimum_stock);

-- 2) 最低在庫が0の行は、基準がないため暫定で 20 を設定
UPDATE inventories i
SET current_stock = 20,
    minimum_stock = COALESCE(NULLIF(i.minimum_stock, 0), 10),
    maximum_stock = CASE WHEN COALESCE(NULLIF(i.maximum_stock, 0), 0) < 40 THEN 40 ELSE i.maximum_stock END,
    last_updated = NOW(),
    updated_at = NOW()
WHERE i.minimum_stock = 0
  AND i.current_stock = 0;

-- 3) 具体的なカテゴリ別の補充（必要なら有効化）
-- 例: 飲み物は最低在庫+30まで補充
-- UPDATE inventories i
-- SET current_stock = LEAST(i.minimum_stock + 30, NULLIF(i.maximum_stock, 0)),
--     last_updated = NOW(),
--     updated_at = NOW()
-- FROM products p
-- WHERE i.product_id = p.id AND p.category = '飲み物';

-- 結果確認
SELECT p.name, p.category, i.store_id, i.current_stock, i.minimum_stock, i.maximum_stock
FROM inventories i
JOIN products p ON p.id = i.product_id
ORDER BY p.category, p.name;