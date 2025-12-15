import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ChevronDown, Plus, Search, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { supabase } from '../lib/supabase';
import { allProducts } from '../data/products';
import type { Menu, Recipe } from '../types/database';

// 型アサーション用ヘルパー
type MenuInsert = Omit<Menu, 'id' | 'created_at' | 'updated_at'>;
type MenuUpdate = Partial<Omit<Menu, 'id' | 'created_at' | 'updated_at'>>;
type RecipeInsert = Omit<Recipe, 'id' | 'created_at' | 'updated_at'>;

// Supabaseクエリのany型回避用
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAny = supabase as any;

// メニュー操作用のヘルパー関数
const menuOperations = {
  insert: async (data: MenuInsert) => {
    return await supabaseAny
      .from('menus')
      .insert(data)
      .select()
      .single();
  },
  update: async (id: string, data: MenuUpdate) => {
    return await supabaseAny
      .from('menus')
      .update(data)
      .eq('id', id);
  },
  select: async (storeId: string) => {
    return await supabaseAny
      .from('menus')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
  }
};

const recipeOperations = {
  insert: async (data: RecipeInsert | RecipeInsert[]) => {
    return await supabaseAny
      .from('recipes')
      .insert(data);
  },
  delete: async (id: string) => {
    return await supabaseAny
      .from('recipes')
      .delete()
      .eq('id', id);
  },
  select: async (menuIds: string[]) => {
    return await supabaseAny
      .from('recipes')
      .select('*')
      .in('menu_id', menuIds);
  }
};

interface LocalMenu {
  id: string;
  store_id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface LocalRecipe {
  id: string;
  menu_id: string;
  product_id: string;
  quantity_required: number;
  unit_id: string;
  product?: LocalProduct;
}

interface RecipeRow {
  id: string;
  menu_id: string;
  product_id: string;
  quantity_required: number;
  unit_id: string | null;
  unit?: string | null;
  product?: LocalProduct | LocalProduct[] | null;
}

interface LocalProduct {
  id: string;
  name: string;
  category: string;
  unit?: string;
  cost?: number;
  is_active?: boolean;
}

const MenuManagement: React.FC = () => {
  const { isDatabaseMode } = useAuth();
  const { currentStore } = useStore();

  const [menus, setMenus] = useState<LocalMenu[]>([]);
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [recipes, setRecipes] = useState<LocalRecipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedMenuForRecipe, setSelectedMenuForRecipe] = useState<LocalMenu | null>(null);
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    category: '副菜',
  });

  const [recipeForm, setRecipeForm] = useState({
    product_id: '',
    quantity_required: 1,
    unit_id: '',
  });

  const [createRecipes, setCreateRecipes] = useState<Array<{ product_id: string; quantity_required: number; unit_id: string }>>([]);
  const [calculatedCost, setCalculatedCost] = useState(0);

  const loadProducts = useCallback(async () => {
    try {
      if (isDatabaseMode) {
        const { data: allDbProducts, error } = await supabase
          .from('products')
          .select('id, name, category, unit, cost, is_active')
          .eq('is_active', true)
          .order('name')
          .returns<LocalProduct[]>();

        if (error) throw error;
        setProducts(allDbProducts || []);
      } else {
        const demoProducts = allProducts.slice(0, 10).map((p, idx) => ({
          id: `demo-prod-${idx}`,
          name: p.name,
          category: p.category,
          unit: '個',
          cost: p.cost,
          is_active: true,
        }));
        setProducts(demoProducts);
      }
    } catch (error) {
      console.error('商品取得エラー:', error);
    }
  }, [isDatabaseMode]);

  const loadMenus = useCallback(async () => {
    setLoading(true);
    try {
      if (isDatabaseMode) {
        if (!currentStore?.id) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('menus')
          .select('id, name, price, category, image_url, is_active, store_id, created_at, updated_at')
          .eq('store_id', currentStore.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .returns<Menu[]>();

        if (error) throw error;

        setMenus(data || []);

        // メニューが存在する場合のみレシピを取得
        const menuIds = (data || []).map((m) => m.id);
        if (menuIds.length > 0) {
          const { data: recipesData, error: recipesError } = await supabase
            .from('recipes')
            .select('id, menu_id, product_id, quantity_required, unit_id, product:products(id, name, category, cost, is_active)')
            .in('menu_id', menuIds)
            .returns<RecipeRow[]>();

          if (!recipesError && recipesData) {
            const enriched: LocalRecipe[] = recipesData.map((r) => {
              // product が配列の場合と単体の場合に対応
              const productData = Array.isArray(r.product) ? r.product[0] : r.product;
              return {
                id: r.id,
                menu_id: r.menu_id,
                product_id: r.product_id,
                quantity_required: r.quantity_required,
                unit_id: r.unit_id ?? r.unit ?? '個',
                product: productData || undefined,
              };
            });
            setRecipes(enriched);
          }
        } else {
          setRecipes([]);
        }
      } else {
        // デモモード: ダミーメニューを常に表示
        const storeId = currentStore?.id || '550e8400-e29b-41d4-a716-446655440001';
        
        const demoProducts = allProducts.slice(0, 5).map((p, idx) => ({
          id: `demo-prod-${idx}`,
          name: p.name,
          category: p.category,
          unit: '個',
          cost: p.cost,
          is_active: true,
        }));

        const demoMenus: LocalMenu[] = [
          {
            id: 'demo-menu-1',
            store_id: storeId,
            name: 'デモ定食A',
            price: 980,
            category: '主菜',
            is_active: true,
            created_at: '',
            updated_at: '',
          },
          {
            id: 'demo-menu-2',
            store_id: storeId,
            name: 'デモサラダB',
            price: 680,
            category: '副菜',
            is_active: true,
            created_at: '',
            updated_at: '',
          },
        ];

        const demoRecipes: LocalRecipe[] = [
          {
            id: 'demo-rec-1',
            menu_id: 'demo-menu-1',
            product_id: demoProducts[0].id,
            quantity_required: 1,
            unit_id: '個',
            product: demoProducts[0],
          },
          {
            id: 'demo-rec-2',
            menu_id: 'demo-menu-1',
            product_id: demoProducts[1].id,
            quantity_required: 2,
            unit_id: '個',
            product: demoProducts[1],
          },
          {
            id: 'demo-rec-3',
            menu_id: 'demo-menu-2',
            product_id: demoProducts[2].id,
            quantity_required: 1,
            unit_id: '個',
            product: demoProducts[2],
          },
        ];

        setProducts(demoProducts);
        setMenus(demoMenus);
        setRecipes(demoRecipes);
      }
    } catch (error) {
      console.error('メニュー取得エラー:', error);
      if (isDatabaseMode) {
        toast.error('メニューの取得に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  }, [currentStore?.id, isDatabaseMode]);

  useEffect(() => {
    if (currentStore?.id || !isDatabaseMode) {
      loadMenus();
      loadProducts();
    }
  }, [currentStore?.id, isDatabaseMode, loadMenus, loadProducts]);

  const handleCreateMenu = async () => {
    if (!currentStore?.id || !formData.name || formData.price < 0) {
      toast.error('必須項目を入力してください');
      return;
    }

    try {
      const { data: menuData, error: menuError } = await menuOperations.insert({
        store_id: currentStore.id,
        name: formData.name,
        price: formData.price,
        category: formData.category,
        is_active: true,
      });

      if (menuError) throw menuError;

      const createdMenu = menuData as LocalMenu | null;
      if (createRecipes.length > 0 && createdMenu) {
        const recipesToInsert = createRecipes.map((recipe) => ({
          menu_id: createdMenu.id,
          product_id: recipe.product_id,
          quantity_required: recipe.quantity_required,
          unit_id: recipe.unit_id || '個',
        }));

        const { error: recipesError } = await recipeOperations.insert(recipesToInsert);

        if (recipesError) throw recipesError;
      }

      toast.success('メニューを作成しました');
      setShowCreateModal(false);
      setFormData({ name: '', price: 0, category: '副菜' });
      setCreateRecipes([]);
      setCalculatedCost(0);
      setRecipeForm({ product_id: '', quantity_required: 1, unit_id: '' });
      await loadMenus();
    } catch (error) {
      console.error('メニュー作成エラー:', error);
      toast.error('メニューの作成に失敗しました');
    }
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (!confirm('このメニューを削除しますか？')) return;

    try {
      const { error } = await menuOperations.update(menuId, { is_active: false });
      if (error) throw error;
      toast.success('メニューを削除しました');
      await loadMenus();
    } catch (error) {
      console.error('削除エラー:', error);
      toast.error('削除に失敗しました');
    }
  };

  const handleAddRecipe = async () => {
    if (!selectedMenuForRecipe || !recipeForm.product_id || recipeForm.quantity_required <= 0) {
      toast.error('商品と数量を入力してください');
      return;
    }

    try {
      const { error } = await recipeOperations.insert({
        menu_id: selectedMenuForRecipe.id,
        product_id: recipeForm.product_id,
        quantity_required: recipeForm.quantity_required,
        unit_id: recipeForm.unit_id || '個',
      });

      if (error) throw error;

      toast.success('レシピを追加しました');
      setRecipeForm({ product_id: '', quantity_required: 1, unit_id: '' });
      await loadMenus();
    } catch (error) {
      console.error('レシピ追加エラー:', error);
      toast.error('レシピの追加に失敗しました');
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm('このレシピを削除しますか？')) return;

    try {
      const { error } = await recipeOperations.delete(recipeId);
      if (error) throw error;
      toast.success('レシピを削除しました');
      await loadMenus();
    } catch (error) {
      console.error('レシピ削除エラー:', error);
      toast.error('レシピの削除に失敗しました');
    }
  };

  const formatPrice = (price: number): string => {
    if (price >= 1) return Math.floor(price).toString();
    return price.toFixed(2);
  };

  const filteredMenus = menus.filter((menu) =>
    menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    menu.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddRecipeToCreate = () => {
    if (!recipeForm.product_id || recipeForm.quantity_required <= 0) {
      toast.error('商品と数量を入力してください');
      return;
    }

    const product = products.find((p) => p.id === recipeForm.product_id);
    if (!product) return;

    const isDuplicate = createRecipes.some((r) => r.product_id === recipeForm.product_id);
    if (isDuplicate) {
      toast.error('この商品は既に追加されています');
      return;
    }

    const newRecipe = {
      product_id: recipeForm.product_id,
      quantity_required: recipeForm.quantity_required,
      unit_id: recipeForm.unit_id || product.unit || '個',
    };

    const updated = [...createRecipes, newRecipe];
    setCreateRecipes(updated);

    const cost = (() => {
      // 1. 商品データを取り出す（配列で来ていても、単体でも対応）
      const productData = Array.isArray(product) 
        ? product[0] 
        : product;

      // 2. データがない場合の安全装置
      if (!productData) {
        console.warn(`⚠️ 警告: 商品データが見つかりません (Product ID: ${recipeForm.product_id})`);
        return 0;
      }

      // 3. コスト計算（なければ0円）
      return (productData.cost || 0) * (recipeForm.quantity_required || 0);
    })();
    setCalculatedCost(calculatedCost + cost);

    setRecipeForm({ product_id: '', quantity_required: 1, unit_id: '' });
    toast.success('レシピに追加しました');
  };

  const handleRemoveRecipeFromCreate = (index: number) => {
    const recipe = createRecipes[index];
    const product = products.find((p) => p.id === recipe.product_id);
    
    const cost = (() => {
      // 1. 商品データを取り出す（配列で来ていても、単体でも対応）
      const productData = Array.isArray(product) 
        ? product[0] 
        : product;

      // 2. データがない場合の安全装置
      if (!productData) {
        console.warn(`⚠️ 警告: 商品データが見つかりません (Product ID: ${recipe.product_id})`);
        return 0;
      }

      // 3. コスト計算（なければ0円）
      return (productData.cost || 0) * (recipe.quantity_required || 0);
    })();

    setCalculatedCost(calculatedCost - cost);
    setCreateRecipes(createRecipes.filter((_, i) => i !== index));
  };

  const getMenuRecipes = (menuId: string) => recipes.filter((r) => r.menu_id === menuId);

  const calculateMenuCost = (menuId: string) => {
    const menuRecipes = getMenuRecipes(menuId);
    return menuRecipes.reduce((total, recipe) => {
      const cost = (() => {
        // 1. 商品データを取り出す（配列で来ていても、単体でも対応）
        const productData = Array.isArray(recipe.product) 
          ? recipe.product[0] 
          : recipe.product;

        // 2. データがない場合の安全装置
        if (!productData) {
          console.warn(`⚠️ 警告: 商品データが見つかりません (Recipe ID: ${recipe.id})`);
          return 0;
        }

        // 3. コスト計算（なければ0円）
        return (productData.cost || 0) * (recipe.quantity_required || 0);
      })();
      return total + cost;
    }, 0);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">メニュー管理</h1>
          <p className="text-gray-600">店舗のメニューとレシピを管理します</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          新規メニュー
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="メニュー名またはカテゴリで検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid gap-4">
        {filteredMenus.map((menu) => {
          const menuRecipes = getMenuRecipes(menu.id);
          const totalCost = calculateMenuCost(menu.id);
          const profit = menu.price - totalCost;
          const profitRate = menu.price > 0 ? (profit / menu.price) * 100 : 0;
          const isExpanded = expandedMenuId === menu.id;

          return (
            <div key={menu.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{menu.name}</h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">{menu.category}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-semibold text-lg text-gray-900">{menu.price.toLocaleString()}</span>
                      <span>原価: {formatPrice(totalCost)}</span>
                      <span>利益: {formatPrice(profit)}</span>
                      <span className={profitRate >= 30 ? 'text-green-600' : 'text-orange-600'}>
                        利益率: {profitRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedMenuId(isExpanded ? null : menu.id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleDeleteMenu(menu.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">レシピ詳細</h4>
                      <button
                        onClick={() => {
                          setSelectedMenuForRecipe(menu);
                          setShowRecipeModal(true);
                        }}
                        className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        レシピを追加
                      </button>
                    </div>
                    {menuRecipes.length > 0 ? (
                      <div className="space-y-2">
                        {menuRecipes.map((recipe) => {
                          const recipeCost = (() => {
                            // 1. 商品データを取り出す（配列で来ていても、単体でも対応）
                            const productData = Array.isArray(recipe.product) 
                              ? recipe.product[0] 
                              : recipe.product;

                            // 2. データがない場合の安全装置
                            if (!productData) {
                              console.warn(`⚠️ 警告: 商品データが見つかりません (Recipe ID: ${recipe.id})`);
                              return 0;
                            }

                            // 3. コスト計算（なければ0円）
                            return (productData.cost || 0) * (recipe.quantity_required || 0);
                          })();
                          return (
                            <div key={recipe.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <span className="font-medium text-gray-900">{recipe.product?.name || '不明な商品'}</span>
                                <span className="text-gray-600 ml-2">
                                  {recipe.quantity_required}
                                  {recipe.unit_id}  {formatPrice(recipe.product?.cost || 0)} = {formatPrice(recipeCost)}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteRecipe(recipe.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500 p-4 bg-gray-50 rounded-lg">
                        <AlertCircle className="h-5 w-5" />
                        <span>レシピが登録されていません</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">新規メニュー作成</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: '', price: 0, category: '副菜' });
                  setCreateRecipes([]);
                  setCalculatedCost(0);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  メニュー名 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例: 季節の刺身盛り合わせ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  販売価格 <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">カテゴリ</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>主菜</option>
                  <option>副菜</option>
                  <option>汁物</option>
                  <option>ご飯物</option>
                  <option>デザート</option>
                </select>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">レシピ追加</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">商品</label>
                    <select
                      value={recipeForm.product_id}
                      onChange={(e) => {
                        const product = products.find((p) => p.id === e.target.value);
                        setRecipeForm({
                          ...recipeForm,
                          product_id: e.target.value,
                          unit_id: product?.unit || '個',
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- 選択してください --</option>
                      {products
                        .filter((p) => !createRecipes.some((r) => r.product_id === p.id))
                        .map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({formatPrice(product.cost || 0)}/{product.unit})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">必要数量</label>
                      <input
                        type="number"
                        step="0.1"
                        value={recipeForm.quantity_required}
                        onChange={(e) => setRecipeForm({ ...recipeForm, quantity_required: parseFloat(e.target.value) || 1 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">単位</label>
                      <select
                        value={recipeForm.unit_id}
                        onChange={(e) => setRecipeForm({ ...recipeForm, unit_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="個">個</option>
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                        <option value="本">本</option>
                        <option value="枚">枚</option>
                        <option value="パック">パック</option>
                        <option value="kg">kg</option>
                        <option value="L">L</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleAddRecipeToCreate}
                    className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    レシピに追加
                  </button>
                </div>

                {createRecipes.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="font-semibold text-gray-900">追加済みレシピ</h4>
                    {createRecipes.map((recipe, index) => {
                      const product = products.find((p) => p.id === recipe.product_id);
                      const cost = (() => {
                        // 1. 商品データを取り出す（配列で来ていても、単体でも対応）
                        const productData = Array.isArray(product) 
                          ? product[0] 
                          : product;

                        // 2. データがない場合の安全装置
                        if (!productData) {
                          console.warn(`⚠️ 警告: 商品データが見つかりません (Product ID: ${recipe.product_id})`);
                          return 0;
                        }

                        // 3. コスト計算（なければ0円）
                        return (productData.cost || 0) * (recipe.quantity_required || 0);
                      })();
                      return (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-900">
                            {product?.name} - {recipe.quantity_required}
                            {recipe.unit_id} ({formatPrice(cost)})
                          </span>
                          <button
                            onClick={() => handleRemoveRecipeFromCreate(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <span>合計原価:</span>
                        <span>{formatPrice(calculatedCost)}</span>
                      </div>
                      {formData.price > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>販売価格:</span>
                            <span>{formData.price.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>利益:</span>
                            <span>{formatPrice(formData.price - calculatedCost)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>利益率:</span>
                            <span>{((formData.price - calculatedCost) / formData.price * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', price: 0, category: '副菜' });
                    setCreateRecipes([]);
                    setCalculatedCost(0);
                  }}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 transition-colors font-medium"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleCreateMenu}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  作成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRecipeModal && selectedMenuForRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 w-96 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{selectedMenuForRecipe.name} - レシピ編集</h2>
              <button onClick={() => setShowRecipeModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  商品 <span className="text-red-600">*</span>
                </label>
                <select
                  value={recipeForm.product_id}
                  onChange={(e) => {
                    const product = products.find((p) => p.id === e.target.value);
                    setRecipeForm({
                      ...recipeForm,
                      product_id: e.target.value,
                      unit_id: product?.unit || '個',
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- 選択してください --</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  必要数量 <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={recipeForm.quantity_required}
                  onChange={(e) => setRecipeForm({ ...recipeForm, quantity_required: parseFloat(e.target.value) || 1 })}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">単位</label>
                <input
                  type="text"
                  value={recipeForm.unit_id}
                  onChange={(e) => setRecipeForm({ ...recipeForm, unit_id: e.target.value })}
                  placeholder="個、g、本など"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowRecipeModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 transition-colors font-medium">
                  キャンセル
                </button>
                <button onClick={handleAddRecipe} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  追加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
