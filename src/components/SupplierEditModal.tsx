import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Settings, Save, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface SupplierEditModalProps {
  supplier: any;
  onClose: () => void;
  onSave: (supplierData: any) => void;
}

const SupplierEditModal: React.FC<SupplierEditModalProps> = ({
  supplier,
  onClose,
  onSave
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm();

  useEffect(() => {
    if (supplier) {
      setValue('name', supplier.name);
      setValue('contact_person', supplier.contact_person);
      setValue('email', supplier.email);
      setValue('phone', supplier.phone);
      setValue('address', supplier.address);
      setValue('order_url', supplier.order_url);
      setValue('category', supplier.category);
    }
  }, [supplier, setValue]);

  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      
      const updatedSupplier = {
        ...supplier,
        ...data,
        updated_at: new Date().toISOString()
      };
      
      onSave(updatedSupplier);
    } catch (error: any) {
      console.error('Error updating supplier:', error);
      toast.error(error.message || '供給元の更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">供給元を編集</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 供給元名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              供給元名 <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name', { required: '供給元名は必須です' })}
              type="text"
              placeholder="供給元名を入力"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.name.message}
              </p>
            )}
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリ
            </label>
            <select
              {...register('category')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">カテゴリを選択</option>
              <option value="飲み物">飲み物</option>
              <option value="パン類">パン類</option>
              <option value="乳製品">乳製品</option>
              <option value="主食">主食</option>
              <option value="冷凍食品">冷凍食品</option>
              <option value="お菓子">お菓子</option>
              <option value="調味料">調味料</option>
              <option value="野菜">野菜</option>
              <option value="肉類">肉類</option>
              <option value="魚類">魚類</option>
              <option value="その他">その他</option>
            </select>
          </div>

          {/* 発注URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              発注URL
            </label>
            <input
              {...register('order_url')}
              type="url"
              placeholder="https://example.com/order"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 担当者名と電話番号 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                担当者名
              </label>
              <input
                {...register('contact_person')}
                type="text"
                placeholder="担当者名を入力"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                電話番号
              </label>
              <input
                {...register('phone')}
                type="tel"
                placeholder="03-1234-5678"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* メールアドレス */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="contact@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 住所 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              住所
            </label>
            <textarea
              {...register('address')}
              rows={3}
              placeholder="住所を入力"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* ボタン */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isLoading ? '保存中...' : '保存'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierEditModal;

