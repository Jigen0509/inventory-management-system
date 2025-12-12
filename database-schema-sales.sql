-- 売上管理システムのデータベーススキーマ

-- メニューマスタ
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT menus_price_positive CHECK (price >= 0)
);

CREATE INDEX idx_menus_store_id ON menus(store_id);
CREATE INDEX idx_menus_category ON menus(category);
CREATE INDEX idx_menus_name ON menus(name);

-- レシピ（変換テーブル）
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity_required DECIMAL(10, 3) NOT NULL,
  unit_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT recipes_quantity_positive CHECK (quantity_required > 0),
  UNIQUE(menu_id, product_id)
);

CREATE INDEX idx_recipes_menu_id ON recipes(menu_id);
CREATE INDEX idx_recipes_product_id ON recipes(product_id);

-- 売上ヘッダー
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  sales_date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  source VARCHAR(20) NOT NULL CHECK (source IN ('ocr', 'manual', 'csv', 'pos')),
  ocr_image_url TEXT,
  ocr_raw_text TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'corrected', 'rejected')),
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT sales_total_amount_positive CHECK (total_amount >= 0)
);

CREATE INDEX idx_sales_store_id ON sales(store_id);
CREATE INDEX idx_sales_sales_date ON sales(sales_date);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_source ON sales(source);

-- 売上明細
CREATE TABLE sales_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES menus(id) ON DELETE SET NULL,
  menu_name_detected VARCHAR(255) NOT NULL,
  quantity_sold INTEGER NOT NULL,
  unit_price_at_sale DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  confidence_score DECIMAL(3, 2),
  is_matched BOOLEAN DEFAULT false,
  requires_review BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT sales_details_quantity_positive CHECK (quantity_sold > 0),
  CONSTRAINT sales_details_unit_price_positive CHECK (unit_price_at_sale >= 0),
  CONSTRAINT sales_details_confidence_range CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

CREATE INDEX idx_sales_details_sales_id ON sales_details(sales_id);
CREATE INDEX idx_sales_details_menu_id ON sales_details(menu_id);
CREATE INDEX idx_sales_details_is_matched ON sales_details(is_matched);
CREATE INDEX idx_sales_details_requires_review ON sales_details(requires_review);

-- 在庫トランザクションログ（既存のinventoriesテーブルを拡張）
ALTER TABLE inventories ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'adjustment' 
  CHECK (type IN ('sales', 'purchase', 'adjustment', 'waste', 'return'));
ALTER TABLE inventories ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50);
ALTER TABLE inventories ADD COLUMN IF NOT EXISTS reference_id UUID;
ALTER TABLE inventories ADD COLUMN IF NOT EXISTS previous_quantity DECIMAL(10, 3);
ALTER TABLE inventories ADD COLUMN IF NOT EXISTS new_quantity DECIMAL(10, 3);
ALTER TABLE inventories ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE inventories ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

CREATE INDEX idx_inventories_type ON inventories(type);
CREATE INDEX idx_inventories_reference ON inventories(reference_type, reference_id);

-- トリガー: updated_at自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON menus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_details_updated_at BEFORE UPDATE ON sales_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ビュー: 在庫状況と必要レシピ確認
CREATE OR REPLACE VIEW v_menu_stock_status AS
SELECT 
  m.id AS menu_id,
  m.name AS menu_name,
  m.store_id,
  r.product_id,
  p.name AS product_name,
  p.stock_quantity AS current_stock,
  r.quantity_required,
  r.unit_id,
  FLOOR(p.stock_quantity / r.quantity_required) AS max_servings,
  CASE 
    WHEN p.stock_quantity < r.quantity_required THEN 'out_of_stock'
    WHEN p.stock_quantity < (r.quantity_required * 5) THEN 'low_stock'
    ELSE 'in_stock'
  END AS stock_status
FROM menus m
JOIN recipes r ON m.id = r.menu_id
JOIN products p ON r.product_id = p.id
WHERE m.is_active = true;

-- ビュー: 売上集計（日次）
CREATE OR REPLACE VIEW v_daily_sales_summary AS
SELECT 
  s.store_id,
  DATE(s.sales_date) AS sales_date,
  COUNT(DISTINCT s.id) AS num_transactions,
  SUM(s.total_amount) AS total_sales,
  COUNT(sd.id) AS total_items_sold,
  SUM(sd.quantity_sold) AS total_quantity_sold
FROM sales s
LEFT JOIN sales_details sd ON s.id = sd.sales_id
WHERE s.status = 'confirmed'
GROUP BY s.store_id, DATE(s.sales_date);
