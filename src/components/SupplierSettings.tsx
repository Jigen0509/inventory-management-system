import React, { useState, useEffect } from 'react';
import { Package, Save, Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Supplier } from '../types/database';
import toast from 'react-hot-toast';

const SupplierSettings: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({});

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('発注先の取得エラー:', error);
      toast.error('発注先情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setFormData(supplier);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleSave = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          minimum_order_amount: formData.minimum_order_amount || 0,
          lead_time_days: formData.lead_time_days || 0,
          notes: formData.notes || ''
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('発注先情報を更新しました');
      setEditingId(null);
      setFormData({});
      fetchSuppliers();
    } catch (error) {
      console.error('更新エラー:', error);
      toast.error('更新に失敗しました');
    }
  };

  const handleInputChange = (field: keyof Supplier, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="h-6 w-6 text-indigo-600" />
          発注先詳細設定
        </h2>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                発注先名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                連絡先
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                最低発注金額（円）
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                リードタイム（日）
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                備考
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                  <div className="text-sm text-gray-500">{supplier.category || '未分類'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{supplier.contact_person}</div>
                  <div className="text-sm text-gray-500">{supplier.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === supplier.id ? (
                    <input
                      type="number"
                      min="0"
                      value={formData.minimum_order_amount || 0}
                      onChange={(e) => handleInputChange('minimum_order_amount', parseFloat(e.target.value))}
                      className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <span className="text-sm text-gray-900">
                      {supplier.minimum_order_amount?.toLocaleString() || 0}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === supplier.id ? (
                    <input
                      type="number"
                      min="0"
                      value={formData.lead_time_days || 0}
                      onChange={(e) => handleInputChange('lead_time_days', parseInt(e.target.value))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{supplier.lead_time_days || 0}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === supplier.id ? (
                    <input
                      type="text"
                      value={formData.notes || ''}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="備考を入力"
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <span className="text-sm text-gray-500">{supplier.notes || '-'}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingId === supplier.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleSave(supplier.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Save className="h-5 w-5" />
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
                      onClick={() => handleEdit(supplier)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">設定のヒント</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>最低発注金額: この金額未満の発注は警告が表示されます</li>
          <li>リードタイム: 発注から納品までの日数を設定します</li>
          <li>備考: 発注時の注意事項などを記録できます</li>
        </ul>
      </div>
    </div>
  );
};

export default SupplierSettings;
