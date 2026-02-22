import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Package, Save, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ProductForm as ProductFormType, Supplier, Inventory, Product } from '../types/database';
import { searchProductByBarcode } from '../data/productMaster';
import { fetchYahooProductByJAN } from '../lib/yahooShoppingApi';
import { db } from '../lib/supabase';

// 編集時に使用する拡張型（idとinventoryを含む）
interface ProductFormWithDetails extends ProductFormType {
  id?: string;
  inventory?: Inventory;
  [key: string]: unknown;
}

// 保存後に返される商品データの型
interface SavedProductData extends Product {
  inventory?: Inventory;
  supplier?: Supplier;
}

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: ProductFormWithDetails | null;
  initialBarcode?: string;
  storeId: string;
  suppliers?: Supplier[];
  onSupplierAdded?: (supplier: Supplier) => void;
  onProductSaved?: (product: SavedProductData) => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  initialBarcode,
  storeId,
  suppliers: externalSuppliers,
  onSupplierAdded,
  onProductSaved
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    order_url: '',
  });
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<ProductFormType>();

  const watchedBarcode = watch('barcode');

  useEffect(() => {
    if (isOpen) {
      if (externalSuppliers) {
        setSuppliers(externalSuppliers);
      } else {
        loadSuppliers();
      }
    }
  }, [isOpen, externalSuppliers]);

  useEffect(() => {
    if (isOpen && suppliers.length > 0) {
      if (initialData) {
        // 編集モード
        const formData = initialData as ProductFormWithDetails;
        Object.keys(formData).forEach(key => {
          if (key !== 'supplier' && key !== 'inventory' && key !== 'id') {
            const value = formData[key];
            if (value !== undefined) {
              setValue(key as keyof ProductFormType, value as ProductFormType[keyof ProductFormType]);
            }
          }
        });
        
        // 供給元IDを設定
        if (initialData.supplier_id) {
          setValue('supplier_id', initialData.supplier_id);
        }
        
        // 在庫情報を設定
        const formDataWithInventory = initialData as ProductFormWithDetails;
        if (formDataWithInventory.inventory) {
          setValue('minimum_stock', formDataWithInventory.inventory.minimum_stock || 0);
          setValue('maximum_stock', formDataWithInventory.inventory.maximum_stock || 100);
        }
      } else {
        // 新規作成モード
        // initialBarcodeがある場合はresetしない（後でuseEffectでセットされるため）
        if (!initialBarcode) {
          reset();
        }
      }
    }
  }, [isOpen, initialData, setValue, reset, suppliers, initialBarcode]);

  const loadSuppliers = async () => {
    try {
      // デモ用の供給元データ
      const demoSuppliers = [
        {
          id: '650e8400-e29b-41d4-a716-446655440001',
          name: 'ABC商事',
          contact_person: '田中太郎',
          email: 'tanaka@abc-shouji.com',
          phone: '03-1111-2222',
          address: '東京都新宿区西新宿1-1-1',
          order_url: 'https://abc-shouji.com/order',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '650e8400-e29b-41d4-a716-446655440002',
          name: 'パン工房田中',
          contact_person: '田中花子',
          email: 'hanako@pan-tanaka.com',
          phone: '043-1111-2222',
          address: '千葉県千葉市美浜区1-1-1',
          order_url: 'https://jimoto-bokujou.com/order',
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setSuppliers(demoSuppliers);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      // エラーメッセージは1回だけ表示
      if (!localStorage.getItem('suppliersErrorShown')) {
        toast.error('供給元の読み込みに失敗しました');
        localStorage.setItem('suppliersErrorShown', 'true');
        setTimeout(() => {
          localStorage.removeItem('suppliersErrorShown');
        }, 5000);
      }
    }
  };

  const searchProductInfo = async (barcode: string) => {
    try {
      // 1. まずローカル商品マスタを検索
      const masterProduct = searchProductByBarcode(barcode);
      if (masterProduct) {
        toast.success(`商品が見つかりました: ${masterProduct.name}`);
        setValue('name', masterProduct.name);
        setValue('category', masterProduct.category);
        if (masterProduct.defaultCost) setValue('cost', masterProduct.defaultCost);
        if (masterProduct.description) {
          setValue('description', masterProduct.description);
        } else if (masterProduct.manufacturer) {
          setValue('description', `メーカー: ${masterProduct.manufacturer}`);
        }
        // カテゴリに応じてデフォルトの供給元を設定
        const categorySupplierMap: Record<string, string> = {
          '飲み物': '650e8400-e29b-41d4-a716-446655440004',
          'パン類': '650e8400-e29b-41d4-a716-446655440002',
          '乳製品': '650e8400-e29b-41d4-a716-446655440003',
          '主食': '650e8400-e29b-41d4-a716-446655440001',
          '冷凍食品': '650e8400-e29b-41d4-a716-446655440005',
          'お菓子': '650e8400-e29b-41d4-a716-446655440007',
          '調味料': '650e8400-e29b-41d4-a716-446655440006',
        };
        const supplierId = categorySupplierMap[masterProduct.category];
        if (supplierId) setValue('supplier_id', supplierId);
        setValue('minimum_stock', 10);
        setValue('maximum_stock', 50);
        return;
      }

      // 2. ローカルに無ければYahoo!ショッピングAPIで検索
      const yahooProduct = await fetchYahooProductByJAN(barcode);
      if (yahooProduct) {
        toast.success(`Yahoo!ショッピングから商品情報を取得しました: ${yahooProduct.name}`);
        setValue('name', yahooProduct.name || '');
        setValue('description', yahooProduct.description || '');
        setValue('category', yahooProduct.genreCategory?.name || '');
        // 画像やURLなど他にも必要ならここでセット可能
        setValue('minimum_stock', 10);
        setValue('maximum_stock', 50);
      } else {
        toast('新規商品として登録します。商品情報を入力してください。', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('Error searching product:', error);
      toast.error('商品情報の検索中にエラーが発生しました');
    }
  };

  // initialBarcodeが渡された時の処理
  useEffect(() => {
    if (isOpen && initialBarcode && !initialData && suppliers.length > 0) {
      // reset後にバーコードをセット
      reset();
      setTimeout(() => {
        setValue('barcode', initialBarcode);
        searchProductInfo(initialBarcode);
      }, 100);
    }
  }, [isOpen, initialBarcode, initialData, setValue, suppliers]);

  const onSubmit = async (data: ProductFormType) => {
    setIsLoading(true);
    
    // デバッグ: 送信されるデータを確認
    console.log('Form submission data:', {
      current_stock: data.current_stock,
      type: typeof data.current_stock,
      minimum_stock: data.minimum_stock,
      maximum_stock: data.maximum_stock
    });
    
    try {
      // 選択された供給元を取得
      const selectedSupplier = suppliers.find(s => s.id === data.supplier_id);

      // 新規作成時のみバーコード重複チェック
      if (!initialData && data.barcode) {
        const { data: existingProduct, error: checkError } = await db.getProductByBarcode(data.barcode);
        
        if (existingProduct) {
          toast.error(`このバーコード（${data.barcode}）は既に登録されています`);
          setIsLoading(false);
          return;
        }
        
        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116は「single()で結果が0件」エラーで、この場合は問題ない
          console.error('Barcode check error:', checkError);
          toast.error('バーコード確認中にエラーが発生しました');
          setIsLoading(false);
          return;
        }
      }

      if (initialData) {
        // 既存商品の更新
        const formWithDetails = initialData as ProductFormWithDetails;
        if (!formWithDetails.id) {
          toast.error('商品IDが見つかりません');
          setIsLoading(false);
          return;
        }
        
        const { error: updateError } = await db.updateProduct(formWithDetails.id, {
          name: data.name,
          barcode: data.barcode,
          category: data.category,
          cost: data.cost,
          supplier_id: data.supplier_id,
          description: data.description
        });

        if (updateError) {
          console.error('Error updating product:', updateError);
          toast.error('商品の更新に失敗しました');
          return;
        }

        // 在庫情報の更新
        if (formWithDetails.inventory?.id) {
          const { error: inventoryError } = await db.updateInventory(formWithDetails.inventory.id, {
            current_stock: data.current_stock || 0,
            minimum_stock: data.minimum_stock || 0,
            maximum_stock: data.maximum_stock || 100,
            expiration_date: data.expiration_date || undefined
          });

          if (inventoryError) {
            console.error('Error updating inventory:', inventoryError);
            toast.error('在庫情報の更新に失敗しました');
            return;
          }
        }

        toast.success('商品を正常に更新しました');
      } else {
        // 新規商品の作成
        const { data: newProduct, error: productError } = await db.createProduct({
          name: data.name,
          barcode: data.barcode,
          category: data.category,
          cost: data.cost,
          supplier_id: data.supplier_id,
          description: data.description
        });

        if (productError || !newProduct) {
          console.error('Error creating product:', productError);
          toast.error('商品の登録に失敗しました');
          return;
        }

        // 在庫情報の作成
        const inventoryData = {
          product_id: newProduct.id,
          store_id: storeId,
          current_stock: data.current_stock || 0,
          minimum_stock: data.minimum_stock || 0,
          maximum_stock: data.maximum_stock || 100,
          expiration_date: data.expiration_date || undefined,
          last_updated: new Date().toISOString()
        };
        
        console.log('Creating inventory with data:', inventoryData);
        
        const { data: newInventory, error: inventoryError } = await db.createInventory(inventoryData);

        if (inventoryError) {
          console.error('Error creating inventory:', inventoryError);
          toast.error('在庫情報の登録に失敗しました');
          return;
        }
        
        console.log('Created inventory response:', newInventory);

        // 親コンポーネントに通知
        if (onProductSaved && newProduct && newInventory) {
          const productWithData: SavedProductData = {
            ...newProduct,
            inventory: newInventory,
            supplier: selectedSupplier
          };
          onProductSaved(productWithData);
        }

        toast.success('商品を正常に登録しました');
      }

      onSuccess();
      onClose();
      reset();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('商品の保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-40">
        <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Package className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                {initialData ? '商品を編集' : '新しい商品を追加'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* バーコード */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                バーコード
              </label>
              <input
                {...register('barcode')}
                type="text"
                placeholder="バーコードを入力"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {watchedBarcode && (
                <p className="mt-1 text-sm text-green-600">
                  バーコード: {watchedBarcode}
                </p>
              )}
            </div>

            {/* 商品名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                商品名 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name', { required: '商品名は必須です' })}
                type="text"
                placeholder="商品名を入力"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* 在庫数 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                在庫数 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('current_stock', { required: '在庫数は必須です', valueAsNumber: true })}
                type="number"
                min={0}
                placeholder="現在の在庫数"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.current_stock && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.current_stock.message}
                </p>
              )}
            </div>

            {/* 賞味期限 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                賞味期限（任意）
              </label>
              <input
                {...register('expiration_date')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* カテゴリ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリ <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <select
                  {...register('category', { required: 'カテゴリは必須です' })}
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
                  <option value="その他">その他</option>
                </select>
                
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(!showCategoryForm)}
                  className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  {showCategoryForm ? 'カテゴリ選択に戻る' : '新しいカテゴリを追加'}
                </button>
                
                {showCategoryForm && (
                  <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                    <h4 className="font-medium text-gray-900">新しいカテゴリを追加</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        カテゴリ名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="新しいカテゴリ名を入力"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCategoryForm(false);
                          setNewCategory('');
                        }}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                      >
                        キャンセル
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (newCategory.trim()) {
                            // 新しいカテゴリをselectに追加（実際の実装では、カテゴリリストを管理する必要があります）
                            setValue('category', newCategory);
                            setShowCategoryForm(false);
                            setNewCategory('');
                            toast.success('新しいカテゴリを追加しました');
                          } else {
                            toast.error('カテゴリ名は必須です');
                          }
                        }}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        追加
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* 仕入れ値 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                仕入れ値 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('cost', { 
                  required: '仕入れ値は必須です',
                  valueAsNumber: true,
                  min: { value: 0, message: '仕入れ値は0以上である必要があります' }
                })}
                type="number"
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.cost && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.cost.message}
                </p>
              )}
            </div>

            {/* 供給元 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                供給元 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <select
                  {...register('supplier_id', { required: '供給元は必須です' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">供給元を選択</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                
                <button
                  type="button"
                  onClick={() => setShowSupplierForm(!showSupplierForm)}
                  className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  {showSupplierForm ? '供給元選択に戻る' : '新しい供給元を手動で追加'}
                </button>
                
                {showSupplierForm && (
                  <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                    <h4 className="font-medium text-gray-900">新しい供給元を追加</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          供給元名 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newSupplier.name}
                          onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                          placeholder="供給元名を入力"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      

                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        発注URL
                      </label>
                      <input
                        type="url"
                        value={newSupplier.order_url}
                        onChange={(e) => setNewSupplier({...newSupplier, order_url: e.target.value})}
                        placeholder="https://example.com/order"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          担当者名
                        </label>
                        <input
                          type="text"
                          value={newSupplier.contact_person}
                          onChange={(e) => setNewSupplier({...newSupplier, contact_person: e.target.value})}
                          placeholder="担当者名を入力"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          電話番号
                        </label>
                        <input
                          type="tel"
                          value={newSupplier.phone}
                          onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                          placeholder="03-1234-5678"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        メールアドレス
                      </label>
                      <input
                        type="email"
                        value={newSupplier.email}
                        onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                        placeholder="contact@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        住所
                      </label>
                      <textarea
                        value={newSupplier.address}
                        onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                        rows={2}
                        placeholder="住所を入力"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSupplierForm(false);
                              setNewSupplier({
                                name: '',
                                contact_person: '',
                                email: '',
                                phone: '',
                                address: '',
                                order_url: ''
                              });
                        }}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                      >
                        キャンセル
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (newSupplier.name.trim()) {
                            try {
                              setIsLoading(true);
                              
                              // デモモード: ローカルで供給元を作成
                              const newSupplierId = `demo-supplier-${Date.now()}`;
                              const savedSupplier: Supplier = {
                                id: newSupplierId,
                                name: newSupplier.name,
                                contact_person: newSupplier.contact_person || '',
                                email: newSupplier.email || '',
                                phone: newSupplier.phone || '',
                                address: newSupplier.address || '',
                                order_url: newSupplier.order_url || undefined,
                                // カテゴリは削除
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                              };
                              
                              setSuppliers([...suppliers, savedSupplier]);
                              setValue('supplier_id', savedSupplier.id);
                              setShowSupplierForm(false);
                              // 商品フォーム（バーコード等）はリセットしない
                              setNewSupplier({
                                name: '',
                                contact_person: '',
                                email: '',
                                phone: '',
                                address: '',
                                order_url: ''
                              });
                              
                              // 親コンポーネントに新しい供給元を通知
                              if (onSupplierAdded) {
                                onSupplierAdded(savedSupplier);
                              }
                              
                              toast.success('新しい供給元を追加しました');
                            } catch (error) {
                              console.error('Error creating supplier:', error);
                              toast.error('供給元の追加に失敗しました');
                            } finally {
                              setIsLoading(false);
                            }
                          } else {
                            toast.error('供給元名は必須です');
                          }
                        }}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        追加
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {errors.supplier_id && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.supplier_id.message}
                </p>
              )}
            </div>

            {/* 在庫設定 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">在庫設定</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最小在庫数
                  </label>
                  <input
                    {...register('minimum_stock', { 
                      min: { value: 0, message: '最小在庫数は0以上である必要があります' }
                    })}
                    type="number"
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    在庫がこの数を下回ると警告が表示されます
                  </p>
                  {errors.minimum_stock && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.minimum_stock.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最大在庫数
                  </label>
                  <input
                    {...register('maximum_stock', { 
                      min: { value: 0, message: '最大在庫数は0以上である必要があります' }
                    })}
                    type="number"
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    保管可能な最大在庫数（例：10個 / 100個の「100」部分）
                  </p>
                  {errors.maximum_stock && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.maximum_stock.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 説明 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                説明
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="商品の説明を入力（任意）"
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

    </>
  );
};

export default ProductForm;
