import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Supabase設定
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// 認証関連のヘルパー関数
export const auth = {
  // ログイン
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // ログアウト
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // 現在のユーザー取得
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // セッション取得
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // パスワードリセット
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  },
};

// データベース操作のヘルパー関数
export const db = {
  // ユーザー関連
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        store:stores(*)
      `)
      .eq('id', userId)
      .single();
    return { data, error };
  },

  // 店舗関連
  async getStores() {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('name');
    return { data, error };
  },

  async getStore(storeId: string) {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();
    return { data, error };
  },

  // 商品関連
  async getProducts(storeId: string) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        inventory:inventories(*),
        supplier:suppliers(*)
      `)
      .eq('inventory.store_id', storeId);
    return { data, error };
  },

  async getProductByBarcode(barcode: string) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .eq('barcode', barcode)
      .single();
    return { data, error };
  },

  async createProduct(product: any) {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
    return { data, error };
  },

  async updateProduct(productId: string, updates: any) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();
    return { data, error };
  },

  // 在庫関連
  async getInventory(storeId: string) {
    const { data, error } = await supabase
      .from('inventories')
      .select(`
        *,
        product:products(*)
      `)
      .eq('store_id', storeId);
    return { data, error };
  },

  async updateInventory(inventoryId: string, updates: any) {
    const { data, error } = await supabase
      .from('inventories')
      .update(updates)
      .eq('id', inventoryId)
      .select()
      .single();
    return { data, error };
  },

  async getLowStockItems(storeId: string) {
    const { data, error } = await supabase
      .from('inventories')
      .select(`
        *,
        product:products(*)
      `)
      .eq('store_id', storeId)
      .lte('current_stock', 'minimum_stock');
    return { data, error };
  },

  // 発注関連
  async getOrders(storeId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(*)
        ),
        supplier:suppliers(*)
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async createOrder(order: any) {
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();
    return { data, error };
  },

  async createOrderItems(items: any[]) {
    const { data, error } = await supabase
      .from('order_items')
      .insert(items)
      .select();
    return { data, error };
  },

  // チャット関連
  async getChatMessages(storeId: string, limit = 50) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:users(name)
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data, error };
  },

  async sendChatMessage(message: any) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert(message)
      .select()
      .single();
    return { data, error };
  },

  // 供給元関連
  async getSuppliers() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');
    return { data, error };
  },

  async createSupplier(supplier: any) {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplier)
      .select()
      .single();
    return { data, error };
  },

  async updateSupplier(supplierId: string, updates: any) {
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', supplierId)
      .select()
      .single();
    return { data, error };
  },

  async deleteSupplier(supplierId: string) {
    const { data, error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', supplierId);
    return { data, error };
  },

  async deleteProduct(productId: string) {
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    return { data, error };
  },
};

// リアルタイム購読
export const subscribe = {
  // 在庫変更の監視
  onInventoryChange(storeId: string, callback: (payload: any) => void) {
    return supabase
      .channel('inventory-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'inventories',
        filter: `store_id=eq.${storeId}`,
      }, callback)
      .subscribe();
  },

  // チャットメッセージの監視
  onChatMessages(storeId: string, callback: (payload: any) => void) {
    return supabase
      .channel('chat-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `store_id=eq.${storeId}`,
      }, callback)
      .subscribe();
  },

  // 発注状況の監視
  onOrderChanges(storeId: string, callback: (payload: any) => void) {
    return supabase
      .channel('order-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `store_id=eq.${storeId}`,
      }, callback)
      .subscribe();
  },
};
