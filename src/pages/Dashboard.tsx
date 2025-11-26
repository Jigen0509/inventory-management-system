import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { allProducts } from '../data/products';
import { db } from '../lib/supabase';
import { 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  TrendingUp,
  Users,
  Bell,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentStore } = useStore();
  const { isDatabaseMode } = useAuth();
  const [unreadChatCount, setUnreadChatCount] = useState(3); // デモ用の未読チャット数
  const [inventoryData, setInventoryData] = useState<any[]>([]);

  // 在庫データを取得
  useEffect(() => {
    const loadInventoryData = async () => {
      try {
        if (isDatabaseMode) {
          // データベースから在庫データを取得
          const { data: dbProducts, error } = await db.getProducts(currentStore?.id || '');
          
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
          const savedProducts = JSON.parse(localStorage.getItem('savedProducts') || '[]');
          const storeProducts = JSON.parse(localStorage.getItem('storeProducts') || '[]');
          const allInventoryData = [...savedProducts, ...storeProducts];
          setInventoryData(allInventoryData);
        }
      } catch (error) {
        console.error('在庫データの読み込みに失敗しました:', error);
        setInventoryData([]);
      }
    };

    loadInventoryData();
  }, [currentStore?.id, isDatabaseMode]);

  // 店舗ごとのデータ
  const getStoreData = (storeId: string) => {
    // 実際の在庫データから在庫不足商品を取得
    const getLowStockItems = () => {
      const lowStockItems = [];
      
      inventoryData.forEach(product => {
        if (product.inventory) {
          const current = product.inventory.current_stock || 0;
          const minimum = product.inventory.minimum_stock || 0;
          
          if (current <= minimum && current > 0) {
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

    const lowStockItems = getLowStockItems();
    const totalProducts = inventoryData.length || allProducts.length;

    const storeData = {
      '550e8400-e29b-41d4-a716-446655440001': { // 本店
        totalProducts: totalProducts,
        todaySales: '¥52,800',
        pendingOrders: 6,
        expiredItems: 3,
        lowStockItems: lowStockItems
      },
      '550e8400-e29b-41d4-a716-446655440002': { // 支店
        totalProducts: totalProducts,
        todaySales: '¥38,500',
        pendingOrders: 12,
        expiredItems: 7,
        lowStockItems: lowStockItems
      },
      '550e8400-e29b-41d4-a716-446655440003': { // 名古屋店
        totalProducts: totalProducts,
        todaySales: '¥41,200',
        pendingOrders: 9,
        expiredItems: 4,
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

  // 店舗ごとの最近のアクティビティ
  const getRecentActivity = (storeId: string) => {
    const activities = {
      '550e8400-e29b-41d4-a716-446655440001': [ // 本店
        { time: '10:30', action: '商品入荷', detail: 'りんごジュース 12本追加', user: '田中さん' },
        { time: '09:45', action: '注文処理', detail: '注文#1234を発送済みに更新', user: '佐藤さん' },
        { time: '09:20', action: 'チャット', detail: '在庫確認の依頼が届きました', user: '山田さん' },
        { time: '08:50', action: '期限警告', detail: '食パン（3点）の消費期限が近づいています', user: 'システム' }
      ],
      '550e8400-e29b-41d4-a716-446655440002': [ // 支店
        { time: '11:15', action: '商品入荷', detail: 'お米（5kg） 20袋追加', user: '鈴木さん' },
        { time: '10:30', action: '注文処理', detail: '注文#5678を発送済みに更新', user: '高橋さん' },
        { time: '09:45', action: 'チャット', detail: '支店間移動の依頼が届きました', user: '本店' },
        { time: '09:00', action: '期限警告', detail: '冷凍うどん（5点）の消費期限が近づいています', user: 'システム' }
      ],
      '550e8400-e29b-41d4-a716-446655440003': [ // 名古屋店
        { time: '11:00', action: '商品入荷', detail: 'カップ麺 30個追加', user: '伊藤さん' },
        { time: '10:15', action: '注文処理', detail: '注文#9012を発送済みに更新', user: '中村さん' },
        { time: '09:30', action: 'チャット', detail: '名古屋店からの在庫確認依頼', user: '支店' },
        { time: '08:45', action: '期限警告', detail: 'お茶（8点）の消費期限が近づいています', user: 'システム' }
      ]
    };
    return activities[storeId as keyof typeof activities] || activities['550e8400-e29b-41d4-a716-446655440001'];
  };

  const recentActivity = getRecentActivity(currentStore?.id || '550e8400-e29b-41d4-a716-446655440001');

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* 最近のアクティビティ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">最近のアクティビティ</h3>
          </div>
          <div className="p-6 space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                  <p className="text-sm text-gray-600">{activity.detail}</p>
                  <p className="text-xs text-blue-600">{activity.user}</p>
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