import React, { useState } from 'react';
import { Menu, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import StoreSelector from './StoreSelector';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, signOut } = useAuth();
  const { currentStore, switchStore } = useStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadChatCount] = useState(3); // デモ用の未読チャット数
  
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
  const totalNotifications = storeNotifications.inventory + storeNotifications.orders + storeNotifications.expiration + unreadChatCount;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('ログアウトしました');
      navigate('/login');
    } catch {
      toast.error('ログアウトに失敗しました');
    }
  };

  // （不要関数削除）

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return '管理者';
      case 'manager': return '店長';
      case 'staff': return 'スタッフ';
      default: return 'ユーザー';
    }
  };

  return (
    <header className="bg-gradient-to-r from-teal-50 to-orange-50 shadow-sm border-b border-teal-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="lg:hidden relative p-2 rounded-md text-teal-600 hover:text-teal-800"
          >
            <Menu className="h-6 w-6" />
            {totalNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {totalNotifications}
              </span>
            )}
          </button>
          <div className="ml-4 lg:ml-0">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full text-sm font-bold mr-2">
                ✓
              </span>
              <span className="text-orange-500">O</span>
              <span className="text-orange-500">r</span>
              <span className="text-teal-500">derly</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* 店舗切り替え */}
          <StoreSelector
            currentStoreId={currentStore?.id || ''}
            onStoreChange={switchStore}
            showAddButton={user?.role === 'admin'}
          />
          
          
          {/* ユーザーメニュー */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-teal-50 transition-colors"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'ユーザー'}</p>
                <p className="text-xs text-gray-500">{getRoleText(user?.role || 'staff')}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                <User className="h-5 w-5 text-teal-600" />
              </div>
              <ChevronDown className="h-4 w-4 text-teal-600" />
            </button>

            {/* ドロップダウンメニュー */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-teal-200 py-1 z-50">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-teal-50"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  設定
                </button>
                <hr className="my-1" />
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-4 py-2 text-sm text-orange-600 hover:bg-orange-50"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  ログアウト
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* メニュー外クリックで閉じる */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
};

export default Header;