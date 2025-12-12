import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Search, 
  Filter,
  CheckCircle,
  X,
  RefreshCw
} from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { allProducts } from '../data/products';
import { db } from '../lib/supabase';
import toast from 'react-hot-toast';

const Expiration: React.FC = () => {
  const { currentStore } = useStore();
  const { isDatabaseMode } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskLevel, setRiskLevel] = useState('all');
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 商品データを読み込み
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      
      let allInventoryData: any[] = [];
      
      if (isDatabaseMode) {
        // データベースから商品データを取得
        const { data: dbProducts, error } = await db.getProducts(currentStore?.id || '');
        
        if (error) {
          console.error('データベースからの商品取得に失敗:', error);
          throw error;
        }
        
        if (dbProducts) {
          allInventoryData = dbProducts;
        }
      } else {
        // 在庫管理と同じデータソースを使用
        const storeId = currentStore?.id || '1';
        const productsKey = `store_${storeId}_products`;
        const inventoriesKey = `store_${storeId}_inventories`;
        const storedProducts = JSON.parse(localStorage.getItem(productsKey) || '[]');
        const storedInventories = JSON.parse(localStorage.getItem(inventoriesKey) || '[]');
        
        // 商品と在庫情報を結合
        const productsWithInventory = storedProducts.map((product: any) => {
          const inventory = storedInventories.find((inv: any) => inv.product_id === product.id);
          return { ...product, inventory };
        });
        
        allInventoryData = productsWithInventory;
      }
      
      // 消費期限データを生成
      const expirationProducts = allInventoryData.map((product, index) => {
        const today = new Date();
        let expirationDate: Date;
        
        // データベースの消費期限データのみを使用
        if (product.inventory?.expiration_date) {
          expirationDate = new Date(product.inventory.expiration_date);
        } else {
          // 消費期限データがない場合は今日から30日後に設定（期限切れではない）
          expirationDate = new Date(today);
          expirationDate.setDate(today.getDate() + 30);
        }
        
        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        let riskLevel = 'low';
        if (daysUntilExpiration < 0) {
          riskLevel = 'expired';
        } else if (daysUntilExpiration <= 1) {
          riskLevel = 'critical';
        } else if (daysUntilExpiration <= 3) {
          riskLevel = 'high';
        } else if (daysUntilExpiration <= 7) {
          riskLevel = 'medium';
        }
        
        return {
          id: product.id,
          name: product.name,
          category: product.category,
          quantity: product.inventory?.current_stock || 0,
          expirationDate: expirationDate.toISOString().split('T')[0],
          daysUntilExpiration: daysUntilExpiration,
          riskLevel: riskLevel,
          supplier: product.supplier?.name || '未設定',
          batchNumber: `BATCH-${String(index + 1).padStart(3, '0')}`,
          location: `保管場所-${String(index % 10 + 1)}`
        };
      });
      
      setProducts(expirationProducts);
      
    } catch (error) {
      console.error('商品の読み込みに失敗しました:', error);
      
      // エラーメッセージの重複表示を防ぐ
      const errorShown = localStorage.getItem('expirationErrorShown');
      if (!errorShown) {
        toast.error('商品の読み込みに失敗しました');
        localStorage.setItem('expirationErrorShown', 'true');
        setTimeout(() => {
          localStorage.removeItem('expirationErrorShown');
        }, 5000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [currentStore?.id]);

  const riskLevels = [
    { key: 'all', label: 'すべて', color: 'gray' },
    { key: 'expired', label: '期限切れ', color: 'red' },
    { key: 'critical', label: '緊急（1日以内）', color: 'red' },
    { key: 'high', label: '注意（2-3日）', color: 'orange' },
    { key: 'medium', label: '要観察（4-7日）', color: 'yellow' },
    { key: 'low', label: '安全（1週間以上）', color: 'green' }
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'expired': return 'bg-red-100 text-red-700 border-red-300';
      case 'critical': return 'bg-red-100 text-red-600 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-600 border-green-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'expired':
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'high':
        return <Clock className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRisk = riskLevel === 'all' || product.riskLevel === riskLevel;
      return matchesSearch && matchesRisk;
    })
    .sort((a, b) => {
      // 優先順位: 期限切れ > 緊急 > 注意 > 要観察 > 安全
      const priorityOrder = {
        'expired': 1,
        'critical': 2,
        'high': 3,
        'medium': 4,
        'low': 5
      };
      
      const priorityA = priorityOrder[a.riskLevel as keyof typeof priorityOrder] || 6;
      const priorityB = priorityOrder[b.riskLevel as keyof typeof priorityOrder] || 6;
      
      // 優先順位でソート
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // 同じ優先順位の場合は、残り日数でソート（少ない順）
      return a.daysUntilExpiration - b.daysUntilExpiration;
    });

  const stats = {
    expired: products.filter(p => p.riskLevel === 'expired').length,
    critical: products.filter(p => p.riskLevel === 'critical').length,
    high: products.filter(p => p.riskLevel === 'high').length,
    medium: products.filter(p => p.riskLevel === 'medium').length,
    total: products.length
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric'
    });
  };

  // 処理済みにする
  const handleProcessed = (product: any) => {
    console.log('処理済み処理開始:', product);
    
    // 在庫から該当商品を除外
    const storeId = currentStore?.id || '1';
    const productsKey = `store_${storeId}_products`;
    const inventoriesKey = `store_${storeId}_inventories`;
    const storedProducts = JSON.parse(localStorage.getItem(productsKey) || '[]');
    const storedInventories = JSON.parse(localStorage.getItem(inventoriesKey) || '[]');
    
    console.log('保存済み商品:', storedProducts);
    console.log('保存済み在庫:', storedInventories);
    
    // 商品IDで一致する商品の在庫を更新
    const updatedProducts = storedProducts.map((p: any) => {
      if (p.id === product.id) {
        console.log('商品で一致:', p.name, '在庫を0に更新');
        return { ...p, inventory: { ...p.inventory, current_stock: 0 } };
      }
      return p;
    });
    
    const updatedInventories = storedInventories.map((inv: any) => {
      if (inv.product_id === product.id) {
        console.log('在庫で一致: product_id=' + product.id + ', 在庫を0に更新');
        return { ...inv, current_stock: 0 };
      }
      return inv;
    });
    
    console.log('更新後の商品:', updatedProducts);
    console.log('更新後の在庫:', updatedInventories);
    
    localStorage.setItem(productsKey, JSON.stringify(updatedProducts));
    localStorage.setItem(inventoriesKey, JSON.stringify(updatedInventories));
    
    // 商品一覧から除外
    setProducts(prev => prev.filter(p => p.id !== product.id));
    
    toast.success(`${product.name}を処理済みにしました`);
  };

  // 廃棄処理
  const handleDispose = (product: any) => {
    if (window.confirm(`${product.name}を廃棄処理しますか？\n\nこの操作は取り消せません。`)) {
      console.log('廃棄処理開始:', product);
      
      // 在庫から該当商品を除外
      const storeId = currentStore?.id || '1';
      const productsKey = `store_${storeId}_products`;
      const inventoriesKey = `store_${storeId}_inventories`;
      const storedProducts = JSON.parse(localStorage.getItem(productsKey) || '[]');
      const storedInventories = JSON.parse(localStorage.getItem(inventoriesKey) || '[]');
      
      console.log('保存済み商品:', storedProducts);
      console.log('保存済み在庫:', storedInventories);
      
      // 商品IDで一致する商品の在庫を更新
      const updatedProducts = storedProducts.map((p: any) => {
        if (p.id === product.id) {
          console.log('商品で一致:', p.name, '在庫を0に更新');
          return { ...p, inventory: { ...p.inventory, current_stock: 0 } };
        }
        return p;
      });
      
      const updatedInventories = storedInventories.map((inv: any) => {
        if (inv.product_id === product.id) {
          console.log('在庫で一致: product_id=' + product.id + ', 在庫を0に更新');
          return { ...inv, current_stock: 0 };
        }
        return inv;
      });
      
      console.log('更新後の商品:', updatedProducts);
      console.log('更新後の在庫:', updatedInventories);
      
      localStorage.setItem(productsKey, JSON.stringify(updatedProducts));
      localStorage.setItem(inventoriesKey, JSON.stringify(updatedInventories));
      
      // 商品一覧から除外
      setProducts(prev => prev.filter(p => p.id !== product.id));
      
      toast.success(`${product.name}を廃棄処理しました`);
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">消費期限管理</h1>
          <p className="text-gray-600">商品の消費期限を監視して、廃棄ロスを防ぎましょう</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors">
          <RefreshCw className="h-5 w-5" />
          <span>期限更新</span>
        </button>
      </div>

      {/* アラート統計 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-red-200 bg-red-50">
          <p className="text-sm text-red-600">期限切れ</p>
          <p className="text-2xl font-bold text-red-700">{stats.expired}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-red-200 bg-red-50">
          <p className="text-sm text-red-600">緊急（1日以内）</p>
          <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-orange-200 bg-orange-50">
          <p className="text-sm text-orange-600">注意（2-3日）</p>
          <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-yellow-200 bg-yellow-50">
          <p className="text-sm text-yellow-600">要観察（4-7日）</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.medium}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-600">総商品数</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
      </div>

      {/* 緊急アラート */}
      {(stats.expired > 0 || stats.critical > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="text-red-800 font-semibold">緊急対応が必要です</h3>
          </div>
          <p className="text-red-700 mt-1">
            {stats.expired > 0 && `期限切れ商品が${stats.expired}件、`}
            {stats.critical > 0 && `明日までに期限切れとなる商品が${stats.critical}件あります。`}
            すぐに確認・対応してください。
          </p>
        </div>
      )}

      {/* 検索・フィルター */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="商品名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select 
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {riskLevels.map(level => (
                <option key={level.key} value={level.key}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 商品一覧 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">期限管理商品一覧</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">商品データを読み込み中...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">消費期限管理対象の商品がありません</h3>
              <p className="text-gray-600">在庫管理で商品を追加すると、ここに表示されます。</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
            <div key={product.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-600">{product.category} • 数量: {product.quantity}個</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(product.riskLevel)}`}>
                    {getRiskIcon(product.riskLevel)}
                    <span className="ml-1">
                      {riskLevels.find(l => l.key === product.riskLevel)?.label}
                    </span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleProcessed(product)}
                    className="text-green-600 hover:text-green-800 p-2 rounded" 
                    title="処理済みにする"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDispose(product)}
                    className="text-red-600 hover:text-red-800 p-2 rounded" 
                    title="廃棄処理"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">消費期限</p>
                  <p className="font-medium text-lg">
                    {formatDate(product.expirationDate)}
                    {product.daysUntilExpiration === 0 && (
                      <span className="text-red-600 ml-2">（本日）</span>
                    )}
                    {product.daysUntilExpiration > 0 && (
                      <span className={`ml-2 ${product.daysUntilExpiration <= 3 ? 'text-red-600' : 'text-gray-600'}`}>
                        （{product.daysUntilExpiration}日後）
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">ロット番号</p>
                  <p className="font-medium">{product.batchNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">保管場所</p>
                  <p className="font-medium">{product.location}</p>
                </div>
                <div>
                  <p className="text-gray-500">供給元</p>
                  <p className="font-medium">{product.supplier}</p>
                </div>
              </div>

              {(product.riskLevel === 'expired' || product.riskLevel === 'critical') && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">推奨アクション</span>
                  </div>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                    {product.riskLevel === 'expired' ? (
                      <>
                        <li>即座に販売を停止してください</li>
                        <li>廃棄処理を行ってください</li>
                        <li>在庫システムから除外してください</li>
                      </>
                    ) : (
                      <>
                        <li>値引き販売を検討してください</li>
                        <li>従業員へ優先販売を依頼してください</li>
                        <li>お客様へのプロモーションを実施してください</li>
                      </>
                    )}
                  </ul>
                </div>
              )}
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Expiration;