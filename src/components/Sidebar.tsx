import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';
import {
  Home,
  Package,
  ShoppingCart,
  Clock,
  BarChart3,
  MessageCircle,
  Settings,
  X,
  Store
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { currentStore } = useStore();
  const [unreadChatCount, setUnreadChatCount] = useState(3); // デモ用の未読チャット数

  // 店舗ごとの通知数
  const getStoreNotifications = (storeId: string) => {
    const notifications = {
      '550e8400-e29b-41d4-a716-446655440001': { // 本店
        inventory: 3, // 在庫不足商品
        orders: 6,    // 未処理注文
        expiration: 3 // 期限切れ警告
      },
      '550e8400-e29b-41d4-a716-446655440002': { // 支店
        inventory: 3, // 在庫不足商品
        orders: 12,   // 未処理注文
        expiration: 7 // 期限切れ警告
      },
      '550e8400-e29b-41d4-a716-446655440003': { // 名古屋店
        inventory: 2, // 在庫不足商品
        orders: 9,    // 未処理注文
        expiration: 4 // 期限切れ警告
      }
    };
    return notifications[storeId as keyof typeof notifications] || notifications['550e8400-e29b-41d4-a716-446655440001'];
  };

  const storeNotifications = getStoreNotifications(currentStore?.id || '550e8400-e29b-41d4-a716-446655440001');

  const menuItems = [
    { path: '/', icon: Home, label: 'ダッシュボード' },
    { path: '/inventory', icon: Package, label: '在庫管理', hasNotification: true, notificationCount: storeNotifications.inventory },
    { path: '/orders', icon: ShoppingCart, label: '注文管理', hasNotification: true, notificationCount: storeNotifications.orders },
    { path: '/expiration', icon: Clock, label: '消費期限', hasNotification: true, notificationCount: storeNotifications.expiration },
    { path: '/analytics', icon: BarChart3, label: '売れ筋分析' },
    { path: '/chat', icon: MessageCircle, label: 'チャット', hasNotification: true, notificationCount: unreadChatCount },
    { path: '/settings', icon: Settings, label: '設定' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-teal-200 bg-gradient-to-r from-teal-50 to-orange-50">
          <div className="flex items-center space-x-2">
            <Store className="h-8 w-8 text-teal-600" />
            <h1 className="text-xl font-bold text-gray-900">商品管理</h1>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-teal-600 hover:text-teal-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  onClose();
                  // 各ページに移動したら通知をクリア（デモ用）
                  if (item.hasNotification) {
                    if (item.path === '/chat') {
                      setUnreadChatCount(0);
                    }
                    // 他の通知もクリアする場合はここに追加
                  }
                }}
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 border-r-4 border-teal-700'
                    : 'text-gray-600 hover:bg-orange-50 hover:text-orange-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
                {item.hasNotification && item.notificationCount > 0 && (
                  <span className="bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {item.notificationCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;