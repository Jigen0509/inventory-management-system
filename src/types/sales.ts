// 売上管理システムの型定義

// メニューマスタ
export interface Menu {
  id: string;
  store_id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// レシピ（変換テーブル）
export interface Recipe {
  id: string;
  menu_id: string;
  product_id: string;
  quantity_required: number; // 1皿あたりの消費量
  unit_id: string; // 単位ID（products.unitと連携）
  created_at: string;
  updated_at: string;
  
  // リレーション
  menu?: Menu;
  product?: {
    id: string;
    name: string;
    stock_quantity: number;
    unit: string;
    cost: number;
  };
}

// 売上ヘッダー
export interface Sales {
  id: string;
  store_id: string;
  sales_date: string;
  total_amount: number;
  source: 'ocr' | 'manual' | 'csv' | 'pos';
  ocr_image_url?: string; // OCR元画像のURL
  ocr_raw_text?: string; // OCR生テキスト
  status: 'pending' | 'confirmed' | 'corrected' | 'rejected';
  confirmed_by?: string; // 確認者のユーザーID
  confirmed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // リレーション
  details?: SalesDetail[];
}

// 売上明細
export interface SalesDetail {
  id: string;
  sales_id: string;
  menu_id: string | null; // nullの場合は未登録メニュー
  menu_name_detected: string; // OCRで検出されたメニュー名
  quantity_sold: number;
  unit_price_at_sale: number;
  subtotal: number;
  confidence_score?: number; // OCRマッチング信頼度（0-1）
  is_matched: boolean; // メニューマスタとマッチング成功したか
  requires_review: boolean; // 手動確認が必要か
  created_at: string;
  updated_at: string;
  
  // リレーション
  menu?: Menu;
  sales?: Sales;
}

// 在庫減算ログ（既存のinventoriesテーブルを拡張）
export interface InventoryTransaction {
  id: string;
  store_id: string;
  product_id: string;
  quantity: number; // マイナス値で減算
  type: 'sales' | 'purchase' | 'adjustment' | 'waste' | 'return';
  reference_type?: 'sales_detail' | 'order' | 'manual';
  reference_id?: string; // sales_detail.idなど
  previous_quantity: number;
  new_quantity: number;
  notes?: string;
  created_by?: string;
  created_at: string;
}

// OCR解析結果
export interface OCRResult {
  raw_text: string;
  items: OCRMenuItem[];
  total_amount?: number;
  receipt_date?: string;
  confidence: number;
}

export interface OCRMenuItem {
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  confidence: number;
  matched_menu_id?: string;
  matched_menu_name?: string;
  similarity_score?: number;
}

// 名寄せ候補
export interface MenuMatchCandidate {
  menu_id: string;
  menu_name: string;
  detected_name: string;
  similarity_score: number;
  price_match: boolean;
  suggested_match: boolean;
}
