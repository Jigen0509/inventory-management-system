-- 在庫管理システム データベースセットアップ
-- Supabaseで実行してください

-- 1. 店舗テーブル
CREATE TABLE IF NOT EXISTS stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20),
  manager_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
  store_id UUID REFERENCES stores(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 供給元テーブル
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  order_url TEXT,
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 商品テーブル
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  barcode VARCHAR(50) UNIQUE,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 在庫テーブル
CREATE TABLE IF NOT EXISTS inventories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  store_id UUID REFERENCES stores(id),
  current_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  maximum_stock INTEGER NOT NULL DEFAULT 0,
  expiration_date DATE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, store_id)
);

-- 6. 発注テーブル
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  supplier_id UUID REFERENCES suppliers(id),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'confirmed', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expected_delivery DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 発注商品テーブル
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. チャットメッセージテーブル
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  sender_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. セッションテーブル
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_inventories_store_id ON inventories(store_id);
CREATE INDEX IF NOT EXISTS idx_inventories_product_id ON inventories(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_store_id ON chat_messages(store_id);

-- テストデータ挿入

-- 1. 店舗データ
INSERT INTO stores (id, name, address, phone) VALUES
('550e8400-e29b-41d4-a716-446655440001', '本店', '東京都渋谷区道玄坂1-2-3', '03-1234-5678'),
('550e8400-e29b-41d4-a716-446655440002', '支店', '大阪府大阪市北区梅田1-1-1', '06-1234-5678'),
('550e8400-e29b-41d4-a716-446655440003', '名古屋店', '愛知県名古屋市中区栄1-1-1', '052-123-4567');

-- 2. 供給元データ
INSERT INTO suppliers (id, name, contact_person, email, phone, address, order_url, category) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'ABC商事', '田中太郎', 'tanaka@abc-shouji.com', '03-1111-2222', '東京都新宿区西新宿1-1-1', 'https://abc-shouji.com/order', 'その他'),
('650e8400-e29b-41d4-a716-446655440002', 'パン工房田中', '田中花子', 'hanako@pan-koubou.com', '03-3333-4444', '東京都世田谷区三軒茶屋1-1-1', 'https://pan-koubou-tanaka.com/order', 'パン類'),
('650e8400-e29b-41d4-a716-446655440003', '地元牧場', '佐藤健太', 'sato@jimoto-bokujou.com', '03-5555-6666', '千葉県千葉市美浜区1-1-1', 'https://jimoto-bokujou.com/order', '乳製品'),
('650e8400-e29b-41d4-a716-446655440004', '飲料卸売', '山田一郎', 'yamada@drink-wholesale.com', '03-7777-8888', '神奈川県横浜市港北区1-1-1', 'https://drink-wholesale.com/order', '飲み物'),
('650e8400-e29b-41d4-a716-446655440005', '冷凍食品卸', '鈴木恵子', 'suzuki@frozen-foods.com', '03-9999-0000', '埼玉県さいたま市大宮区1-1-1', 'https://frozen-foods.com/order', '冷凍食品'),
('650e8400-e29b-41d4-a716-446655440006', '調味料卸売', '高橋吾郎', 'takahashi@seasoning-wholesale.com', '03-1111-3333', '千葉県船橋市1-1-1', 'https://seasoning-wholesale.com/order', '調味料'),
('650e8400-e29b-41d4-a716-446655440007', 'スナック菓子卸', '伊藤美咲', 'ito@snack-wholesale.com', '03-2222-4444', '東京都足立区1-1-1', 'https://snack-wholesale.com/order', 'お菓子'),
('650e8400-e29b-41d4-a716-446655440008', '野菜直販', '渡辺大輔', 'watanabe@vegetable-direct.com', '03-3333-5555', '茨城県水戸市1-1-1', 'https://vegetable-direct.com/order', '野菜'),
('650e8400-e29b-41d4-a716-446655440009', '精肉卸売', '中村悠太', 'nakamura@meat-wholesale.com', '03-4444-6666', '群馬県前橋市1-1-1', 'https://meat-wholesale.com/order', '肉類'),
('650e8400-e29b-41d4-a716-446655440010', '鮮魚卸売', '小林麻美', 'kobayashi@fish-wholesale.com', '03-5555-7777', '千葉県銚子市1-1-1', 'https://fish-wholesale.com/order', '魚類');

-- 3. テストユーザー（Supabase Authと連携する場合は、実際の認証システムで作成）
-- 注意: 実際の運用では、Supabase Authのユーザーと連携する必要があります
INSERT INTO users (id, email, name, role, store_id) VALUES
('750e8400-e29b-41d4-a716-446655440001', 'admin@demo.com', '管理者 太郎', 'admin', '550e8400-e29b-41d4-a716-446655440001'),
('750e8400-e29b-41d4-a716-446655440002', 'manager@demo.com', '店長 花子', 'manager', '550e8400-e29b-41d4-a716-446655440001'),
('750e8400-e29b-41d4-a716-446655440003', 'staff@demo.com', 'スタッフ 一郎', 'staff', '550e8400-e29b-41d4-a716-446655440001'),
('750e8400-e29b-41d4-a716-446655440004', 'manager2@demo.com', '支店長 二郎', 'manager', '550e8400-e29b-41d4-a716-446655440002'),
('750e8400-e29b-41d4-a716-446655440005', 'staff2@demo.com', '支店スタッフ 三郎', 'staff', '550e8400-e29b-41d4-a716-446655440002');

-- 4. 商品データ（100商品を生成）
INSERT INTO products (id, name, barcode, category, price, cost, supplier_id, description) VALUES
('850e8400-e29b-41d4-a716-446655440001', 'りんごジュース', '4901234567890', '飲み物', 150, 100, '650e8400-e29b-41d4-a716-446655440004', '100%りんごジュース'),
('850e8400-e29b-41d4-a716-446655440002', '食パン', '4901234567891', 'パン類', 200, 120, '650e8400-e29b-41d4-a716-446655440002', '6枚切り食パン'),
('850e8400-e29b-41d4-a716-446655440003', '牛乳（1L）', '4901234567892', '乳製品', 250, 180, '650e8400-e29b-41d4-a716-446655440003', '新鮮な牛乳'),
('850e8400-e29b-41d4-a716-446655440004', 'お米（5kg）', '4901234567893', '主食', 2800, 2000, '650e8400-e29b-41d4-a716-446655440001', '新潟産コシヒカリ'),
('850e8400-e29b-41d4-a716-446655440005', '冷凍うどん', '4901234567894', '冷凍食品', 120, 80, '650e8400-e29b-41d4-a716-446655440005', '手打ち風うどん'),
('850e8400-e29b-41d4-a716-446655440006', 'チョコレート', '4901234567895', 'お菓子', 100, 60, '650e8400-e29b-41d4-a716-446655440007', 'ミルクチョコレート'),
('850e8400-e29b-41d4-a716-446655440007', '醤油', '4901234567896', '調味料', 300, 200, '650e8400-e29b-41d4-a716-446655440006', '本醸造醤油'),
('850e8400-e29b-41d4-a716-446655440008', '卵（10個入り）', '4901234567897', 'その他', 250, 180, '650e8400-e29b-41d4-a716-446655440003', '新鮮な卵'),
('850e8400-e29b-41d4-a716-446655440009', 'チョコパン', '4901234567898', 'パン類', 120, 80, '650e8400-e29b-41d4-a716-446655440002', 'チョコレート入りパン'),
('850e8400-e29b-41d4-a716-446655440010', 'コーヒー', '4901234567899', '飲み物', 200, 150, '650e8400-e29b-41d4-a716-446655440004', 'ブラックコーヒー'),
('850e8400-e29b-41d4-a716-446655440011', 'トマト', '4901234567900', '野菜', 150, 100, '650e8400-e29b-41d4-a716-446655440008', '新鮮なトマト'),
('850e8400-e29b-41d4-a716-446655440012', '牛肉', '4901234567901', '肉類', 800, 600, '650e8400-e29b-41d4-a716-446655440009', '国産牛肉'),
('850e8400-e29b-41d4-a716-446655440013', 'サバ', '4901234567902', '魚類', 300, 200, '650e8400-e29b-41d4-a716-446655440010', '新鮮なサバ'),
('850e8400-e29b-41d4-a716-446655440014', 'ポテトチップス', '4901234567903', 'お菓子', 150, 100, '650e8400-e29b-41d4-a716-446655440007', 'サクサクポテトチップス'),
('850e8400-e29b-41d4-a716-446655440015', '冷凍ピザ', '4901234567904', '冷凍食品', 400, 300, '650e8400-e29b-41d4-a716-446655440005', 'マルゲリータピザ');

-- 5. 在庫データ（本店）- 最初の10商品は在庫不足、残りは十分な在庫
INSERT INTO inventories (product_id, store_id, current_stock, minimum_stock, maximum_stock, expiration_date) VALUES
('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 3, 10, 50, '2025-01-15'),
('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 2, 8, 30, '2024-12-25'),
('850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 5, 15, 40, '2025-02-10'),
('850e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 1, 5, 20, '2024-12-31'),
('850e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 4, 10, 50, '2025-03-15'),
('850e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 2, 20, 100, '2024-12-20'),
('850e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001', 3, 5, 30, '2025-01-30'),
('850e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440001', 1, 10, 40, '2025-02-25'),
('850e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440001', 2, 8, 30, '2024-12-15'),
('850e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 4, 10, 50, '2025-01-05'),
('850e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 50, 10, 100, '2025-04-10'),
('850e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 30, 5, 50, '2025-03-20'),
('850e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001', 25, 5, 40, '2025-05-15'),
('850e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440001', 60, 20, 100, '2025-06-30'),
('850e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001', 40, 10, 80, '2025-04-30');

-- 6. 在庫データ（支店）- 最初の10商品は在庫不足、残りは十分な在庫
INSERT INTO inventories (product_id, store_id, current_stock, minimum_stock, maximum_stock, expiration_date) VALUES
('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 3, 10, 50, '2025-01-20'),
('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 2, 8, 30, '2025-01-10'),
('850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 5, 15, 40, '2025-02-15'),
('850e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 1, 5, 20, '2025-01-08'),
('850e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 4, 10, 50, '2025-03-20'),
('850e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 2, 20, 100, '2024-12-18'),
('850e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 3, 5, 30, '2025-02-05'),
('850e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002', 1, 10, 40, '2025-03-01'),
('850e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440002', 2, 8, 30, '2024-12-12'),
('850e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 4, 10, 50, '2025-01-12'),
('850e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', 45, 10, 100, '2025-04-15'),
('850e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', 35, 5, 50, '2025-03-25'),
('850e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 30, 5, 40, '2025-05-20'),
('850e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', 55, 20, 100, '2025-07-05'),
('850e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', 35, 10, 80, '2025-05-05');

-- 7. サンプル発注データ
INSERT INTO orders (id, store_id, supplier_id, status, total_amount, expected_delivery, notes, created_by) VALUES
('950e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'confirmed', 1500, '2024-02-01', '急ぎでお願いします', '750e8400-e29b-41d4-a716-446655440002');

-- 8. サンプル発注商品データ
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
('950e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', 10, 100, 1000),
('950e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440006', 5, 100, 500);

-- 9. サンプルチャットメッセージ
INSERT INTO chat_messages (store_id, sender_id, message, is_system) VALUES
('550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'システムが起動しました', true),
('550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440002', '在庫確認をお願いします', false);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルにトリガーを設定
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventories_updated_at BEFORE UPDATE ON inventories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) の設定
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- 基本的なRLSポリシー（実際の運用では、より詳細なポリシーを設定してください）
CREATE POLICY "Enable all operations for authenticated users" ON stores FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON users FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON suppliers FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON products FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON inventories FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON orders FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON order_items FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON chat_messages FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON sessions FOR ALL USING (true);
