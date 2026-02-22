import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit2, 
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Zap,
  X,
  Trash2,
  Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import AutoOrderGenerator from '../components/AutoOrderGenerator';
import ManualOrderModal from '../components/ManualOrderModal';
import SupplierEditModal from '../components/SupplierEditModal';
import { db, supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { OrderWithItems, Supplier, OrderItem, Order, Product } from '../types/database';

// ローカル拡張型（DBヘルパーの戻り値に合わせる）
type OrderItemWithProduct = OrderItem & { product: Product | null };
type OrderWithItemsAndSupplier = Order & { items: OrderItemWithProduct[]; supplier: Supplier | null };

interface LocalOrder {
  id: string;
  status: string;
  updated_at?: string;
}

const Orders: React.FC = () => {
  const { isDatabaseMode } = useAuth();
  const { currentStore } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAutoOrder, setShowAutoOrder] = useState(false);
  const [showManualOrder, setShowManualOrder] = useState(false);
  const [showSupplierManagement, setShowSupplierManagement] = useState(false);
  const [showSupplierEdit, setShowSupplierEdit] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showOrderEdit, setShowOrderEdit] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItemsAndSupplier | null>(null);
  const [orders, setOrders] = useState<OrderWithItemsAndSupplier[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const orderStatuses = [
    { key: 'all', label: 'すべて', color: 'gray' },
    { key: 'draft', label: '下書き', color: 'gray' },
    { key: 'pending', label: '発注待ち', color: 'orange' },
    { key: 'confirmed', label: '発注確定', color: 'blue' },
    { key: 'delivered', label: '納品完了', color: 'green' },
    { key: 'cancelled', label: 'キャンセル', color: 'red' }
  ];

  useEffect(() => {
    if (currentStore?.id) {
      loadOrders();
      loadSuppliers();
    }
  }, [currentStore?.id]);

  const loadOrders = async () => {
    if (!currentStore?.id) return;
    
    setIsLoading(true);
    try {
      if (isDatabaseMode) {
        // データベースから発注データを取得
        const { data: dbOrders, error } = await db.getOrders(currentStore.id);
        
        if (error) {
          console.error('データベースからの発注データ取得に失敗:', error);
          throw error;
        }
        
        if (dbOrders) {
          setOrders(dbOrders as OrderWithItemsAndSupplier[]);
        }
      } else {
        // デモ用の発注データ
        const demoOrders = [
        {
          id: '950e8400-e29b-41d4-a716-446655440001',
          store_id: currentStore.id,
          supplier_id: '650e8400-e29b-41d4-a716-446655440001',
          status: 'confirmed',
          total_amount: 1500,
          order_date: new Date().toISOString(),
          expected_delivery: '2024-02-01',
          notes: '急ぎでお願いします',
          created_by: '750e8400-e29b-41d4-a716-446655440002',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
      items: [
            {
              id: 'item-001',
              order_id: '950e8400-e29b-41d4-a716-446655440001',
              product_id: '850e8400-e29b-41d4-a716-446655440001',
              quantity: 10,
              unit_price: 100,
              total_price: 1000,
              created_at: new Date().toISOString(),
              product: {
                id: '850e8400-e29b-41d4-a716-446655440001',
                name: 'りんごジュース',
                barcode: '4901234567890',
                category: '飲み物',
                price: 150,
                cost: 100
              }
            },
            {
              id: 'item-002',
              order_id: '950e8400-e29b-41d4-a716-446655440001',
              product_id: '850e8400-e29b-41d4-a716-446655440006',
              quantity: 5,
              unit_price: 100,
              total_price: 500,
              created_at: new Date().toISOString(),
              product: {
                id: '850e8400-e29b-41d4-a716-446655440006',
                name: 'チョコレート',
                barcode: '4901234567895',
                category: 'お菓子',
                price: 100,
                cost: 60
              }
            }
          ],
          supplier: {
            id: '650e8400-e29b-41d4-a716-446655440001',
            name: 'ABC商事',
            contact_person: '田中太郎',
            email: 'tanaka@abc-shouji.com',
            phone: '03-1111-2222',
            address: '東京都新宿区西新宿1-1-1'
          }
        }
        ];
        
        // 手動発注データを取得して結合
        const storeId = currentStore?.id || '1';
        const manualOrdersKey = `store_${storeId}_manual_orders`;
        const manualOrders = JSON.parse(localStorage.getItem(manualOrdersKey) || '[]');
        const allOrders = [...demoOrders, ...manualOrders];
        
        setOrders(allOrders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      // エラーメッセージは1回だけ表示
      if (!localStorage.getItem('ordersErrorShown')) {
        toast.error('発注書の読み込みに失敗しました');
        localStorage.setItem('ordersErrorShown', 'true');
        setTimeout(() => {
          localStorage.removeItem('ordersErrorShown');
        }, 5000);
      }
    } finally {
      setIsLoading(false);
    }
  };

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
      console.error('Error loading suppliers:', error);
    }
  };

  const deleteSupplier = async (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    const supplierName = supplier?.name || 'この供給元';
    
    if (!confirm(`${supplierName}を削除しますか？\n\nこの操作は取り消せません。関連する商品や発注データに影響する可能性があります。\n\n本当に削除しますか？`)) {
      return;
    }

    try {
      if (isDatabaseMode) {
        const { error } = await db.deleteSupplier(supplierId);
        if (error) {
          throw error;
        }
      }
      
      setSuppliers(prev => prev.filter(s => s.id !== supplierId));
      toast.success(`${supplierName}を削除しました`);
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error(error instanceof Error ? error.message : '供給元の削除に失敗しました');
    }
  };

  const updateSupplier = async (supplierData: Supplier) => {
    try {
      if (isDatabaseMode) {
        const { error } = await db.updateSupplier(supplierData.id, supplierData);
        if (error) {
          throw error;
        }
      }
      
      setSuppliers(prev => prev.map(s => s.id === supplierData.id ? supplierData : s));
      toast.success('供給元を更新しました');
      setShowSupplierEdit(false);
      setEditingSupplier(null);
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast.error(error instanceof Error ? error.message : '供給元の更新に失敗しました');
    }
  };

  const deleteOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    const orderNumber = order?.id || 'この発注';
    
    if (!confirm(`${orderNumber}を削除しますか？\n\nこの操作は取り消せません。\n\n本当に削除しますか？`)) {
      return;
    }

    try {
      if (isDatabaseMode) {
        // データベースから発注を削除
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderId);
        
        if (error) {
          throw error;
        }
      } else {
        // デモモードではローカルストレージから削除
        const storeId = currentStore?.id || '1';
        const manualOrdersKey = `store_${storeId}_manual_orders`;
        const manualOrders = JSON.parse(localStorage.getItem(manualOrdersKey) || '[]') as LocalOrder[];
        const updatedManualOrders = manualOrders.filter((o) => o.id !== orderId);
        localStorage.setItem(manualOrdersKey, JSON.stringify(updatedManualOrders));
      }
      
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast.success(`${orderNumber}を削除しました`);
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error(error instanceof Error ? error.message : '発注の削除に失敗しました');
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      if (isDatabaseMode) {
        // データベースのステータスを更新
        const { error } = await (supabase as any)
          .from('orders')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', orderId);
        
        if (error) {
          throw error;
        }
      } else {
        // デモモードではローカルストレージを更新
        const storeId = currentStore?.id || '1';
        const manualOrdersKey = `store_${storeId}_manual_orders`;
        const manualOrders = JSON.parse(localStorage.getItem(manualOrdersKey) || '[]') as LocalOrder[];
        const updatedManualOrders = manualOrders.map((o) => 
          o.id === orderId ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o
        );
        localStorage.setItem(manualOrdersKey, JSON.stringify(updatedManualOrders));
      }
      
      // ローカル状態を更新
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: newStatus as OrderWithItems['status'], updated_at: new Date().toISOString() } : o
      ));
      
      const statusLabel = orderStatuses.find(s => s.key === newStatus)?.label || newStatus;
      toast.success(`発注ステータスを「${statusLabel}」に更新しました`);
      setShowOrderEdit(false);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error instanceof Error ? error.message : 'ステータスの更新に失敗しました');
    }
  };

  const getStatusColor = (status: string) => {
    const statusObj = orderStatuses.find(s => s.key === status);
    const color = statusObj?.color || 'gray';
    
    switch (color) {
      case 'orange': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'blue': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'green': return 'bg-green-100 text-green-600 border-green-200';
      case 'red': return 'bg-red-100 text-red-600 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <Package className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const orderStats = {
    total: orders.length,
    draft: orders.filter(o => o.status === 'draft').length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    totalAmount: orders.reduce((sum, o) => sum + o.total_amount, 0)
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">発注管理</h1>
          <p className="text-gray-600">仕入れ先への発注を管理しましょう</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowSupplierManagement(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2 transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span>供給元管理</span>
          </button>
          <button 
            onClick={() => setShowAutoOrder(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
          >
            <Zap className="h-5 w-5" />
            <span>発注候補を生成</span>
          </button>
          <button 
            onClick={() => setShowManualOrder(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
          <Plus className="h-5 w-5" />
            <span>手動発注</span>
        </button>
        </div>
      </div>

      {/* 発注統計 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-600">総発注数</p>
          <p className="text-2xl font-bold text-gray-900">{orderStats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-600">下書き</p>
          <p className="text-2xl font-bold text-gray-600">{orderStats.draft}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-600">発注待ち</p>
          <p className="text-2xl font-bold text-orange-600">{orderStats.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-600">発注確定</p>
          <p className="text-2xl font-bold text-blue-600">{orderStats.confirmed}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-600">総発注金額</p>
          <p className="text-2xl font-bold text-gray-900">¥{orderStats.totalAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="発注番号または供給元で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {orderStatuses.map(status => (
                <option key={status.key} value={status.key}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 発注一覧 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">発注一覧</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">発注書がありません</h3>
              <p className="text-gray-600">発注候補の生成または手動発注から作成できます。</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
            <div key={order.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{order.id}</h4>
                      <p className="text-sm text-gray-600">{order.supplier?.name || '供給元不明'}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1">
                      {orderStatuses.find(s => s.key === order.status)?.label}
                    </span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderDetail(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded"
                      title="詳細表示"
                    >
                    <Eye className="h-4 w-4" />
                  </button>
                    <button 
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderEdit(true);
                      }}
                      className="text-gray-600 hover:text-gray-800 p-2 rounded"
                      title="編集"
                    >
                    <Edit2 className="h-4 w-4" />
                  </button>
                    <button 
                      onClick={() => deleteOrder(order.id)}
                      className="text-red-600 hover:text-red-800 p-2 rounded"
                      title="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                    <p className="text-gray-500">発注日</p>
                    <p className="font-medium">{new Date(order.order_date).toLocaleDateString('ja-JP')}</p>
                </div>
                <div>
                    <p className="text-gray-500">納期予定</p>
                    <p className="font-medium">{new Date(order.expected_delivery).toLocaleDateString('ja-JP')}</p>
                </div>
                <div>
                    <p className="text-gray-500">総金額</p>
                    <p className="font-medium">¥{order.total_amount.toLocaleString()}</p>
                  </div>
              </div>

              <div className="mt-4">
                  <p className="text-gray-500 text-sm mb-2">発注商品</p>
                <div className="bg-gray-50 rounded-lg p-3">
                    {order.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1">
                        <span className="text-sm">{item.product?.name || '商品名不明'} × {item.quantity}</span>
                        <span className="text-sm font-medium">¥{item.total_price.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">合計</span>
                        <span className="font-bold text-lg">¥{order.total_amount.toLocaleString()}</span>
                      </div>
                  </div>
                </div>
              </div>

              {order.notes && (
                <div className="mt-4">
                  <p className="text-gray-500 text-sm">備考</p>
                  <p className="text-sm bg-yellow-50 p-2 rounded border border-yellow-200">{order.notes}</p>
                </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 発注候補の自動生成 */}
      <AutoOrderGenerator
        isOpen={showAutoOrder}
        onClose={() => setShowAutoOrder(false)}
        storeId={currentStore?.id || ''}
        onOrderCreated={() => {
          loadOrders();
          setShowAutoOrder(false);
        }}
      />

      {/* 手動発注モーダル */}
      {showManualOrder && (
        <ManualOrderModal
          isOpen={showManualOrder}
          onClose={() => setShowManualOrder(false)}
          storeId={currentStore?.id || ''}
          onOrderCreated={() => {
            loadOrders();
            setShowManualOrder(false);
          }}
        />
      )}

      {/* 供給元管理モーダル */}
      {showSupplierManagement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">供給元管理</h2>
              </div>
              <button
                onClick={() => setShowSupplierManagement(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                          {supplier.category}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">担当者:</span> {supplier.contact_person}
                        </div>
                        <div>
                          <span className="font-medium">電話:</span> {supplier.phone}
                        </div>
                        <div>
                          <span className="font-medium">メール:</span> {supplier.email}
                        </div>
                        <div>
                          <span className="font-medium">住所:</span> {supplier.address}
                        </div>
                        {supplier.order_url && (
                          <div className="md:col-span-2">
                            <span className="font-medium">発注URL:</span> 
                            <a 
                              href={supplier.order_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 ml-1"
                            >
                              {supplier.order_url}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingSupplier(supplier);
                          setShowSupplierEdit(true);
                        }}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title="編集"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteSupplier(supplier.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {suppliers.length === 0 && (
              <div className="text-center py-12">
                <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">供給元がありません</h3>
                <p className="text-gray-600">商品追加時に供給元を追加できます。</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 供給元編集モーダル */}
      {showSupplierEdit && editingSupplier && (
        <SupplierEditModal
          supplier={editingSupplier}
          onClose={() => {
            setShowSupplierEdit(false);
            setEditingSupplier(null);
          }}
          onSave={updateSupplier}
        />
      )}

      {/* 発注詳細モーダル */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">発注詳細</h2>
              </div>
              <button
                onClick={() => setShowOrderDetail(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* 発注基本情報 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">発注情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">発注番号</p>
                    <p className="font-medium">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">供給元</p>
                    <p className="font-medium">{selectedOrder.supplier?.name || '未設定'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">発注日</p>
                    <p className="font-medium">{new Date(selectedOrder.order_date).toLocaleDateString('ja-JP')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">納期予定</p>
                    <p className="font-medium">{new Date(selectedOrder.expected_delivery).toLocaleDateString('ja-JP')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ステータス</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      <span className="ml-1">
                        {orderStatuses.find(s => s.key === selectedOrder.status)?.label}
                      </span>
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">総金額</p>
                    <p className="font-medium text-lg">¥{selectedOrder.total_amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* 発注商品一覧 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">発注商品</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品名</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">数量</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">単価</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">小計</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{item.product?.name || '商品名不明'}</p>
                              <p className="text-sm text-gray-500">{item.product?.category || ''}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}個</td>
                          <td className="px-4 py-3 text-sm text-gray-900">¥{item.unit_price.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">¥{item.total_price.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right font-medium text-gray-900">合計</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">¥{selectedOrder.total_amount.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 備考 */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">備考</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-gray-700">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 発注編集モーダル */}
      {showOrderEdit && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Edit2 className="h-6 w-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">発注編集</h2>
              </div>
              <button
                onClick={() => setShowOrderEdit(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* ステータス変更セクション */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ステータス変更</h3>
                <div className="flex items-center space-x-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">現在のステータス</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      <span className="ml-1">
                        {orderStatuses.find(s => s.key === selectedOrder.status)?.label}
                      </span>
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.status === 'draft' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'pending')}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2 transition-colors"
                    >
                      <Clock className="h-4 w-4" />
                      <span>発注待ちに変更</span>
                    </button>
                  )}
                  
                  {(selectedOrder.status === 'draft' || selectedOrder.status === 'pending') && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
                    >
                      <Package className="h-4 w-4" />
                      <span>発注確定</span>
                    </button>
                  )}
                  
                  {selectedOrder.status === 'confirmed' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>納品完了</span>
                    </button>
                  )}
                  
                  {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2 transition-colors"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span>キャンセル</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">発注情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">発注番号</p>
                    <p className="font-medium">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">供給元</p>
                    <p className="font-medium">{selectedOrder.supplier?.name || '未設定'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">発注日</p>
                    <p className="font-medium">{new Date(selectedOrder.order_date).toLocaleDateString('ja-JP')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">納期予定</p>
                    <p className="font-medium">{new Date(selectedOrder.expected_delivery).toLocaleDateString('ja-JP')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">総金額</p>
                    <p className="font-medium text-lg">¥{selectedOrder.total_amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* 発注商品一覧 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">発注商品</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品名</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">数量</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">単価</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">小計</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{item.product?.name || '商品名不明'}</p>
                              <p className="text-sm text-gray-500">{item.product?.category || ''}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}個</td>
                          <td className="px-4 py-3 text-sm text-gray-900">¥{item.unit_price.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">¥{item.total_price.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right font-medium text-gray-900">合計</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">¥{selectedOrder.total_amount.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 備考 */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">備考</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-gray-700">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default Orders;