import React, { useState, useEffect, useCallback } from 'react';
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
import { searchProductByBarcode } from '../data/productMaster';

// デモ用のローカル型は本番運用では不要のため削除

const Inventory: React.FC = () => {
  const { currentStore } = useStore();
  const { isDatabaseMode } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | undefined>(undefined);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithInventory | null>(null);
  const [products, setProducts] = useState<ProductWithInventory[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithInventory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      const { data: dbSuppliers, error } = await db.getSuppliers();
      if (error) {
        console.error('データベースからの供給元取得に失敗:', error);
        throw error;
      }
      setSuppliers(dbSuppliers ?? []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setSuppliers([]);
    }
  };

  // 商品データを読み込み
  const loadProducts = async () => {
    try {
      setIsLoading(true);

      if (!currentStore?.id) {
        setProducts([]);
        setFilteredProducts([]);
        return;
      }

      // データベースから商品データを取得（本番専用）
      const { data: dbProducts, error } = await db.getProducts(currentStore.id);
      if (error) {
        console.error('データベースからの商品取得に失敗:', error);
        throw error;
      }

      const list = dbProducts ?? [];
      setProducts(list);
      setFilteredProducts(list);
    } catch (error) {
      console.error('商品の読み込みに失敗しました:', error);
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

  // デモ生成は削除済み（本番はDBデータのみ使用）

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
    if (current < min) return 'low';  // 最小在庫より少ない場合のみ「在庫不足」
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
      // 商品マスタデータベースから検索
      const masterProduct = searchProductByBarcode(barcode);
      
      if (masterProduct) {
        toast.success(`商品情報を自動入力: ${masterProduct.name}`);
      } else {
        toast('新規商品として追加します。商品情報を入力してください。', { icon: 'ℹ️' });
      }
      
      // 新規商品として追加
      setScannedBarcode(barcode);
      setShowAddModal(true);
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
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(error instanceof Error ? error.message : '商品の削除に失敗しました');
    }
  };

  const handleProductSaved = async () => {
    if (isDatabaseMode) {
      // データベースモードでは商品一覧を再読み込み
      await loadProducts();
    } else {
      // デモモードでもlocalStorageから最新データを読み込む
      await loadProducts();
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
                  const status = getProductStatus(
                    p.inventory?.current_stock || 0, 
                    p.inventory?.minimum_stock || 0, 
                    p.inventory?.maximum_stock || 0,
                    p.inventory?.expiration_date
                  );
                  return status === 'low' || status === 'critical' || status === 'expired';
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
                  const status = getProductStatus(
                    p.inventory?.current_stock || 0, 
                    p.inventory?.minimum_stock || 0, 
                    p.inventory?.maximum_stock || 0,
                    p.inventory?.expiration_date
                  );
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
                ¥{Math.floor(filteredProducts.reduce((sum, p) => sum + ((p.inventory?.current_stock || 0) * (p.cost || 0)), 0)).toLocaleString()}
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
                <div key={product.barcode || product.id} className={`bg-white border rounded-lg p-4 shadow-sm ${!product.supplier?.order_url ? 'border-gray-200 bg-gray-50' : 'border-gray-200'} ${expired ? 'border-red-300 bg-red-100' : ''}`}>
                  {/* 商品名とカテゴリ */}
                  <div className="mb-3">
                    <h4 className={`font-semibold text-lg ${!product.supplier?.order_url ? 'text-gray-700' : 'text-gray-900'} ${expired ? 'text-gray-600' : ''}`}>
                      {product.name}
                      {!product.supplier?.order_url && (
                        <span className="ml-2 text-xs text-gray-500">(発注URL未設定)</span>
                      )}
                      {expired && (
                        <span className="ml-2 text-xs text-gray-600">(期限切れ)</span>
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
                  <div className="mb-3">
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
                      className="px-3 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 shadow-sm hover:bg-gray-300 transition-colors flex items-center justify-center"
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
                    <tr key={product.barcode || product.id} className={`hover:bg-gray-50 ${!product.supplier?.order_url ? 'bg-gray-50' : ''} ${expired ? 'bg-red-100' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${!product.supplier?.order_url ? 'text-gray-700' : 'text-gray-900'} ${expired ? 'text-gray-600' : ''}`}>
                          {product.name}
                          {!product.supplier?.order_url && (
                            <span className="ml-2 text-xs text-gray-500">(発注URL未設定)</span>
                          )}
                          {expired && (
                            <span className="ml-2 text-xs text-gray-600 font-bold">(期限切れ)</span>
                          )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${!product.supplier?.order_url ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-800'}`}>
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
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${!product.supplier?.order_url ? 'text-gray-700' : 'text-gray-900'} ${expired ? 'text-gray-600' : ''}`}>
                        ¥{product.cost.toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${!product.supplier?.order_url ? 'text-gray-500' : 'text-gray-500'} ${expired ? 'text-gray-600' : ''}`}>
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
                            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 shadow-sm hover:bg-gray-300 transition-colors flex items-center space-x-2"
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
          initialBarcode={scannedBarcode}
          onClose={() => {
            setShowAddModal(false);
            setScannedBarcode(undefined);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setScannedBarcode(undefined);
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
          initialData={selectedProduct ? {
            id: selectedProduct.id,
            name: selectedProduct.name,
            barcode: selectedProduct.barcode,
            category: selectedProduct.category,
            cost: selectedProduct.cost,
            supplier_id: selectedProduct.supplier?.id || selectedProduct.supplier_id,
            description: selectedProduct.description,
            current_stock: selectedProduct.inventory?.current_stock || 0,
            minimum_stock: selectedProduct.inventory?.minimum_stock || 0,
            maximum_stock: selectedProduct.inventory?.maximum_stock || 0,
            expiration_date: selectedProduct.inventory?.expiration_date,
            inventory: selectedProduct.inventory,
          } : null}
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

              <div>
                <p className="text-sm text-gray-600">仕入れ値</p>
                <p className="text-lg font-bold text-gray-900">¥{selectedProduct.cost.toLocaleString()}</p>
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