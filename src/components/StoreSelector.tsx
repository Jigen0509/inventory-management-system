import React, { useState, useEffect } from 'react';
import { Store, ChevronDown, Check, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import type { Store as StoreType } from '../types/database';

interface StoreSelectorProps {
  currentStoreId: string;
  onStoreChange: (storeId: string) => void;
  showAddButton?: boolean;
}

const StoreSelector: React.FC<StoreSelectorProps> = ({
  currentStoreId,
  onStoreChange,
  showAddButton = false
}) => {
  const { user } = useAuth();
  const [stores, setStores] = useState<StoreType[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    setIsLoading(true);
    try {
      // デモ用の店舗データ
      const demoStores = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: '本店',
          address: '東京都渋谷区道玄坂1-2-3',
          phone: '03-1234-5678'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: '支店',
          address: '大阪府大阪市北区梅田1-1-1',
          phone: '06-1234-5678'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: '名古屋店',
          address: '愛知県名古屋市中区栄1-1-1',
          phone: '052-123-4567'
        }
      ];
      setStores(demoStores);
    } catch (error) {
      console.error('Error loading stores:', error);
      toast.error('店舗の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStore = stores.find(store => store.id === currentStoreId);

  const handleStoreSelect = (storeId: string) => {
    onStoreChange(storeId);
    setIsOpen(false);
  };

  const handleAddStore = () => {
    // 店舗追加機能は後で実装
    toast.info('店舗追加機能は準備中です');
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
        <Store className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <Store className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-900">
          {currentStore?.name || '店舗を選択'}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <>
          {/* オーバーレイ */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* ドロップダウンメニュー */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                店舗を選択
              </p>
            </div>
            
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => handleStoreSelect(store.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Store className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{store.name}</p>
                    <p className="text-xs text-gray-500">{store.address}</p>
                  </div>
                </div>
                {store.id === currentStoreId && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}

            {showAddButton && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={handleAddStore}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">新しい店舗を追加</span>
                </button>
              </>
            )}

            {stores.length === 0 && (
              <div className="px-3 py-4 text-center">
                <Store className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">店舗が登録されていません</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StoreSelector;
