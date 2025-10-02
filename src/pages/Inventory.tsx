import React, { useState, useEffect, useCallback } from 'react';
import { allProducts } from '../data/products';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle,
  CheckCircle,
  Camera,
  X,
  Trash2
} from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import ProductForm from '../components/ProductForm';
import BarcodeScanner from '../components/BarcodeScanner';
import { db } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { ProductWithInventory, Supplier } from '../types/database';

const Inventory: React.FC = () => {
  const { currentStore } = useStore();
  const { isDatabaseMode } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithInventory | null>(null);
  const [products, setProducts] = useState<ProductWithInventory[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithInventory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedProducts, setSavedProducts] = useState<ProductWithInventory[]>([]);
  const [isScannerMounted, setIsScannerMounted] = useState(false);

  const categories = ['all', '在庫不足', '飲み物', 'パン類', '乳製品', '主食', '冷凍食品', 'お菓子', '調味料', 'インスタント', '野菜', '肉類', '魚類', 'その他'];

  useEffect(() => {
    if (currentStore?.id) {
      loadProducts();
      loadSuppliers();
    }
    
    // コンポーネントのアンマウント時にスキャナーをクリーンアップ
    return () => {
      console.log('Inventory: Component unmounting');
      if (showScanner) {
        console.log('Inventory: Cleaning up scanner on unmount');
        setIsScannerMounted(false);
        setShowScanner(false);
      }
    };
  }, [currentStore?.id, showScanner]);

  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 供給元データを読み込み
  const loadSuppliers = async () => {
    try {
      if (isDatabaseMode) {
        // データベースから供給元データを取得
        const { data: dbSuppliers, error } = await db.getSuppliers();
        
        if (error) {
          console.error('データベースからの供給元取得に失敗:', error);
          throw error;
        }
        
        if (dbSuppliers) {
          setSuppliers(dbSuppliers);
        }
      } else {
        // デモ用の供給元データ
        const demoSuppliers = [
        {
          id: '650e8400-e29b-41d4-a716-446655440001',
          name: 'ABC商事',
          contact_person: '田中太郎',
          email: 'tanaka@abc-shouji.com',
          phone: '03-1111-2222',
          address: '東京都新宿区西新宿1-1-1',
          order_url: 'https://abc-shouji.com/order',
          category: 'その他',
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
          contact_person: '佐藤一郎',
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
          name: '飲料卸売業者',
          contact_person: '山田次郎',
          email: 'yamada@drink-wholesale.com',
          phone: '03-7777-8888',
          address: '神奈川県横浜市港北区1-1-1',
          order_url: 'https://drink-wholesale.com/order',
          category: '飲み物',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '650e8400-e29b-41d4-a716-446655440005',
          name: '冷凍食品専門店',
          contact_person: '鈴木三郎',
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
          name: '調味料卸売業者',
          contact_person: '高橋四郎',
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
          name: 'お菓子卸売業者',
          contact_person: '伊藤五郎',
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
          name: '野菜直売所',
          contact_person: '渡辺六郎',
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
          name: '肉類専門卸売業者',
          contact_person: '中村七郎',
          email: 'nakamura@meat-wholesale.com',
          phone: '03-4444-6666',
          address: '群馬県前橋市1-1-1',
          order_url: 'https://meat-wholesale.com/order',
          category: '肉類',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '650e8400-e29b-41d4-a716-446655440010',
          name: '魚類専門卸売業者',
          contact_person: '小林八郎',
          email: 'kobayashi@fish-wholesale.com',
          phone: '03-5555-7777',
          address: '千葉県銚子市1-1-1',
          order_url: 'https://fish-wholesale.com/order',
          category: '魚類',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        ];
        setSuppliers(demoSuppliers);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  // 商品データを読み込み
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      
      if (isDatabaseMode) {
        // データベースから商品データを取得
        const { data: dbProducts, error } = await db.getProducts(currentStore?.id || '');
        
        if (error) {
          console.error('データベースからの商品取得に失敗:', error);
          throw error;
        }
        
        if (dbProducts) {
          setProducts(dbProducts);
          setFilteredProducts(dbProducts);
        }
      } else {
        // デモデータと保存された商品を結合
        const storeProducts = getStoreProducts(currentStore?.id || '1', 100);
        const allProducts = [...storeProducts, ...savedProducts];
        setProducts(allProducts);
        setFilteredProducts(allProducts);
        
        // ダッシュボード用にローカルストレージに保存
        localStorage.setItem('storeProducts', JSON.stringify(storeProducts));
      }
      
    } catch (error) {
      console.error('商品の読み込みに失敗しました:', error);
      
      // エラーメッセージの重複表示を防ぐ
      const errorShown = localStorage.getItem('inventoryErrorShown');
      if (!errorShown) {
        toast.error('商品の読み込みに失敗しました');
        localStorage.setItem('inventoryErrorShown', 'true');
        setTimeout(() => {
          localStorage.removeItem('inventoryErrorShown');
        }, 5000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 店舗ごとの商品データを生成（固定データ）
  const getStoreProducts = (storeId: string, targetCount: number): ProductWithInventory[] => {
    const storeProducts: ProductWithInventory[] = [];
    const usedIds = new Set<string>();
    const usedBarcodes = new Set<string>();

    // 固定の順序で商品を選択（ランダムではなく）
    for (let i = 0; i < Math.min(targetCount, allProducts.length); i++) {
      const randomProduct = allProducts[i];
      
      // 重複チェック
      if (usedIds.has(String(randomProduct.id)) || usedBarcodes.has(randomProduct.barcode)) {
        continue;
      }

      // 供給元IDを先に決定（発注URLが設定されている供給元のみ）
      const supplierIds = [
        '650e8400-e29b-41d4-a716-446655440001',
        '650e8400-e29b-41d4-a716-446655440002',
        '650e8400-e29b-41d4-a716-446655440003',
        '650e8400-e29b-41d4-a716-446655440004',
        '650e8400-e29b-41d4-a716-446655440005',
        '650e8400-e29b-41d4-a716-446655440006',
        '650e8400-e29b-41d4-a716-446655440007',
        '650e8400-e29b-41d4-a716-446655440008',
        '650e8400-e29b-41d4-a716-446655440009',
        '650e8400-e29b-41d4-a716-446655440010'
      ];
      // 固定の供給元IDを選択（商品インデックスに基づいて）
      const supplierIndex = i % supplierIds.length;
      const selectedSupplierId = supplierIds[supplierIndex];

      // 固定のIDを生成
      const uniqueId = `${randomProduct.id}_${storeId}_${i}`;
      
      const product: ProductWithInventory = {
        ...randomProduct,
        id: uniqueId,
        supplier_id: selectedSupplierId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        inventory: {
          id: uniqueId,
          product_id: uniqueId,
          store_id: storeId,
          current_stock: i < 10 ? Math.floor(Math.random() * 5) + 1 : 50 + (i % 50), // 最初の10個は在庫不足（1-5個）、それ以外は50-99の固定値
          minimum_stock: i < 10 ? Math.floor(Math.random() * 10) + 8 : 10 + (i % 10), // 最初の10個は最小在庫8-17個、それ以外は10-19の固定値
          maximum_stock: 100 + (i % 100), // 100-199の固定値
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        supplier: (() => {
          const suppliers = [
            {
              id: '650e8400-e29b-41d4-a716-446655440001',
              name: 'ABC商事',
              contact_person: '田中太郎',
              email: 'tanaka@abc-shouji.com',
              phone: '03-1111-2222',
              address: '東京都新宿区西新宿1-1-1',
              order_url: 'https://abc-shouji.com/order',
              category: 'その他',
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
              contact_person: '佐藤一郎',
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
              name: '飲料卸売業者',
              contact_person: '山田次郎',
              email: 'yamada@drink-wholesale.com',
              phone: '03-7777-8888',
              address: '神奈川県横浜市港北区1-1-1',
              order_url: 'https://drink-wholesale.com/order',
              category: '飲み物',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '650e8400-e29b-41d4-a716-446655440005',
              name: '冷凍食品専門店',
              contact_person: '鈴木三郎',
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
              name: '調味料卸売業者',
              contact_person: '高橋四郎',
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
              name: 'お菓子卸売業者',
              contact_person: '伊藤五郎',
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
              name: '野菜直売所',
              contact_person: '渡辺六郎',
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
              name: '肉類専門卸売業者',
              contact_person: '中村七郎',
              email: 'nakamura@meat-wholesale.com',
              phone: '03-4444-6666',
              address: '群馬県前橋市1-1-1',
              order_url: 'https://meat-wholesale.com/order',
              category: '肉類',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '650e8400-e29b-41d4-a716-446655440010',
              name: '魚類専門卸売業者',
              contact_person: '小林八郎',
              email: 'kobayashi@fish-wholesale.com',
              phone: '03-5555-7777',
              address: '千葉県銚子市1-1-1',
              order_url: 'https://fish-wholesale.com/order',
              category: '魚類',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '650e8400-e29b-41d4-a716-446655440011',
              name: '未設定供給元',
              contact_person: '未設定',
              email: 'unset@example.com',
              phone: '000-0000-0000',
              address: '未設定',
              order_url: undefined,
              category: 'その他',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
          
          // supplier_idに基づいて供給元を選択
          const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
          return selectedSupplier || suppliers[0]; // デフォルトは最初の供給元
        })()
      };

      storeProducts.push(product);
      usedIds.add(String(randomProduct.id));
      usedBarcodes.add(randomProduct.barcode);
    }

    console.log(`Generated ${storeProducts.length} products for store ${storeId}`);
    return storeProducts;
  };

  // 商品の在庫状況を判定
  const getProductStatus = (current: number, min: number, max: number, expirationDate?: string) => {
    // 期限切れ商品の判定
    if (expirationDate) {
      const today = new Date();
      const expDate = new Date(expirationDate);
      const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiration < 0) {
        return 'expired';
      }
    }
    
    if (current <= 0) return 'critical';
    if (current <= min) return 'low';
    if (current >= max) return 'excess';
    return 'good';
  };

  // 在庫状況の色を取得
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired':
        return 'bg-red-200 text-red-900 border-red-300';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'good':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'excess':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // 在庫状況のテキストを取得
  const getStatusText = (status: string) => {
    switch (status) {
      case 'expired':
        return '期限切れ';
      case 'critical':
        return '在庫切れ';
      case 'low':
        return '在庫不足';
      case 'good':
        return '在庫良好';
      case 'excess':
        return '在庫過多';
      default:
        return '不明';
    }
  };

  // 期限切れ商品の判定
  const isExpired = (product: ProductWithInventory) => {
    // データベースの消費期限データのみを使用して判定
    if (product.inventory?.expiration_date) {
      const today = new Date();
      const expirationDate = new Date(product.inventory.expiration_date);
      return expirationDate < today;
    }
    
    // 消費期限データがない場合は期限切れではない
    return false;
  };

  // フィルタリング処理
  useEffect(() => {
    let filtered = products;

    // 検索フィルター
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.includes(searchTerm)
      );
    }

    // カテゴリーフィルター
    if (selectedCategory !== 'all') {
      if (selectedCategory === '在庫不足') {
        filtered = filtered.filter(product => {
          const status = getProductStatus(
            product.inventory?.current_stock || 0,
            product.inventory?.minimum_stock || 0,
            product.inventory?.maximum_stock || 0
          );
          return status === 'low' || status === 'critical';
        });
      } else {
        filtered = filtered.filter(product => product.category === selectedCategory);
      }
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]);

  // バーコードスキャン処理
  const handleBarcodeScan = useCallback((barcode: string) => {
    console.log('Inventory: Barcode scanned:', barcode);
    
    const existingProduct = products.find(p => p.barcode === barcode);
    
    if (existingProduct) {
      setSelectedProduct(existingProduct);
      setShowProductDetail(true);
      toast.success('商品が見つかりました');
    } else {
      // 新規商品として追加
      setShowAddModal(true);
      toast('新規商品として追加します');
    }
    
    // スキャナーを閉じる前に少し待機
    setTimeout(() => {
      console.log('Inventory: Unmounting scanner after scan');
      setIsScannerMounted(false);
      setShowScanner(false);
    }, 200);
  }, [products]);

  // 発注処理
  const handleOrder = (product: ProductWithInventory) => {
    if (product.supplier?.order_url) {
      // 供給元URLが設定されている場合は新しいタブで開く
      window.open(product.supplier.order_url, '_blank');
      toast.success('発注ページを開きました');
    } else {
      toast.error('供給元URLが設定されていません');
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('この商品を削除しますか？関連する在庫データも削除されます。')) {
      return;
    }

    try {
      if (isDatabaseMode) {
        const { error } = await db.deleteProduct(productId);
        if (error) {
          throw error;
        }
      }
      
      setProducts(prev => prev.filter(p => p.id !== productId));
      setFilteredProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('商品を削除しました');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.message || '商品の削除に失敗しました');
    }
  };

  const handleProductSaved = async (productData: any) => {
    if (isDatabaseMode) {
      // データベースモードでは商品一覧を再読み込み
      await loadProducts();
    } else {
      // デモモードの既存ロジック
      setSavedProducts(prev => {
        const existingIndex = prev.findIndex(p => p.id === productData.id);
        let updatedSavedProducts;
        
        if (existingIndex >= 0) {
          // 既存商品を更新
          updatedSavedProducts = [...prev];
          updatedSavedProducts[existingIndex] = productData;
        } else {
          // 新規商品を追加
          updatedSavedProducts = [...prev, productData];
        }
        
        // 商品一覧を更新（保存済み商品のIDリストを作成）
        const storeProducts = getStoreProducts(currentStore?.id || '1', 100);
        const savedProductIds = new Set(updatedSavedProducts.map(p => p.id));
        
        // デモ商品から保存済み商品と同じIDのものを除外
        const filteredStoreProducts = storeProducts.filter(p => !savedProductIds.has(p.id));
        
        // 同じ商品名で発注URL未設定の商品を除外
        const finalStoreProducts = filteredStoreProducts.filter(storeProduct => {
          const hasSameNameWithOrderUrl = updatedSavedProducts.some(savedProduct => 
            savedProduct.name === storeProduct.name && savedProduct.supplier?.order_url
          );
          return !hasSameNameWithOrderUrl;
        });
        
        const allProducts = [...finalStoreProducts, ...updatedSavedProducts];
        setProducts(allProducts);
        setFilteredProducts(allProducts);
        
        return updatedSavedProducts;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">在庫管理</h1>
          <p className="text-gray-600">商品の在庫状況を管理します</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setIsScannerMounted(true);
              setShowScanner(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Camera className="h-4 w-4 mr-2" />
            スキャン
          </button>
        <button 
          onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
        >
            <Plus className="h-4 w-4 mr-2" />
            商品追加
        </button>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 検索バー */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="商品名またはバーコードで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* カテゴリーフィルター */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'すべてのカテゴリー' : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">総商品数</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredProducts.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">在庫不足・期限切れ</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredProducts.filter(p => {
                  if (isExpired(p)) return true; // 期限切れ商品は在庫不足に含める
                  const status = getProductStatus(p.inventory?.current_stock || 0, p.inventory?.minimum_stock || 0, p.inventory?.maximum_stock || 0);
                  return status === 'low' || status === 'critical';
                }).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">在庫良好・過多</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredProducts.filter(p => {
                  if (isExpired(p)) return false; // 期限切れ商品は除外
                  const status = getProductStatus(p.inventory?.current_stock || 0, p.inventory?.minimum_stock || 0, p.inventory?.maximum_stock || 0);
                  return status === 'good' || status === 'excess';
                }).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">在庫総額</p>
          <p className="text-2xl font-bold text-gray-900">
                ¥{filteredProducts.reduce((sum, p) => sum + ((p.inventory?.current_stock || 0) * p.price), 0).toLocaleString()}
          </p>
            </div>
          </div>
        </div>
      </div>

      {/* 商品一覧 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">商品一覧</h3>
        </div>
        
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>該当する商品が見つかりませんでした</p>
          </div>
        ) : isMobile ? (
          // モバイル用カード表示
          <div className="p-4 space-y-4">
            {filteredProducts.map((product) => {
              const currentStock = product.inventory?.current_stock || 0;
              const minStock = product.inventory?.minimum_stock || 0;
              const maxStock = product.inventory?.maximum_stock || 0;
              const expired = isExpired(product);
              const status = expired ? 'expired' : getProductStatus(currentStock, minStock, maxStock);

              return (
                <div key={product.barcode || product.id} className={`bg-white border rounded-lg p-4 shadow-sm ${!product.supplier?.order_url ? 'border-red-200 bg-red-50' : 'border-gray-200'} ${expired ? 'border-red-300 bg-red-100' : ''}`}>
                  {/* 商品名とカテゴリ */}
                  <div className="mb-3">
                    <h4 className={`font-semibold text-lg ${!product.supplier?.order_url ? 'text-red-600' : 'text-gray-900'} ${expired ? 'text-red-800' : ''}`}>
                      {product.name}
                      {!product.supplier?.order_url && (
                        <span className="ml-2 text-xs text-red-500">(発注URL未設定)</span>
                      )}
                      {expired && (
                        <span className="ml-2 text-xs text-red-600">(期限切れ)</span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600">{product.category}</p>
                  </div>

                  {/* 在庫状況 */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">在庫状況</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                        {getStatusText(status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {expired ? '期限切れ' : `${currentStock}/${maxStock}`}
                    </p>
                  </div>

                  {/* 価格情報 */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">販売価格</p>
                      <p className="font-medium">¥{product.price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">仕入れ値</p>
                      <p className="font-medium">¥{product.cost.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* バーコード */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500">バーコード</p>
                    <p className="text-sm font-mono">{product.barcode || '未設定'}</p>
                  </div>

                  {/* 操作ボタン */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowProductDetail(true);
                      }}
                      className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg border border-indigo-500 shadow-sm hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-1"
                    >
                      <span>詳細</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowEditModal(true);
                      }}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg border border-blue-500 shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                    >
                      <span>編集</span>
                    </button>
                    {product.supplier?.order_url ? (
                      <button
                        onClick={() => handleOrder(product)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg border border-green-500 shadow-sm hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
                      >
                        <span>発注</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex-1 px-3 py-2 bg-gray-400 text-white text-sm font-medium rounded-lg border border-gray-300 shadow-sm cursor-not-allowed flex items-center justify-center space-x-1"
                      >
                        <span>発注不可</span>
                      </button>
                    )}
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg border border-red-500 shadow-sm hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // デスクトップ用テーブル表示
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">カテゴリー</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">在庫状況</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">販売価格</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">仕入れ値</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">バーコード</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const currentStock = product.inventory?.current_stock || 0;
                  const minStock = product.inventory?.minimum_stock || 0;
                  const maxStock = product.inventory?.maximum_stock || 0;
                  const expired = isExpired(product);
                  const status = expired ? 'expired' : getProductStatus(currentStock, minStock, maxStock);

                  return (
                    <tr key={product.barcode || product.id} className={`hover:bg-gray-50 ${!product.supplier?.order_url ? 'bg-red-50' : ''} ${expired ? 'bg-red-100' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${!product.supplier?.order_url ? 'text-red-600' : 'text-gray-900'} ${expired ? 'text-red-800' : ''}`}>
                          {product.name}
                          {!product.supplier?.order_url && (
                            <span className="ml-2 text-xs text-red-500">(発注URL未設定)</span>
                          )}
                          {expired && (
                            <span className="ml-2 text-xs text-red-600 font-bold">(期限切れ)</span>
                          )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${!product.supplier?.order_url ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {status === 'expired' && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {status === 'low' && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {status === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {status === 'good' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {getStatusText(status)}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {expired ? '期限切れ' : `${currentStock}個 / ${maxStock}個`}
                      </span>
                    </div>
                  </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${!product.supplier?.order_url ? 'text-red-600' : 'text-gray-900'} ${expired ? 'text-red-800' : ''}`}>
                    ¥{product.price.toLocaleString()}
                  </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${!product.supplier?.order_url ? 'text-red-600' : 'text-gray-900'} ${expired ? 'text-red-800' : ''}`}>
                        ¥{product.cost.toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${!product.supplier?.order_url ? 'text-red-500' : 'text-gray-500'} ${expired ? 'text-red-600' : ''}`}>
                        {product.barcode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowProductDetail(true);
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg border border-indigo-500 shadow-sm hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                          >
                            <span>詳細</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                      </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowEditModal(true);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg border border-blue-500 shadow-sm hover:bg-blue-700 transition-colors flex items-center space-x-2"
                          >
                            <span>編集</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                      </button>
                          <button
                            onClick={() => handleOrder(product)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg border shadow-sm transition-colors flex items-center space-x-2 ${
                              expired || !product.supplier?.order_url
                                ? 'bg-gray-300 text-gray-600 border-gray-400 cursor-not-allowed' 
                                : 'bg-green-600 text-white border-green-500 hover:bg-green-700'
                            }`}
                            disabled={expired || !product.supplier?.order_url}
                          >
                            <span>{expired ? '期限切れ' : '発注'}</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                      </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg border border-red-500 shadow-sm hover:bg-red-700 transition-colors flex items-center space-x-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>削除</span>
                      </button>
                    </div>
                  </td>
                </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* 商品追加モーダル */}
      {showAddModal && (
        <ProductForm
          isOpen={showAddModal}
          storeId={currentStore?.id || '1'}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
          }}
          suppliers={suppliers}
          onSupplierAdded={(newSupplier: Supplier) => {
            setSuppliers([...suppliers, newSupplier]);
          }}
          onProductSaved={handleProductSaved}
        />
      )}

      {/* 商品編集モーダル */}
      {showEditModal && (
        <ProductForm
          isOpen={showEditModal}
          storeId={currentStore?.id || '1'}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
          }}
          initialData={selectedProduct}
          suppliers={suppliers}
          onSupplierAdded={(newSupplier: Supplier) => {
            setSuppliers([...suppliers, newSupplier]);
          }}
          onProductSaved={handleProductSaved}
        />
      )}

      {/* 商品詳細モーダル */}
      {showProductDetail && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">商品詳細</h2>
            <button 
                onClick={() => setShowProductDetail(false)}
                className="text-gray-400 hover:text-gray-600"
            >
                <X className="h-6 w-6" />
            </button>
            </div>

            <div className="space-y-4">
              {/* 商品情報 */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedProduct.name}</h3>
                <span className="inline-block px-3 py-1 text-sm font-medium rounded-full border bg-gray-100 text-gray-800">
                  {selectedProduct.category}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">販売価格</p>
                  <p className="text-lg font-bold text-gray-900">¥{selectedProduct.price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">仕入れ値</p>
                  <p className="text-lg font-bold text-gray-900">¥{selectedProduct.cost.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">在庫状況</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedProduct.inventory?.current_stock || 0}個
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">バーコード</p>
                <p className="text-sm font-mono text-gray-900">{selectedProduct.barcode}</p>
              </div>

              {/* 供給元情報 */}
              <div>
                <p className="text-sm text-gray-600">供給元</p>
                <p className="text-lg font-bold text-gray-900">{selectedProduct.supplier?.name || '未設定'}</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* バーコードスキャナーモーダル */}
      {isScannerMounted ? (
        <BarcodeScanner
          key={`scanner-${currentStore?.id || 'default'}`}
          scannerId={`inventory-scanner-${currentStore?.id || 'default'}`}
          isOpen={showScanner}
          onClose={() => {
            console.log('Inventory: Closing scanner');
            setShowScanner(false);
            // 少し遅延してアンマウント
            setTimeout(() => {
              setIsScannerMounted(false);
            }, 300);
          }}
          onScan={handleBarcodeScan}
        />
      ) : null}
    </div>
  );
};

export default Inventory;