-- サンプルデータ投入スクリプト
-- ポテトサラダの例を含むマスタデータ

-- ========================================
-- 1. Products（材料マスタ）
-- ========================================
-- ジャガイモ
INSERT INTO products (
  name,
  category,
  unit,
  unit_purchase_price,
  supplier_id,
  reorder_point,
  reorder_quantity,
  is_active
) VALUES (
  'ジャガイモ',
  '野菜',
  '個',
  50.00,
  NULL,  -- supplier_idは後で設定可能
  100,
  200,
  true
) ON CONFLICT DO NOTHING;

-- マヨネーズ
INSERT INTO products (
  name,
  category,
  unit,
  unit_purchase_price,
  supplier_id,
  reorder_point,
  reorder_quantity,
  is_active
) VALUES (
  'マヨネーズ',
  '調味料',
  'g',
  0.05,  -- グラムあたりの単価
  NULL,
  500,
  2000,
  true
) ON CONFLICT DO NOTHING;

-- キュウリ
INSERT INTO products (
  name,
  category,
  unit,
  unit_purchase_price,
  supplier_id,
  reorder_point,
  reorder_quantity,
  is_active
) VALUES (
  'キュウリ',
  '野菜',
  '本',
  80.00,
  NULL,
  30,
  100,
  true
) ON CONFLICT DO NOTHING;

-- 塩（オプション）
INSERT INTO products (
  name,
  category,
  unit,
  unit_purchase_price,
  supplier_id,
  reorder_point,
  reorder_quantity,
  is_active
) VALUES (
  '塩',
  '調味料',
  'g',
  0.01,
  NULL,
  100,
  500,
  true
) ON CONFLICT DO NOTHING;

-- コショウ（オプション）
INSERT INTO products (
  name,
  category,
  unit,
  unit_purchase_price,
  supplier_id,
  reorder_point,
  reorder_quantity,
  is_active
) VALUES (
  'コショウ',
  '調味料',
  'g',
  0.03,
  NULL,
  50,
  200,
  true
) ON CONFLICT DO NOTHING;

-- ========================================
-- 2. Menus（メニューマスタ）
-- ========================================
-- ポテトサラダ
-- 注意: store_idは実装時の店舗IDに合わせて調整が必要
-- ここではテスト用のデフォルト値を使用
INSERT INTO menus (
  store_id,
  name,
  price,
  category,
  image_url,
  is_active
) VALUES (
  (SELECT id FROM stores LIMIT 1),  -- 最初の店舗を使用
  '自家製ポテトサラダ',
  500.00,
  '副菜',
  NULL,
  true
) ON CONFLICT DO NOTHING;

-- ========================================
-- 3. Recipes（レシピ・材料紐付け）
-- ========================================
-- 取得したメニューと商品のIDを使用して、レシピを作成
INSERT INTO recipes (
  menu_id,
  product_id,
  quantity_required,
  unit_id
)
SELECT 
  m.id as menu_id,
  p.id as product_id,
  0.5 as quantity_required,
  '個' as unit_id
FROM menus m, products p
WHERE m.name = '自家製ポテトサラダ'
  AND p.name = 'ジャガイモ'
  AND NOT EXISTS (
    SELECT 1 FROM recipes r2
    WHERE r2.menu_id = m.id AND r2.product_id = p.id
  )
ON CONFLICT DO NOTHING;

-- マヨネーズ: 30g
INSERT INTO recipes (
  menu_id,
  product_id,
  quantity_required,
  unit_id
)
SELECT 
  m.id as menu_id,
  p.id as product_id,
  30 as quantity_required,
  'g' as unit_id
FROM menus m, products p
WHERE m.name = '自家製ポテトサラダ'
  AND p.name = 'マヨネーズ'
  AND NOT EXISTS (
    SELECT 1 FROM recipes r2
    WHERE r2.menu_id = m.id AND r2.product_id = p.id
  )
ON CONFLICT DO NOTHING;

-- キュウリ: 0.25本
INSERT INTO recipes (
  menu_id,
  product_id,
  quantity_required,
  unit_id
)
SELECT 
  m.id as menu_id,
  p.id as product_id,
  0.25 as quantity_required,
  '本' as unit_id
FROM menus m, products p
WHERE m.name = '自家製ポテトサラダ'
  AND p.name = 'キュウリ'
  AND NOT EXISTS (
    SELECT 1 FROM recipes r2
    WHERE r2.menu_id = m.id AND r2.product_id = p.id
  )
ON CONFLICT DO NOTHING;

-- 塩: 2g
INSERT INTO recipes (
  menu_id,
  product_id,
  quantity_required,
  unit_id
)
SELECT 
  m.id as menu_id,
  p.id as product_id,
  2 as quantity_required,
  'g' as unit_id
FROM menus m, products p
WHERE m.name = '自家製ポテトサラダ'
  AND p.name = '塩'
  AND NOT EXISTS (
    SELECT 1 FROM recipes r2
    WHERE r2.menu_id = m.id AND r2.product_id = p.id
  )
ON CONFLICT DO NOTHING;

-- コショウ: 0.5g
INSERT INTO recipes (
  menu_id,
  product_id,
  quantity_required,
  unit_id
)
SELECT 
  m.id as menu_id,
  p.id as product_id,
  0.5 as quantity_required,
  'g' as unit_id
FROM menus m, products p
WHERE m.name = '自家製ポテトサラダ'
  AND p.name = 'コショウ'
  AND NOT EXISTS (
    SELECT 1 FROM recipes r2
    WHERE r2.menu_id = m.id AND r2.product_id = p.id
  )
ON CONFLICT DO NOTHING;

-- ========================================
-- 4. サンプル売上データ（OCR検知テスト用）
-- ========================================
-- 売上ヘッダー: 本日の売上
INSERT INTO sales (
  store_id,
  sales_date,
  total_amount,
  source,
  status,
  notes
) VALUES (
  (SELECT id FROM stores LIMIT 1),
  CURRENT_TIMESTAMP,
  1500.00,
  'ocr',
  'pending',
  'サンプルOCR売上データ'
) ON CONFLICT DO NOTHING;

-- 売上明細: ポテトサラダ3皿 @500円
INSERT INTO sales_details (
  sales_id,
  menu_id,
  menu_name_detected,
  quantity_sold,
  unit_price_at_sale,
  subtotal,
  confidence_score,
  is_matched,
  requires_review
)
SELECT
  s.id as sales_id,
  m.id as menu_id,
  'ポテトサラダ' as menu_name_detected,
  3 as quantity_sold,
  500.00 as unit_price_at_sale,
  1500.00 as subtotal,
  0.95 as confidence_score,
  true as is_matched,
  false as requires_review
FROM sales s, menus m
WHERE s.notes = 'サンプルOCR売上データ'
  AND m.name = '自家製ポテトサラダ'
  AND NOT EXISTS (
    SELECT 1 FROM sales_details sd
    WHERE sd.sales_id = s.id
  )
ON CONFLICT DO NOTHING;

-- ========================================
-- 5. 在庫初期化（店舗の初期在庫）
-- ========================================
-- 各食材の初期在庫を設定
INSERT INTO inventories (
  product_id,
  store_id,
  quantity,
  type,
  notes
)
SELECT
  p.id,
  (SELECT id FROM stores LIMIT 1),
  CASE p.name
    WHEN 'ジャガイモ' THEN 500
    WHEN 'マヨネーズ' THEN 5000
    WHEN 'キュウリ' THEN 200
    WHEN '塩' THEN 1000
    WHEN 'コショウ' THEN 500
    ELSE 100
  END as quantity,
  'adjustment' as type,
  'サンプルデータ初期在庫' as notes
FROM products p
WHERE p.name IN ('ジャガイモ', 'マヨネーズ', 'キュウリ', '塩', 'コショウ')
  AND NOT EXISTS (
    SELECT 1 FROM inventories i
    WHERE i.product_id = p.id
      AND i.store_id = (SELECT id FROM stores LIMIT 1)
  )
ON CONFLICT DO NOTHING;

-- ========================================
-- 確認用クエリ
-- ========================================
-- これらのクエリは実行不要、参考用
/*
-- ポテトサラダのレシピ確認
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

-- メニューと材料の親子関係を確認
SELECT 
  m.id as menu_id,
  m.name as menu_name,
  m.price,
  COUNT(r.id) as recipe_count
FROM menus m
LEFT JOIN recipes r ON m.id = r.menu_id
GROUP BY m.id, m.name, m.price;

-- 売上データの確認
SELECT 
  s.sales_date,
  sd.menu_name_detected,
  sd.quantity_sold,
  sd.unit_price_at_sale,
  sd.subtotal
FROM sales s
JOIN sales_details sd ON s.id = sd.sales_id
WHERE s.notes = 'サンプルOCR売上データ';
*/
