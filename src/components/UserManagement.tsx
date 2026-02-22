import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Save, X, Shield, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User, Store } from '../types/database';
import toast from 'react-hot-toast';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'staff',
    store_id: '',
    phone: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResult, storesResult] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('stores').select('*').order('name')
      ]);

      if (usersResult.error) throw usersResult.error;
      if (storesResult.error) throw storesResult.error;

      setUsers(usersResult.data || []);
      setStores(storesResult.data || []);
    } catch (error) {
      console.error('データ取得エラー:', error);
      toast.error('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({
      name: '',
      email: '',
      role: 'staff',
      store_id: stores[0]?.id || '',
      phone: '',
      is_active: true
    });
    setShowAddModal(true);
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setFormData(user);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.store_id) {
      toast.error('必須項目を入力してください');
      return;
    }

    try {
      if (editingId) {
        // 更新
        const { error } = await supabase
          .from('users')
          .update({
            name: formData.name,
            role: formData.role,
            store_id: formData.store_id,
            phone: formData.phone,
            is_active: formData.is_active
          })
          .eq('id', editingId);

        if (error) throw error;
        toast.success('ユーザー情報を更新しました');
      } else {
        // 新規追加
        const { error } = await supabase
          .from('users')
          .insert([{
            name: formData.name,
            email: formData.email,
            role: formData.role,
            store_id: formData.store_id,
            phone: formData.phone,
            is_active: formData.is_active
          }]);

        if (error) throw error;
        toast.success('ユーザーを追加しました');
        setShowAddModal(false);
      }

      setEditingId(null);
      setFormData({ name: '', email: '', role: 'staff', store_id: '', phone: '', is_active: true });
      fetchData();
    } catch (error: any) {
      console.error('保存エラー:', error);
      if (error.code === '23505') {
        toast.error('このメールアドレスは既に使用されています');
      } else {
        toast.error('保存に失敗しました');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('本当にこのユーザーを削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('ユーザーを削除しました');
      fetchData();
    } catch (error) {
      console.error('削除エラー:', error);
      toast.error('削除に失敗しました');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddModal(false);
    setFormData({ name: '', email: '', role: 'staff', store_id: '', phone: '', is_active: true });
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: { color: 'bg-red-100 text-red-800', label: '管理者' },
      manager: { color: 'bg-blue-100 text-blue-800', label: '店長' },
      staff: { color: 'bg-green-100 text-green-800', label: 'スタッフ' }
    };
    const badge = badges[role as keyof typeof badges] || badges.staff;
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const getStoreName = (storeId: string) => {
    return stores.find(s => s.id === storeId)?.name || '不明';
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
          <Users className="h-6 w-6 text-indigo-600" />
          ユーザー管理
        </h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5" />
          ユーザー追加
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ユーザー名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                メールアドレス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                権限
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                所属店舗
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                電話番号
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状態
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === user.id ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === user.id ? (
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                      className="px-2 py-1 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="staff">スタッフ</option>
                      <option value="manager">店長</option>
                      <option value="admin">管理者</option>
                    </select>
                  ) : (
                    getRoleBadge(user.role)
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === user.id ? (
                    <select
                      value={formData.store_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, store_id: e.target.value }))}
                      className="px-2 py-1 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {stores.map(store => (
                        <option key={store.id} value={store.id}>{store.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm text-gray-900">{getStoreName(user.store_id)}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === user.id ? (
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <div className="text-sm text-gray-500">{user.phone || '-'}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === user.id ? (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active !== false}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">有効</span>
                    </label>
                  ) : (
                    <span className={`text-sm ${user.is_active !== false ? 'text-green-600' : 'text-gray-400'}`}>
                      {user.is_active !== false ? '有効' : '無効'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingId === user.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={handleSave}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Save className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 新規追加モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">新しいユーザーを追加</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  名前 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  権限 *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="staff">スタッフ</option>
                  <option value="manager">店長</option>
                  <option value="admin">管理者</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所属店舗 *
                </label>
                <select
                  value={formData.store_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, store_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          権限について
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li><strong>管理者:</strong> すべての機能と設定にアクセス可能</li>
          <li><strong>店長:</strong> 所属店舗のデータ管理と発注が可能</li>
          <li><strong>スタッフ:</strong> 在庫確認と基本的な入出力のみ可能</li>
        </ul>
      </div>
    </div>
  );
};

export default UserManagement;
