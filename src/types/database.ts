// データベース型定義
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'staff';
  store_id: string;
  phone?: string;
  is_active?: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager_id: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  barcode?: string;
  category: string;
  cost: number;
  supplier_id: string;
  unit?: string;
  unit_purchase_price?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  is_active?: boolean;
  description?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  store_id: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  reorder_point?: number;
  reorder_quantity?: number;
  expiration_date?: string;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  order_url?: string;
  category?: string;
  minimum_order_amount?: number;
  lead_time_days?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  store_id: string;
  supplier_id: string;
  status: 'draft' | 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  total_amount: number;
  order_date: string;
  expected_delivery: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  store_id: string;
  sender_id: string;
  message: string;
  is_system: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

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

export interface Recipe {
  id: string;
  menu_id: string;
  product_id: string;
  quantity_required: number;
  unit_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageRead {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
  created_at: string;
}

// Supabase Database型定義
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      stores: {
        Row: Store;
        Insert: Omit<Store, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Store, 'id' | 'created_at' | 'updated_at'>>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>;
      };
      inventories: {
        Row: Inventory;
        Insert: Omit<Inventory, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Inventory, 'id' | 'created_at' | 'updated_at'>>;
      };
      suppliers: {
        Row: Supplier;
        Insert: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at'>>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Order, 'id' | 'created_at' | 'updated_at'>>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, 'id' | 'created_at'>;
        Update: Partial<Omit<OrderItem, 'id' | 'created_at'>>;
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: Omit<ChatMessage, 'id' | 'created_at'>;
        Update: Partial<Omit<ChatMessage, 'id' | 'created_at'>>;
      };
      chat_message_reads: {
        Row: ChatMessageRead;
        Insert: Omit<ChatMessageRead, 'id' | 'created_at'>;
        Update: Partial<Omit<ChatMessageRead, 'id' | 'created_at'>>;
      };
      menus: {
        Row: Menu;
        Insert: Omit<Menu, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Menu, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
          {
            foreignKeyName: 'menus_store_id_fkey';
            columns: ['store_id'];
            referencedRelation: 'stores';
            referencedColumns: ['id'];
          }
        ];
      };
      recipes: {
        Row: Recipe;
        Insert: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Recipe, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
          {
            foreignKeyName: 'recipes_menu_id_fkey';
            columns: ['menu_id'];
            referencedRelation: 'menus';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recipes_product_id_fkey';
            columns: ['product_id'];
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// 拡張型定義
export interface ProductWithInventory extends Product {
  inventory: Inventory;
  supplier: Supplier;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  supplier: Supplier;
}

export interface UserWithStore extends User {
  store: Store;
}

// フォーム用型定義
export interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

export interface ProductForm {
  name: string;
  barcode?: string;
  category: string;
  cost: number;
  supplier_id: string;
  description?: string;
  minimum_stock: number;
  maximum_stock: number;
  current_stock: number; // 在庫数
  expiration_date?: string; // 賞味期限
}

export interface OrderForm {
  supplier_id: string;
  expected_delivery: string;
  notes?: string;
  items: {
    product_id: string;
    quantity: number;
  }[];
}

// API レスポンス型定義
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// 店舗設定
export interface StoreSettings {
  id: string;
  store_id: string;
  business_hours_start: string;
  business_hours_end: string;
  tax_rate: number;
  default_stock_threshold: number;
  auto_order_enabled: boolean;
  notification_email?: string;
  created_at: string;
  updated_at: string;
}


export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
