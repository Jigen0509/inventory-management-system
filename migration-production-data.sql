-- ========================================
-- 本番環境データ投入スクリプト
-- 魚料理店チェーン用メニュー・商品データ
-- 必ず seed.sql 実行後に実行してください
-- ========================================

-- 1. 既存レシピ削除 (is_active=true のメニューのレシピのみ)
DELETE FROM recipes 
WHERE menu_id IN (SELECT id FROM menus WHERE is_active = true);

-- 2. 既存メニュー無効化
UPDATE menus SET is_active = false 
WHERE id IN (SELECT id FROM menus WHERE name LIKE '%ポテト%');

-- 3. 既存商品無効化（カテゴリ単位で）
UPDATE products SET is_active = false 
WHERE category IN (
  '野菜', '調味料', '魚（刺身用）', '魚（姿煮付け用）', '魚（冷凍）', '飲み物', 'その他'
);

-- ========================================
-- 新規商品投入
-- ========================================

-- 野菜
INSERT INTO products (
  name,
  category,
  cost,
  unit,
  unit_purchase_price,
  supplier_id,
  reorder_point,
  reorder_quantity,
  is_active
) VALUES
('ジャガイモ（新鮮）', '野菜', 45.00, 'kg', 45.00, NULL, 5, 20, true),
('キュウリ', '野菜', 75.00, '本', 75.00, NULL, 10, 30, true),
('大根（白だし用）', '野菜', 120.00, 'kg', 120.00, NULL, 3, 15, true),
('ニンジン（国産）', '野菜', 60.00, 'kg', 60.00, NULL, 4, 20, true),
('玉ねぎ', '野菜', 50.00, 'kg', 50.00, NULL, 6, 25, true),
('新生姜（甘酢漬け）', '野菜', 350.00, 'kg', 350.00, NULL, 2, 8, true);

-- 調味料
INSERT INTO products (
  name,
  category,
  cost,
  unit,
  unit_purchase_price,
  supplier_id,
  reorder_point,
  reorder_quantity,
  is_active
) VALUES
('醤油（甘辛ブレンド）', '調味料', 350.00, 'L', 350.00, NULL, 3, 10, true),
('砂糖（上白糖）', '調味料', 180.00, 'kg', 180.00, NULL, 2, 8, true),
('みりん（本格）', '調味料', 420.00, 'L', 420.00, NULL, 2, 6, true),
('塩麹（発酵塩）', '調味料', 0.12, 'g', 0.12, NULL, 5, 20, true),
('天塩（瀬戸内産）', '調味料', 150.00, 'kg', 150.00, NULL, 3, 12, true);

-- 魚類（刺身用）
INSERT INTO products (
  name,
  category,
  cost,
  unit,
  unit_purchase_price,
  supplier_id,
  reorder_point,
  reorder_quantity,
  is_active
) VALUES
('直送 寒ブリ（冬季）', '魚（刺身用）', 2200.00, 'kg', 2200.00, NULL, 2, 5, true),
('活〆 真鯛（本マダイ）', '魚（刺身用）', 1650.00, 'kg', 1650.00, NULL, 2, 5, true),
('生本マグロ 赤身', '魚（刺身用）', 4200.00, 'kg', 4200.00, NULL, 2, 5, true),
('生本マグロ 中トロ', '魚（刺身用）', 5800.00, 'kg', 5800.00, NULL, 1, 3, true),
('ヒラメ（夏季限定）', '魚（刺身用）', 2800.00, 'kg', 2800.00, NULL, 2, 5, true),
('イシダイ（白身高級）', '魚（刺身用）', 3200.00, 'kg', 3200.00, NULL, 2, 5, true),
('本わさび（チューブ）', '魚（刺身用）', 600.00, '本', 600.00, NULL, 5, 15, true);

-- 魚類（姿煮付け用）
INSERT INTO products (
  name,
  category,
  cost,
  unit,
  unit_purchase_price,
  supplier_id,
  reorder_point,
  reorder_quantity,
  is_active
) VALUES
('高級魚 ノドグロ', '魚（姿煮付け用）', 2800.00, '匹', 2800.00, NULL, 8, 25, true),
('キンメダイ（煮付け用）', '魚（姿煮付け用）', 1500.00, '匹', 1500.00, NULL, 10, 40, true),
('スズキ（白身）', '魚（姿煮付け用）', 1200.00, '匹', 1200.00, NULL, 12, 50, true);

-- 魚類（冷凍・加工）
INSERT INTO products (
  name,
  category,
  cost,
  unit,
  unit_purchase_price,
  supplier_id,
  reorder_point,
  reorder_quantity,
  is_active
) VALUES
('冷凍 アジフライ用アジ', '魚（冷凍）', 75.00, '枚', 75.00, NULL, 80, 300, true),
('冷凍 エビフライ用エビ', '魚（冷凍）', 120.00, '尾', 120.00, NULL, 50, 200, true),
('冷凍 イカゲソ（唐揚げ用）', '魚（冷凍）', 180.00, '本', 180.00, NULL, 40, 150, true);

-- 飲み物
INSERT INTO products (
  name,
  category,
  cost,
  unit,
  unit_purchase_price,
  supplier_id,
  reorder_point,
  reorder_quantity,
  is_active
) VALUES
('特選 日本酒（山田錦）', '飲み物', 1800.00, '瓶', 1800.00, NULL, 15, 50, true),
('地酒 特別本醸造', '飲み物', 1200.00, '瓶', 1200.00, NULL, 20, 60, true),
('麦焼酎（熊本産）', '飲み物', 1400.00, '瓶', 1400.00, NULL, 10, 40, true),
('赤ワイン（フルボディ）', '飲み物', 2500.00, '本', 2500.00, NULL, 8, 30, true),
('白ワイン（辛口）', '飲み物', 2200.00, '本', 2200.00, NULL, 10, 40, true),
('ビール（国産上級）', '飲み物', 280.00, '本', 280.00, NULL, 50, 200, true);

-- ========================================
-- 新規メニュー投入
-- ========================================

-- 再実行による重複防止のため一意インデックスを作成
CREATE UNIQUE INDEX IF NOT EXISTS uniq_menus_store_name ON menus(store_id, name);

-- UPSERT（重複時は更新）で投入
INSERT INTO menus (store_id, name, price, category, image_url, is_active)
VALUES
((SELECT id FROM stores LIMIT 1), '本マグロ中トロ三貫', 1980.00, '握り寿司', NULL, true),
((SELECT id FROM stores LIMIT 1), '季節の刺身五点盛り', 1680.00, '刺身', NULL, true),
((SELECT id FROM stores LIMIT 1), 'ブリ大根（アラ煮込み）', 920.00, '煮物', NULL, true),
((SELECT id FROM stores LIMIT 1), 'ノドグロ姿煮付け（本店限定）', 4200.00, '高級煮物', NULL, true),
((SELECT id FROM stores LIMIT 1), '生本マグロ漬け丼', 1280.00, '丼物', NULL, true),
((SELECT id FROM stores LIMIT 1), 'アジフライ定食（駅前支店限定）', 950.00, 'ランチセット', NULL, true),
((SELECT id FROM stores LIMIT 1), 'イシダイ塩焼き', 2280.00, '焼き物', NULL, true),
((SELECT id FROM stores LIMIT 1), 'ヒラメ昆布じめ', 1780.00, '前菜', NULL, true)
ON CONFLICT (store_id, name)
DO UPDATE SET
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active;

-- ========================================
-- レシピ投入
-- ========================================

-- M01: 本マグロ中トロ三貫
INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 75, 'g'
FROM menus m, products p
WHERE m.name = '本マグロ中トロ三貫' AND p.name = '生本マグロ 中トロ'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 0.05, 'g'
FROM menus m, products p
WHERE m.name = '本マグロ中トロ三貫' AND p.name = '本わさび（チューブ）'
ON CONFLICT DO NOTHING;

-- M02: 季節の刺身五点盛り
INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 60, 'g'
FROM menus m, products p
WHERE m.name = '季節の刺身五点盛り' AND p.name = '直送 寒ブリ（冬季）'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 60, 'g'
FROM menus m, products p
WHERE m.name = '季節の刺身五点盛り' AND p.name = '活〆 真鯛（本マダイ）'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 50, 'g'
FROM menus m, products p
WHERE m.name = '季節の刺身五点盛り' AND p.name = '生本マグロ 赤身'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 50, 'g'
FROM menus m, products p
WHERE m.name = '季節の刺身五点盛り' AND p.name = 'ヒラメ（夏季限定）'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 100, 'g'
FROM menus m, products p
WHERE m.name = '季節の刺身五点盛り' AND p.name = '大根（白だし用）'
ON CONFLICT DO NOTHING;

-- M03: ブリ大根（アラ煮込み）
INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 200, 'g'
FROM menus m, products p
WHERE m.name = 'ブリ大根（アラ煮込み）' AND p.name = '直送 寒ブリ（冬季）'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 250, 'g'
FROM menus m, products p
WHERE m.name = 'ブリ大根（アラ煮込み）' AND p.name = '大根（白だし用）'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 80, 'ml'
FROM menus m, products p
WHERE m.name = 'ブリ大根（アラ煮込み）' AND p.name = '醤油（甘辛ブレンド）'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 40, 'ml'
FROM menus m, products p
WHERE m.name = 'ブリ大根（アラ煮込み）' AND p.name = 'みりん（本格）'
ON CONFLICT DO NOTHING;

-- M04: ノドグロ姿煮付け（本店限定）
INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 1, '匹'
FROM menus m, products p
WHERE m.name = 'ノドグロ姿煮付け（本店限定）' AND p.name = '高級魚 ノドグロ'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 150, 'ml'
FROM menus m, products p
WHERE m.name = 'ノドグロ姿煮付け（本店限定）' AND p.name = '醤油（甘辛ブレンド）'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 100, 'ml'
FROM menus m, products p
WHERE m.name = 'ノドグロ姿煮付け（本店限定）' AND p.name = 'みりん（本格）'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 80, 'g'
FROM menus m, products p
WHERE m.name = 'ノドグロ姿煮付け（本店限定）' AND p.name = '新生姜（甘酢漬け）'
ON CONFLICT DO NOTHING;

-- M05: 生本マグロ漬け丼
INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 120, 'g'
FROM menus m, products p
WHERE m.name = '生本マグロ漬け丼' AND p.name = '生本マグロ 赤身'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 60, 'ml'
FROM menus m, products p
WHERE m.name = '生本マグロ漬け丼' AND p.name = '醤油（甘辛ブレンド）'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 30, 'ml'
FROM menus m, products p
WHERE m.name = '生本マグロ漬け丼' AND p.name = 'みりん（本格）'
ON CONFLICT DO NOTHING;

-- M06: アジフライ定食（駅前支店限定）
INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 3, '枚'
FROM menus m, products p
WHERE m.name = 'アジフライ定食（駅前支店限定）' AND p.name = '冷凍 アジフライ用アジ'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 80, 'g'
FROM menus m, products p
WHERE m.name = 'アジフライ定食（駅前支店限定）' AND p.name = '大根（白だし用）'
ON CONFLICT DO NOTHING;

-- M07: イシダイ塩焼き
INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 400, 'g'
FROM menus m, products p
WHERE m.name = 'イシダイ塩焼き' AND p.name = 'イシダイ（白身高級）'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 3, 'g'
FROM menus m, products p
WHERE m.name = 'イシダイ塩焼き' AND p.name = '天塩（瀬戸内産）'
ON CONFLICT DO NOTHING;

-- M08: ヒラメ昆布じめ
INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 150, 'g'
FROM menus m, products p
WHERE m.name = 'ヒラメ昆布じめ' AND p.name = 'ヒラメ（夏季限定）'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 100, 'g'
FROM menus m, products p
WHERE m.name = 'ヒラメ昆布じめ' AND p.name = '大根（白だし用）'
ON CONFLICT DO NOTHING;

INSERT INTO recipes (menu_id, product_id, quantity_required, unit_id)
SELECT m.id, p.id, 1.5, 'g'
FROM menus m, products p
WHERE m.name = 'ヒラメ昆布じめ' AND p.name = '天塩（瀬戸内産）'
ON CONFLICT DO NOTHING;

-- ========================================
-- 注記: 在庫（inventories）はメニュー作成時に自動生成されます
-- ========================================
