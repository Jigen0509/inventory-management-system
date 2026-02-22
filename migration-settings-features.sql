-- 設定機能用のマイグレーション
-- Supabase SQL Editorで実行してください

-- 1. suppliers テーブルに発注先の詳細設定を追加
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS minimum_order_amount DECIMAL(10,2) DEFAULT 0 CHECK (minimum_order_amount >= 0),
ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 0 CHECK (lead_time_days >= 0),
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN suppliers.minimum_order_amount IS '最低発注金額';
COMMENT ON COLUMN suppliers.lead_time_days IS 'リードタイム（納期日数）';
COMMENT ON COLUMN suppliers.notes IS '備考';

-- 2. inventories テーブルに店舗別のアラート基準を追加（既存の minimum_stock を使用）
-- reorder_point を商品別→店舗別に移動する場合は以下を実行
ALTER TABLE inventories 
ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 10 CHECK (reorder_point >= 0),
ADD COLUMN IF NOT EXISTS reorder_quantity INTEGER DEFAULT 0 CHECK (reorder_quantity >= 0);

COMMENT ON COLUMN inventories.reorder_point IS '店舗別の再発注点（この数を下回ると発注候補）';
COMMENT ON COLUMN inventories.reorder_quantity IS '店舗別の推奨発注数量';

-- 3. users テーブルに追加情報を格納（権限管理強化）
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN users.phone IS '電話番号';
COMMENT ON COLUMN users.is_active IS 'アカウント有効/無効';
COMMENT ON COLUMN users.last_login IS '最終ログイン日時';

-- 4. 店舗設定テーブルを新規作成
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
  business_hours_start TIME DEFAULT '09:00:00',
  business_hours_end TIME DEFAULT '18:00:00',
  tax_rate DECIMAL(5,4) DEFAULT 0.10 CHECK (tax_rate >= 0 AND tax_rate <= 1),
  default_stock_threshold INTEGER DEFAULT 10 CHECK (default_stock_threshold >= 0),
  auto_order_enabled BOOLEAN DEFAULT false,
  notification_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE store_settings IS '店舗別の設定情報';
COMMENT ON COLUMN store_settings.business_hours_start IS '営業時間（開始）';
COMMENT ON COLUMN store_settings.business_hours_end IS '営業時間（終了）';
COMMENT ON COLUMN store_settings.tax_rate IS '消費税率';
COMMENT ON COLUMN store_settings.default_stock_threshold IS 'デフォルトの在庫閾値';
COMMENT ON COLUMN store_settings.auto_order_enabled IS '自動発注有効/無効';

-- 5. インデックスの追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_inventories_reorder ON inventories(reorder_point, current_stock);
CREATE INDEX IF NOT EXISTS idx_suppliers_lead_time ON suppliers(lead_time_days);

-- 6. updated_at の自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにトリガーを設定
DO $$
BEGIN
  -- suppliers
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_suppliers_updated_at') THEN
    CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- users
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- inventories
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_inventories_updated_at') THEN
    CREATE TRIGGER update_inventories_updated_at
    BEFORE UPDATE ON inventories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- store_settings
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_store_settings_updated_at') THEN
    CREATE TRIGGER update_store_settings_updated_at
    BEFORE UPDATE ON store_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- 7. 既存店舗に対してデフォルト設定を挿入
INSERT INTO store_settings (store_id, business_hours_start, business_hours_end, tax_rate, default_stock_threshold, auto_order_enabled)
SELECT id, '09:00:00', '18:00:00', 0.10, 10, false
FROM stores
WHERE id NOT IN (SELECT store_id FROM store_settings WHERE store_id IS NOT NULL)
ON CONFLICT (store_id) DO NOTHING;

-- マイグレーション完了
SELECT 'マイグレーション完了: 設定機能用のテーブル拡張が完了しました。' AS status;
