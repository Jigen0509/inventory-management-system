// データベース移行ユーティリティ
import { supabase } from '../lib/supabase';

export interface MigrationData {
  savedProducts: any[];
  storeProducts: any[];
  currentStore: any;
  currentUser: any;
}

// localStorageからデータを取得
export const getLocalStorageData = (): MigrationData => {
  try {
    const savedProducts = JSON.parse(localStorage.getItem('savedProducts') || '[]');
    const storeProducts = JSON.parse(localStorage.getItem('storeProducts') || '[]');
    const currentStore = JSON.parse(localStorage.getItem('currentStore') || '{}');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    return {
      savedProducts,
      storeProducts,
      currentStore,
      currentUser
    };
  } catch (error) {
    console.error('localStorageデータの取得に失敗しました:', error);
    return {
      savedProducts: [],
      storeProducts: [],
      currentStore: {},
      currentUser: {}
    };
  }
};

// 商品データをデータベースに移行
export const migrateProductsToDatabase = async (products: any[]) => {
  const results = [];
  
  for (const product of products) {
    try {
      // 商品を挿入
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert({
          id: product.id,
          name: product.name,
          barcode: product.barcode,
          category: product.category,
          price: product.price,
          cost: product.cost,
          supplier_id: product.supplier_id,
          description: product.description,
          created_at: product.created_at,
          updated_at: product.updated_at
        })
        .select()
        .single();

      if (productError) {
        console.error(`商品 ${product.name} の挿入に失敗:`, productError);
        continue;
      }

      // 在庫データを挿入
      if (product.inventory) {
        const { error: inventoryError } = await supabase
          .from('inventories')
          .insert({
            id: product.inventory.id,
            product_id: product.id,
            store_id: product.inventory.store_id,
            current_stock: product.inventory.current_stock,
            minimum_stock: product.inventory.minimum_stock,
            maximum_stock: product.inventory.maximum_stock,
            last_updated: product.inventory.last_updated,
            created_at: product.inventory.created_at,
            updated_at: product.inventory.updated_at
          });

        if (inventoryError) {
          console.error(`在庫データ ${product.name} の挿入に失敗:`, inventoryError);
        }
      }

      results.push({ success: true, product: product.name });
    } catch (error) {
      console.error(`商品 ${product.name} の移行に失敗:`, error);
      results.push({ success: false, product: product.name, error });
    }
  }
  
  return results;
};

// 供給元データをデータベースに移行
export const migrateSuppliersToDatabase = async (suppliers: any[]) => {
  const results = [];
  
  for (const supplier of suppliers) {
    try {
      const { error } = await supabase
        .from('suppliers')
        .insert({
          id: supplier.id,
          name: supplier.name,
          contact_person: supplier.contact_person,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
          order_url: supplier.order_url,
          category: supplier.category,
          created_at: supplier.created_at,
          updated_at: supplier.updated_at
        });

      if (error) {
        console.error(`供給元 ${supplier.name} の挿入に失敗:`, error);
        results.push({ success: false, supplier: supplier.name, error });
      } else {
        results.push({ success: true, supplier: supplier.name });
      }
    } catch (error) {
      console.error(`供給元 ${supplier.name} の移行に失敗:`, error);
      results.push({ success: false, supplier: supplier.name, error });
    }
  }
  
  return results;
};

// 全データの移行
export const migrateAllData = async () => {
  const localData = getLocalStorageData();
  const results = {
    products: [],
    suppliers: [],
    errors: []
  };

  try {
    // 供給元データを移行
    const supplierResults = await migrateSuppliersToDatabase([
      // デモ供給元データ
      {
        id: '650e8400-e29b-41d4-a716-446655440001',
        name: 'ABC商事',
        contact_person: '田中太郎',
        email: 'tanaka@abc-shouji.com',
        phone: '03-1111-2222',
        address: '東京都新宿区西新宿1-1-1',
        order_url: 'https://abc-shouji.com/order',
        category: '総合卸売',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440002',
        name: 'パン工房田中',
        contact_person: '田中花子',
        email: 'hanako@pan-koubou.com',
        phone: '03-3333-4444',
        address: '東京都世田谷区三軒茶屋1-1-1',
        order_url: 'https://pan-koubou-tanaka.com/order',
        category: 'パン類',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440003',
        name: '地元牧場',
        contact_person: '佐藤健太',
        email: 'sato@jimoto-bokujou.com',
        phone: '03-5555-6666',
        address: '千葉県千葉市美浜区1-1-1',
        order_url: 'https://jimoto-bokujou.com/order',
        category: '乳製品',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440004',
        name: '飲料卸売',
        contact_person: '山田一郎',
        email: 'yamada@drink-wholesale.com',
        phone: '03-7777-8888',
        address: '神奈川県横浜市港北区1-1-1',
        order_url: 'https://drink-wholesale.com/order',
        category: '飲料',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440005',
        name: '冷凍食品卸',
        contact_person: '鈴木恵子',
        email: 'suzuki@frozen-foods.com',
        phone: '03-9999-0000',
        address: '埼玉県さいたま市大宮区1-1-1',
        order_url: 'https://frozen-foods.com/order',
        category: '冷凍食品',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440006',
        name: '調味料卸売',
        contact_person: '高橋吾郎',
        email: 'takahashi@seasoning-wholesale.com',
        phone: '03-1111-3333',
        address: '千葉県船橋市1-1-1',
        order_url: 'https://seasoning-wholesale.com/order',
        category: '調味料',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440007',
        name: 'スナック菓子卸',
        contact_person: '伊藤美咲',
        email: 'ito@snack-wholesale.com',
        phone: '03-2222-4444',
        address: '東京都足立区1-1-1',
        order_url: 'https://snack-wholesale.com/order',
        category: 'お菓子',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440008',
        name: '野菜直販',
        contact_person: '渡辺大輔',
        email: 'watanabe@vegetable-direct.com',
        phone: '03-3333-5555',
        address: '茨城県水戸市1-1-1',
        order_url: 'https://vegetable-direct.com/order',
        category: '野菜',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440009',
        name: '精肉卸売',
        contact_person: '中村悠太',
        email: 'nakamura@meat-wholesale.com',
        phone: '03-4444-6666',
        address: '群馬県前橋市1-1-1',
        order_url: 'https://meat-wholesale.com/order',
        category: '精肉',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '650e8400-e29b-41d4-a716-446655440010',
        name: '鮮魚卸売',
        contact_person: '小林麻美',
        email: 'kobayashi@fish-wholesale.com',
        phone: '03-5555-7777',
        address: '千葉県銚子市1-1-1',
        order_url: 'https://fish-wholesale.com/order',
        category: '鮮魚',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);
    
    results.suppliers = supplierResults;

    // 商品データを移行
    const allProducts = [...localData.savedProducts, ...localData.storeProducts];
    const productResults = await migrateProductsToDatabase(allProducts);
    results.products = productResults;

    // 移行完了のマークを設定
    localStorage.setItem('migrationCompleted', 'true');
    localStorage.setItem('migrationDate', new Date().toISOString());

  } catch (error) {
    console.error('データ移行に失敗しました:', error);
    results.errors.push(error);
  }

  return results;
};

// 移行状況をチェック
export const checkMigrationStatus = () => {
  const migrationCompleted = localStorage.getItem('migrationCompleted');
  const migrationDate = localStorage.getItem('migrationDate');
  
  return {
    completed: migrationCompleted === 'true',
    date: migrationDate
  };
};




