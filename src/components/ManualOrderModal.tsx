import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Supplier } from '../types/database';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  onOrderCreated: () => void;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const ManualOrderModal: React.FC<ManualOrderModalProps> = ({
  isOpen,
  onClose,
  storeId,
  onOrderCreated
}) => {
  const { isDatabaseMode } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [expectedDelivery, setExpectedDelivery] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
      // デフォルトの納期を3日後に設定
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 3);
      setExpectedDelivery(defaultDate.toISOString().split('T')[0]);
      
      // 初期商品を1つ追加
      if (orderItems.length === 0) {
        addOrderItem();
      }
    }
  }, [isOpen]);

  const loadSuppliers = async () => {
    try {
      if (isDatabaseMode) {
        const { data: dbSuppliers, error } = await db.getSuppliers();
        if (error) {
          console.error('供給元データの取得に失敗:', error);
          return;
        }
        if (dbSuppliers) {
          setSuppliers(dbSuppliers);
        }
      } else {
        // デモ用の供給元データ（他のコンポーネントと一貫性を保つ）
        const demoSuppliers: Supplier[] = [
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
      console.error('供給元データの読み込みに失敗:', error);
    }
  };

  const addOrderItem = () => {
    const newItem: OrderItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      product_name: '',
      quantity: 1,
      unit_price: 1,
      total_price: 1
    };
    setOrderItems([...orderItems, newItem]);
  };

  const removeOrderItem = (itemId: string) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  const updateOrderItem = (itemId: string, field: keyof OrderItem, value: string | number) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          // 単価と数量は整数として扱う
          const quantity = typeof updatedItem.quantity === 'number' ? updatedItem.quantity : parseInt(String(updatedItem.quantity)) || 1;
          const unitPrice = typeof updatedItem.unit_price === 'number' ? updatedItem.unit_price : parseInt(String(updatedItem.unit_price)) || 1;
          updatedItem.total_price = quantity * unitPrice;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const createOrder = async () => {
    if (orderItems.length === 0) {
      toast.error('発注商品がありません');
      return;
    }

    if (!selectedSupplier) {
      toast.error('供給元を選択してください');
      return;
    }

    if (!expectedDelivery) {
      toast.error('納期を設定してください');
      return;
    }

    // 商品名が入力されているかチェック
    const hasEmptyItems = orderItems.some(item => !item.product_name.trim());
    if (hasEmptyItems) {
      toast.error('商品名を入力してください');
      return;
    }

    // 数量と単価が0でないかチェック
    const hasInvalidItems = orderItems.some(item => 
      item.quantity <= 0 || item.unit_price <= 0
    );
    if (hasInvalidItems) {
      toast.error('数量と単価は0より大きい値を入力してください');
      return;
    }

    setIsLoading(true);

    try {
      if (isDatabaseMode) {
        // データベースに発注を保存
        const orderData = {
          store_id: storeId,
          supplier_id: selectedSupplier,
          status: 'draft' as const,
          total_amount: calculateTotal(),
          order_date: new Date().toISOString(),
          expected_delivery: expectedDelivery,
          notes: notes,
          created_by: 'current-user-id' // 実際の実装では現在のユーザーIDを設定
        };

        const { data: newOrder, error: orderError } = await db.createOrder(orderData);
        
        if (orderError) {
          throw orderError;
        }

        if (newOrder) {
          // 発注商品を保存
          const orderItemsData = orderItems.map(item => ({
            order_id: newOrder.id,
            product_id: null, // 手動発注の場合は商品IDが不明
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          }));

          const { error: itemsError } = await db.createOrderItems(orderItemsData);
          
          if (itemsError) {
            throw itemsError;
          }
        }
      } else {
        // デモ用の発注作成処理 - ローカルストレージに保存
        const newOrder = {
          id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          store_id: storeId,
          supplier_id: selectedSupplier,
          status: 'draft',
          total_amount: calculateTotal(),
          order_date: new Date().toISOString(),
          expected_delivery: expectedDelivery,
          notes: notes,
          created_by: 'manual-user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: orderItems.map(item => ({
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            order_id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            product_id: null,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            created_at: new Date().toISOString(),
            product: {
              id: null,
              name: item.product_name,
              barcode: '',
              category: '手動発注',
              price: item.unit_price,
              cost: item.unit_price
            }
          })),
          supplier: suppliers.find(s => s.id === selectedSupplier) || {
            id: selectedSupplier,
            name: '不明な供給元',
            contact_person: '',
            email: '',
            phone: '',
            address: '',
            order_url: '',
            category: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        };

        // ローカルストレージに保存
        const existingOrders = JSON.parse(localStorage.getItem('manualOrders') || '[]');
        existingOrders.push(newOrder);
        localStorage.setItem('manualOrders', JSON.stringify(existingOrders));
      }

      toast.success('手動発注を作成しました');
      onOrderCreated();
      onClose();
    } catch (error: any) {
      console.error('Error creating manual order:', error);
      toast.error(error.message || '手動発注の作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">手動発注</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* 発注情報 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                供給元 <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">供給元を選択してください</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                納期希望 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                備考
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="備考を入力してください"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* 発注商品 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">発注商品</h3>
              <button
                onClick={addOrderItem}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>商品追加</span>
              </button>
            </div>

            <div className="space-y-3">
              {orderItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      商品名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.product_name}
                      onChange={(e) => updateOrderItem(item.id, 'product_name', e.target.value)}
                      placeholder="商品名を入力してください"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      数量 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateOrderItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      単価 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.unit_price}
                        onChange={(e) => updateOrderItem(item.id, 'unit_price', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="単価を入力"
                      />
                      <div className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg flex items-center">
                        <span className="text-sm text-gray-600">円</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        小計
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                        ¥{item.total_price.toLocaleString()}
                      </div>
                    </div>
                    {orderItems.length > 1 && (
                      <button
                        onClick={() => removeOrderItem(item.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 合計金額 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">合計金額</span>
              <span className="text-2xl font-bold text-blue-600">¥{calculateTotal().toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={createOrder}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? '作成中...' : '発注作成'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualOrderModal;
