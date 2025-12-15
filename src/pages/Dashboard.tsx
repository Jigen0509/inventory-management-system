import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { allProducts } from '../data/products';
import { db, supabase } from '../lib/supabase';
import { 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  TrendingUp,
  Bell,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface LocalOrder {
  id: string;
  status: string;
}

interface LocalProduct {
  id: string;
  name: string;
  category: string;
}

interface LocalInventory {
  product_id: string;
  current_stock: number;
  minimum_stock: number;
  expiration_date?: string;
}

interface SalesRecord {
  total_amount: number | null;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  inventory?: {
    current_stock: number;
    minimum_stock: number;
    expiration_date?: string;
  };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentStore } = useStore();
  const { user, isDatabaseMode } = useAuth();
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [todaySalesAmount, setTodaySalesAmount] = useState(0);

  // 発注中の商品と本日の売上を取得
  useEffect(() => {
    const loadStoreMetrics = async () => {
      try {
        const storeId = currentStore?.id || user?.store_id;
        
        if (!storeId) {
          setPendingOrdersCount(0);
          setTodaySalesAmount(0);
          return;
        }
        
        if (isDatabaseMode) {
          const { data: orders, error: ordersError } = await db.getOrders(storeId);
          if (!ordersError && orders) {
            const count = orders.filter((o) => o.status === 'pending' || o.status === 'draft').length;
            setPendingOrdersCount(count);
          } else {
            setPendingOrdersCount(0);
          }
          
          // 本日の売上を取得
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const { data: sales, error: salesError } = await supabase
            .from('sales')
            .select('total_amount')
            .eq('store_id', storeId)
            .gte('sales_date', today.toISOString())
            .eq('status', 'confirmed');
          
          if (!salesError && sales) {
            const total = sales.reduce((sum: number, s: SalesRecord) => sum + (s.total_amount || 0), 0);
            setTodaySalesAmount(total);
          } else {
            setTodaySalesAmount(0);
          }
        } else {
          // デモモードではローカルストレージから取得
          const manualOrdersKey = `store_${storeId}_manual_orders`;
          const manualOrders = JSON.parse(localStorage.getItem(manualOrdersKey) || '[]') as LocalOrder[];
          const count = manualOrders.filter((o) => o.status === 'pending' || o.status === 'draft').length;
          setPendingOrdersCount(count);
          setTodaySalesAmount(0);
        }
      } catch (error) {
        console.error('Error getting store metrics:', error);
        setPendingOrdersCount(0);
        setTodaySalesAmount(0);
      }
    };

    loadStoreMetrics();
  }, [currentStore?.id, user?.store_id, isDatabaseMode]);

  // 在庫データを取得
  useEffect(() => {
    const loadInventoryData = async () => {
      try {
        // store_id を user から直接取得（currentStore が未ロードの場合に備える）
        const storeId = currentStore?.id || user?.store_id;
        
        if (!storeId) {
          console.warn('店舗IDが取得できません');
          return;
        }
        
        if (isDatabaseMode) {
          // データベースから在庫データを取得
          const { data: dbProducts, error } = await db.getProducts(storeId);
          
          if (error) {
            console.error('データベースからの在庫データ取得に失敗:', error);
            setInventoryData([]);
            return;
          }
          
          if (dbProducts) {
            setInventoryData(dbProducts);
          }
        } else {
          // ローカルストレージから在庫データを取得
          const storeId = currentStore?.id || user?.store_id || '1';
          const productsKey = `store_${storeId}_products`;
          const inventoriesKey = `store_${storeId}_inventories`;
          const storedProducts = JSON.parse(localStorage.getItem(productsKey) || '[]') as LocalProduct[];
          const storedInventories = JSON.parse(localStorage.getItem(inventoriesKey) || '[]') as LocalInventory[];
          
          // 商品と在庫情報を結合
          const productsWithInventory: InventoryItem[] = storedProducts.map((product) => {
            const inventory = storedInventories.find((inv) => inv.product_id === product.id);
            return { ...product, inventory };
          });
          
          setInventoryData(productsWithInventory);
        }
      } catch (error) {
        console.error('在庫データの読み込みに失敗しました:', error);
        setInventoryData([]);
      }
    };

    loadInventoryData();
  }, [currentStore?.id, user?.store_id, isDatabaseMode]);

  // 店舗ごとのデータ
  const getStoreData = (storeId: string) => {
    // 実際の在庫データから在庫不足商品を取得
    const getLowStockItems = () => {
      const lowStockItems = [];
      
      inventoryData.forEach(product => {
        if (product.inventory) {
          const current = product.inventory.current_stock || 0;
          const minimum = product.inventory.minimum_stock || 0;
          
          // 在庫不足: current < minimum かつ current > 0
          // 在庫切れ: current <= 0
          if (current < minimum) {
            lowStockItems.push({
              name: product.name,
              current: current,
              minimum: minimum,
              category: product.category,
              supplier: product.supplier,
              order_url: product.supplier?.order_url
            });
          }
        }
      });
      
      return lowStockItems; // 制限なし（UIで制限）
    };

    // 期限切れ商品を計算
    const getExpiredItems = () => {
      const today = new Date();
      let expiredCount = 0;
      
      inventoryData.forEach(product => {
        if (product.inventory?.expiration_date) {
          const expirationDate = new Date(product.inventory.expiration_date);
          if (expirationDate < today) {
            expiredCount++;
          }
        }
      });
      
      return expiredCount;
    };

    const lowStockItems = getLowStockItems();
    const totalProducts = inventoryData.length || allProducts.length;
    const expiredItems = getExpiredItems();

    const storeData = {
      '550e8400-e29b-41d4-a716-446655440001': { // 本店
        totalProducts: totalProducts,
        todaySales: `¥${todaySalesAmount.toLocaleString()}`,
        pendingOrders: pendingOrdersCount,
        expiredItems: expiredItems,
        lowStockItems: lowStockItems
      },
      '550e8400-e29b-41d4-a716-446655440002': { // 支店
        totalProducts: totalProducts,
        todaySales: `¥${todaySalesAmount.toLocaleString()}`,
        pendingOrders: pendingOrdersCount,
        expiredItems: expiredItems,
        lowStockItems: lowStockItems
      },
      '550e8400-e29b-41d4-a716-446655440003': { // 名古屋店
        totalProducts: totalProducts,
        todaySales: `¥${todaySalesAmount.toLocaleString()}`,
        pendingOrders: pendingOrdersCount,
        expiredItems: expiredItems,
        lowStockItems: lowStockItems
      }
    };
    return storeData[storeId as keyof typeof storeData] || storeData['550e8400-e29b-41d4-a716-446655440001'];
  };

  const storeData = getStoreData(currentStore?.id || '550e8400-e29b-41d4-a716-446655440001');

  const stats = [
    {
      title: '総商品数',
      value: storeData.totalProducts.toString(),
      change: '+12',
      trend: 'up',
      icon: Package,
      color: 'blue'
    },
    {
      title: '今日の売上',
      value: storeData.todaySales,
      change: '+8.2%',
      trend: 'up',
      icon: TrendingUp,
      color: 'green'
    },
    {
      title: '未処理注文',
      value: storeData.pendingOrders.toString(),
      change: '-2',
      trend: 'down',
      icon: ShoppingCart,
      color: 'orange',
      clickable: true,
      onClick: () => navigate('/orders')
    },
    {
      title: '期限切れ警告',
      value: storeData.expiredItems.toString(),
      change: '+1',
      trend: 'up',
      icon: AlertTriangle,
      color: 'red',
      clickable: true,
      onClick: () => navigate('/expiration')
    }
  ];

  const lowStockItems = storeData.lowStockItems;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-600">今日の店舗状況を確認しましょう</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString('ja-JP')}</p>
          <p className="text-lg font-semibold text-gray-900">{new Date().toLocaleDateString('ja-JP', { weekday: 'long' })}</p>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-teal-50 text-teal-600',
            green: 'bg-teal-50 text-teal-600',
            orange: 'bg-orange-50 text-orange-600',
            red: 'bg-orange-50 text-orange-600'
          };

          return (
            <div 
              key={index} 
              className={`bg-white rounded-xl shadow-sm p-6 border border-gray-100 ${
                stat.clickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
              }`}
              onClick={stat.onClick}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className={`flex items-center text-sm font-medium ${
                  stat.trend === 'up' ? 'text-teal-600' : 'text-orange-600'
                }`}>
                  {stat.trend === 'up' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* 在庫不足アラート */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">在庫不足商品</h3>
              <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium">
                {lowStockItems.length}件
              </span>
            </div>
          </div>
          <div className="p-6 space-y-4 max-h-80 overflow-y-auto">
            {lowStockItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {item.name}
                    {!item.order_url && <span className="text-orange-600 text-xs ml-2">(発注URL未設定)</span>}
                  </p>
                  <p className="text-sm text-gray-600">{item.category}</p>
                </div>
                <div className="text-right mr-3">
                  <p className="text-sm font-medium text-orange-600">
                    残り{item.current}個
                  </p>
                  <p className="text-xs text-gray-500">最小数: {item.minimum}個</p>
                </div>
                <div>
                  {item.order_url ? (
                    <button
                      onClick={() => window.open(item.order_url, '_blank')}
                      className="px-3 py-1 bg-teal-600 text-white text-xs rounded-md hover:bg-teal-700 transition-colors"
                    >
                      発注する
                    </button>
                  ) : (
                    <span className="px-3 py-1 bg-gray-300 text-gray-600 text-xs rounded-md">
                      発注不可
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 通知センター */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center space-x-3 mb-4">
          <Bell className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">本日の通知</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">処理待ち注文</p>
            <p className="text-lg font-semibold text-gray-900">{storeData.pendingOrders}件</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">本日期限切れ</p>
            <p className="text-lg font-semibold text-gray-900">{storeData.expiredItems}件</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;