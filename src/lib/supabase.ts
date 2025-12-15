import { createClient, type RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type {
  Database,
  User,
  Store,
  Product,
  Inventory,
  Supplier,
  Order,
  OrderItem,
  ChatMessage,
  ChatMessageRead,
  ProductWithInventory,
} from '../types/database';

// Supabase設定
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// persistSession/autoRefresh を明示して、セッションを確実に保持
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

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

  // セッションを強制的に設定（サインイン後の保険）
  async setSession(accessToken: string, refreshToken: string) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    return { data, error };
  },

  // パスワードリセット
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  },
};

// データベース操作のヘルパー関数
export const db = {
  // ログイン中ユーザーの store_id を取得
  async getCurrentUserStoreId() {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return { store_id: null, user: null, error: userErr };

    const { data, error } = await supabase
      .from('users')
      .select('id, email, store_id')
      .eq('id', user.id)
      .maybeSingle();

    return { store_id: (data as any)?.store_id ?? null, user: (data as any) ?? null, error };
  },
  // ユーザー関連
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        store:stores!users_store_id_fkey(*)
      `)
      .eq('id', userId)
      .single();
    return { data: (data as unknown) as (User & { store: Store }), error };
  },

  // 店舗関連
  async getStores() {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('name');
    return { data: (data || []) as Store[], error };
  },

  async getStore(storeId: string) {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();
    return { data: (data as unknown) as Store, error };
  },

  // 商品関連
  async getProducts(storeId: string) {
    // products と inventories を正しく結合して取得（論理削除された商品は除外）
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true);
    
    if (productsError || !products) {
      return { data: null, error: productsError };
    }
    
    // 該当storeの在庫情報を取得
    const { data: inventories, error: inventoriesError } = await supabase
      .from('inventories')
      .select('*')
      .eq('store_id', storeId);
    
    if (inventoriesError) {
      return { data: null, error: inventoriesError };
    }
    
    // suppliers を取得
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*');
    
    if (suppliersError) {
      return { data: null, error: suppliersError };
    }
    
    // products と inventories をマッピング
    const result: ProductWithInventory[] = (products as Product[]).map((product) => {
      const inventory = (inventories as Inventory[]).find((inv) => inv.product_id === product.id) as Inventory;
      const supplier = (suppliers as Supplier[]).find((sup) => sup.id === product.supplier_id) as Supplier;
      return { ...product, inventory, supplier } as ProductWithInventory;
    });

    return { data: result, error: null };
  },

  async getProductByBarcode(barcode: string) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .eq('barcode', barcode)
      .eq('is_active', true)
      .maybeSingle();
    return { data: (data ? (data as Product & { supplier: Supplier }) : null), error };
  },

  async createProduct(product: Database['public']['Tables']['products']['Insert']) {
    const { data, error } = await (supabase as any)
      .from('products')
      .insert(product)
      .select()
      .single();
    return { data: (data as unknown) as Product, error };
  },

  async updateProduct(productId: string, updates: Database['public']['Tables']['products']['Update']) {
    const { data, error } = await (supabase as any)
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();
    return { data: (data as unknown) as Product, error };
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
    type InventoryWithProduct = Inventory & { product: Product };
    return { data: (data || []) as InventoryWithProduct[], error };
  },

  async createInventory(inventory: Database['public']['Tables']['inventories']['Insert']) {
    const { data, error } = await (supabase as any)
      .from('inventories')
      .insert(inventory)
      .select()
      .single();
    return { data: (data as unknown) as Inventory, error };
  },

  async updateInventory(inventoryId: string, updates: Database['public']['Tables']['inventories']['Update']) {
    const { data, error } = await (supabase as any)
      .from('inventories')
      .update(updates)
      .eq('id', inventoryId)
      .select()
      .single();
    return { data: (data as unknown) as Inventory, error };
  },

  async getLowStockItems(storeId: string) {
    // 埋め込みJOINを避け、クライアント側で突き合わせる
    const { data: inv, error: invErr } = await supabase
      .from('inventories')
      .select('*')
      .eq('store_id', storeId)
      .lte('current_stock', 'minimum_stock');
    if (invErr) return { data: null, error: invErr };

    const productIds = ((inv || []) as any[]).map((i) => i.product_id).filter(Boolean);
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds.length ? productIds : ['00000000-0000-0000-0000-000000000000']);
    if (prodErr) return { data: null, error: prodErr };

    const map: Record<string, Product> = Object.fromEntries(((products || []) as Product[]).map((p) => [p.id, p]));
    type InventoryWithProduct = Inventory & { product: Product };
    const merged: InventoryWithProduct[] = ((inv || []) as Inventory[]).map((i) => ({ ...i, product: map[i.product_id] }));
    return { data: merged, error: null };
  },

  // 発注関連
  async getOrders(storeId: string) {
    // 埋め込みJOINをやめ、段階的に取得
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    if (ordersErr) return { data: null, error: ordersErr };

    const orderIds = ((orders || []) as any[]).map((o) => o.id);
    const { data: items, error: itemsErr } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds.length ? orderIds : ['00000000-0000-0000-0000-000000000000']);
    if (itemsErr) return { data: null, error: itemsErr };

    const productIds = ((items || []) as any[]).map((i) => i.product_id).filter(Boolean);
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds.length ? productIds : ['00000000-0000-0000-0000-000000000000']);
    if (prodErr) return { data: null, error: prodErr };

    const supplierIds = ((orders || []) as any[]).map((o) => o.supplier_id).filter(Boolean);
    const { data: suppliers, error: suppErr } = await supabase
      .from('suppliers')
      .select('*')
      .in('id', supplierIds.length ? supplierIds : ['00000000-0000-0000-0000-000000000000']);
    if (suppErr) return { data: null, error: suppErr };

    const productMap: Record<string, Product> = Object.fromEntries(((products || []) as Product[]).map((p) => [p.id, p]));
    const supplierMap: Record<string, Supplier> = Object.fromEntries(((suppliers || []) as Supplier[]).map((s) => [s.id, s]));
    type OrderItemWithProduct = OrderItem & { product: Product | null };
    type OrderWithItemsAndSupplier = Order & { items: OrderItemWithProduct[]; supplier: Supplier | null };

    const itemsByOrder: Record<string, OrderItemWithProduct[]> = {};
    ((items || []) as OrderItem[]).forEach((it) => {
      const arr = itemsByOrder[it.order_id] || (itemsByOrder[it.order_id] = []);
      arr.push({ ...it, product: productMap[it.product_id] || null });
    });

    const merged: OrderWithItemsAndSupplier[] = ((orders || []) as Order[]).map((o) => ({
      ...o,
      items: itemsByOrder[o.id] || [],
      supplier: o.supplier_id ? supplierMap[o.supplier_id] : null,
    }));

    return { data: merged, error: null };
  },

  async createOrder(order: Database['public']['Tables']['orders']['Insert']) {
    const { data, error } = await (supabase as any)
      .from('orders')
      .insert(order)
      .select()
      .single();
    return { data: (data as unknown) as Order, error };
  },

  async createOrderItems(items: Database['public']['Tables']['order_items']['Insert'][]) {
    const { data, error } = await (supabase as any)
      .from('order_items')
      .insert(items)
      .select();
    return { data: ((data || []) as unknown) as OrderItem[], error };
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
    type ChatMessageWithSender = ChatMessage & { sender: { name: string } };
    return { data: (data || []) as ChatMessageWithSender[], error };
  },

  async sendChatMessage(message: Database['public']['Tables']['chat_messages']['Insert']) {
    const { data, error } = await (supabase as any)
      .from('chat_messages')
      .insert(message)
      .select()
      .single();
    return { data: (data as unknown) as ChatMessage, error };
  },

  // 既読管理
  async markMessageAsRead(messageId: string, userId: string) {
    // 既に既読済みかチェック
    const { data: existing } = await supabase
      .from('chat_message_reads')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .maybeSingle();
    
    // 既に既読済みならスキップ
    if (existing) {
      return { data: existing, error: null };
    }
    
    // 既読レコードを挿入
    const { data, error } = await (supabase as any)
      .from('chat_message_reads')
      .insert({
        message_id: messageId,
        user_id: userId,
        read_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();
    return { data: (data as unknown) as ChatMessageRead, error };
  },

  async getMessageReadCount(messageId: string) {
    const { data, error, count } = await supabase
      .from('chat_message_reads')
      .select('*', { count: 'exact' })
      .eq('message_id', messageId);
    return { data: (data || []) as ChatMessageRead[], count: count ?? 0, error };
  },

  // ストア内のオンラインメンバー取得
  async getOnlineMembers(storeId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('store_id', storeId)
      .order('name');
    return { data: (data || []) as Pick<User, 'id' | 'name' | 'email' | 'role'>[], error };
  },

  // 供給元関連
  async getSuppliers() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');
    return { data: (data || []) as Supplier[], error };
  },

  async createSupplier(supplier: Database['public']['Tables']['suppliers']['Insert']) {
    const { data, error } = await (supabase as any)
      .from('suppliers')
      .insert(supplier)
      .select()
      .single();
    return { data: (data as unknown) as Supplier, error };
  },

  async updateSupplier(supplierId: string, updates: Database['public']['Tables']['suppliers']['Update']) {
    const { data, error } = await (supabase as any)
      .from('suppliers')
      .update(updates)
      .eq('id', supplierId)
      .select()
      .single();
    return { data: (data as unknown) as Supplier, error };
  },

  async deleteSupplier(supplierId: string) {
    const { data, error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', supplierId);
    return { data: (data || []) as Supplier[], error };
  },

  async deleteProduct(productId: string) {
    // 論理削除: is_active を false にする
    const { data, error } = await (supabase as any)
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .select()
      .single();
    return { data: (data as unknown) as Product, error };
  },
};

// リアルタイム購読
export const subscribe = {
  // 在庫変更の監視
  onInventoryChange(
    storeId: string,
    callback: (payload: RealtimePostgresChangesPayload<Database['public']['Tables']['inventories']['Row']>) => void,
  ) {
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
  onChatMessages(
    storeId: string,
    callback: (payload: RealtimePostgresChangesPayload<Database['public']['Tables']['chat_messages']['Row']>) => void,
  ) {
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
  onOrderChanges(
    storeId: string,
    callback: (payload: RealtimePostgresChangesPayload<Database['public']['Tables']['orders']['Row']>) => void,
  ) {
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
