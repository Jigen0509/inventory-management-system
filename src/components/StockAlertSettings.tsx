import React, { useState, useEffect } from 'react';
import { AlertTriangle, Save, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../contexts/StoreContext';
import { Product, Inventory } from '../types/database';
import toast from 'react-hot-toast';

interface InventoryWithProduct extends Inventory {
  product?: Product;
}

const StockAlertSettings: React.FC = () => {
  const { currentStore } = useStore();
  const [inventories, setInventories] = useState<InventoryWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<{ reorder_point?: number; reorder_quantity?: number }>({});

  useEffect(() => {
    if (currentStore) {
      fetchInventories();
    }
  }, [currentStore]);

  const fetchInventories = async () => {
    if (!currentStore) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventories')
        .select(`
          *,
          product:products(*)
        `)
        .eq('store_id', currentStore.id)
        .order('current_stock', { ascending: true });

      if (error) throw error;
      setInventories(data || []);
    } catch (error) {
      console.error('在庫情報の取得エラー:', error);
      toast.error('在庫情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (inventory: InventoryWithProduct) => {
    setEditingId(inventory.id);
    setTempValues({
      reorder_point: inventory.reorder_point || inventory.minimum_stock,
      reorder_quantity: inventory.reorder_quantity || 10
    });
  };

  const handleSave = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inventories')
        .update({
          reorder_point: tempValues.reorder_point || 0,
          reorder_quantity: tempValues.reorder_quantity || 0
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('在庫アラート設定を更新しました');
      setEditingId(null);
      setTempValues({});
      fetchInventories();
    } catch (error) {
      console.error('更新エラー:', error);
      toast.error('更新に失敗しました');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setTempValues({});
  };

  const filteredInventories = inventories.filter(inv =>
    inv.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.product?.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!currentStore) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">店舗を選択してください</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-yellow-600" />
          在庫アラート基準設定
        </h2>
        <div className="text-sm text-gray-500">
          店舗: {currentStore.name}
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="商品名またはカテゴリで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                商品名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                カテゴリ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                現在庫
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                発注基準点
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                推奨発注数
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInventories.map((inventory) => {
              const isLowStock = inventory.current_stock <= (inventory.reorder_point || inventory.minimum_stock);
              
              return (
                <tr 
                  key={inventory.id} 
                  className={`hover:bg-gray-50 ${isLowStock ? 'bg-red-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {isLowStock && (
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                      )}
                      <div className="text-sm font-medium text-gray-900">
                        {inventory.product?.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {inventory.product?.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                      {inventory.current_stock} {inventory.product?.unit || '個'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === inventory.id ? (
                      <input
                        type="number"
                        min="0"
                        value={tempValues.reorder_point || 0}
                        onChange={(e) => setTempValues(prev => ({ ...prev, reorder_point: parseInt(e.target.value) }))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">
                        {inventory.reorder_point || inventory.minimum_stock} {inventory.product?.unit || '個'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === inventory.id ? (
                      <input
                        type="number"
                        min="0"
                        value={tempValues.reorder_quantity || 0}
                        onChange={(e) => setTempValues(prev => ({ ...prev, reorder_quantity: parseInt(e.target.value) }))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">
                        {inventory.reorder_quantity || 10} {inventory.product?.unit || '個'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === inventory.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSave(inventory.id)}
                          className="text-green-600 hover:text-green-900 flex items-center gap-1"
                        >
                          <Save className="h-4 w-4" />
                          保存
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          キャンセル
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(inventory)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        編集
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-yellow-900 mb-2">設定のヒント</h3>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>発注基準点: 在庫がこの数を下回ると発注候補として表示されます</li>
          <li>推奨発注数: 発注時に自動的に提案される数量です</li>
          <li>赤背景の行は現在在庫が基準点を下回っている商品です</li>
        </ul>
      </div>
    </div>
  );
};

export default StockAlertSettings;
