import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Minus, 
  FileText,
  Download,
  Send,
  X
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/supabase';
import type { ProductWithInventory, Supplier, OrderForm } from '../types/database';

interface AutoOrderGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  onOrderCreated: () => void;
}

interface OrderItem {
  product_id: string;
  product: ProductWithInventory;
  current_stock: number;
  minimum_stock: number;
  suggested_quantity: number;
  unit_price: number;
  total_price: number;
}

const AutoOrderGenerator: React.FC<AutoOrderGeneratorProps> = ({
  isOpen,
  onClose,
  storeId,
  onOrderCreated
}) => {
  const { isDatabaseMode } = useAuth();
  const [lowStockItems, setLowStockItems] = useState<OrderItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [expectedDelivery, setExpectedDelivery] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [groupedBySupplier, setGroupedBySupplier] = useState<{[key: string]: OrderItem[]}>({});

  useEffect(() => {
    if (isOpen && storeId) {
      loadLowStockItems();
      loadSuppliers();
      // デフォルトの納期を3日後に設定
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 3);
      setExpectedDelivery(defaultDate.toISOString().split('T')[0]);
    }
  }, [isOpen, storeId]);

  const loadLowStockItems = async () => {
    try {
      if (isDatabaseMode) {
        // データベースから在庫不足商品を取得
        const { data: lowStockData, error } = await db.getLowStockItems(storeId);
        if (error) {
          console.error('在庫不足商品の取得に失敗:', error);
          return;
        }
        if (lowStockData) {
          const formattedItems = lowStockData.map(item => ({
            product_id: item.product_id,
            product: {
              id: item.product.id,
              name: item.product.name,
              barcode: item.product.barcode,
              category: item.product.category,
              price: item.product.price,
              cost: item.product.cost,
              supplier_id: item.product.supplier_id,
              description: item.product.description || ''
            },
            current_stock: item.current_stock,
            minimum_stock: item.minimum_stock,
            maximum_stock: item.maximum_stock
          }));
          
          const orderItems: OrderItem[] = formattedItems.map((item: any) => {
            const product = item.product;
            const currentStock = item.current_stock;
            const minimumStock = item.minimum_stock;
            const maximumStock = item.maximum_stock;
            
            // 発注数量の計算（最小在庫の2倍を目安）
            const suggestedQuantity = Math.max(minimumStock * 2 - currentStock, minimumStock);
            
            return {
              product_id: product.id,
              product: product,
              current_stock: currentStock,
              minimum_stock: minimumStock,
              suggested_quantity: suggestedQuantity,
              unit_price: product.cost || product.price * 0.7, // 原価がなければ販売価格の70%
              total_price: suggestedQuantity * (product.cost || product.price * 0.7)
            };
          });
          
          setLowStockItems(orderItems);
          groupItemsBySupplier(orderItems);
        }
      } else {
        // デモ用の在庫不足商品データ（データベースと一致）
      const demoLowStockItems = [
        {
          product_id: '850e8400-e29b-41d4-a716-446655440001',
          product: {
            id: '850e8400-e29b-41d4-a716-446655440001',
            name: 'りんごジュース',
            barcode: '4901234567890',
            category: '飲み物',
            price: 150,
            cost: 100,
            supplier_id: '650e8400-e29b-41d4-a716-446655440004',
            description: '100%りんごジュース'
          },
          current_stock: 3,
          minimum_stock: 10,
          maximum_stock: 50
        },
        {
          product_id: '850e8400-e29b-41d4-a716-446655440002',
          product: {
            id: '850e8400-e29b-41d4-a716-446655440002',
            name: '食パン',
            barcode: '4901234567891',
            category: 'パン類',
            price: 200,
            cost: 120,
            supplier_id: '650e8400-e29b-41d4-a716-446655440002',
            description: '6枚切り食パン'
          },
          current_stock: 2,
          minimum_stock: 8,
          maximum_stock: 30
        },
        {
          product_id: '850e8400-e29b-41d4-a716-446655440003',
          product: {
            id: '850e8400-e29b-41d4-a716-446655440003',
            name: '牛乳（1L）',
            barcode: '4901234567892',
            category: '乳製品',
            price: 250,
            cost: 180,
            supplier_id: '650e8400-e29b-41d4-a716-446655440003',
            description: '新鮮な牛乳'
          },
          current_stock: 5,
          minimum_stock: 15,
          maximum_stock: 40
        },
        {
          product_id: '850e8400-e29b-41d4-a716-446655440004',
          product: {
            id: '850e8400-e29b-41d4-a716-446655440004',
            name: 'お米（5kg）',
            barcode: '4901234567893',
            category: '主食',
            price: 2800,
            cost: 2000,
            supplier_id: '650e8400-e29b-41d4-a716-446655440001',
            description: '新潟産コシヒカリ'
          },
          current_stock: 1,
          minimum_stock: 5,
          maximum_stock: 20
        },
        {
          product_id: '850e8400-e29b-41d4-a716-446655440005',
          product: {
            id: '850e8400-e29b-41d4-a716-446655440005',
            name: '冷凍うどん',
            barcode: '4901234567894',
            category: '冷凍食品',
            price: 120,
            cost: 80,
            supplier_id: '650e8400-e29b-41d4-a716-446655440005',
            description: '手打ち風うどん'
          },
          current_stock: 4,
          minimum_stock: 10,
          maximum_stock: 50
        },
        {
          product_id: '850e8400-e29b-41d4-a716-446655440006',
          product: {
            id: '850e8400-e29b-41d4-a716-446655440006',
            name: 'チョコレート',
            barcode: '4901234567895',
            category: 'お菓子',
            price: 100,
            cost: 60,
            supplier_id: '650e8400-e29b-41d4-a716-446655440007',
            description: 'ミルクチョコレート'
          },
          current_stock: 2,
          minimum_stock: 20,
          maximum_stock: 100
        },
        {
          product_id: '850e8400-e29b-41d4-a716-446655440007',
          product: {
            id: '850e8400-e29b-41d4-a716-446655440007',
            name: '醤油',
            barcode: '4901234567896',
            category: '調味料',
            price: 300,
            cost: 200,
            supplier_id: '650e8400-e29b-41d4-a716-446655440006',
            description: '本醸造醤油'
          },
          current_stock: 3,
          minimum_stock: 5,
          maximum_stock: 30
        },
        {
          product_id: '850e8400-e29b-41d4-a716-446655440008',
          product: {
            id: '850e8400-e29b-41d4-a716-446655440008',
            name: '卵（10個入り）',
            barcode: '4901234567897',
            category: 'その他',
            price: 250,
            cost: 180,
            supplier_id: '650e8400-e29b-41d4-a716-446655440003',
            description: '新鮮な卵'
          },
          current_stock: 1,
          minimum_stock: 10,
          maximum_stock: 40
        },
        {
          product_id: '850e8400-e29b-41d4-a716-446655440009',
          product: {
            id: '850e8400-e29b-41d4-a716-446655440009',
            name: 'チョコパン',
            barcode: '4901234567898',
            category: 'パン類',
            price: 120,
            cost: 80,
            supplier_id: '650e8400-e29b-41d4-a716-446655440002',
            description: 'チョコレート入りパン'
          },
          current_stock: 2,
          minimum_stock: 8,
          maximum_stock: 30
        },
        {
          product_id: '850e8400-e29b-41d4-a716-446655440010',
          product: {
            id: '850e8400-e29b-41d4-a716-446655440010',
            name: 'コーヒー',
            barcode: '4901234567899',
            category: '飲み物',
            price: 200,
            cost: 150,
            supplier_id: '650e8400-e29b-41d4-a716-446655440004',
            description: 'ブラックコーヒー'
          },
          current_stock: 4,
          minimum_stock: 10,
          maximum_stock: 50
        }
      ];

      const orderItems: OrderItem[] = demoLowStockItems.map((item: any) => {
        const product = item.product;
        const currentStock = item.current_stock;
        const minimumStock = item.minimum_stock;
        const maximumStock = item.maximum_stock;
        
        // 発注数量の計算（最小在庫の2倍を目安）
        const suggestedQuantity = Math.max(minimumStock * 2 - currentStock, minimumStock);
        
        return {
          product_id: product.id,
          product: product,
          current_stock: currentStock,
          minimum_stock: minimumStock,
          suggested_quantity: suggestedQuantity,
          unit_price: product.cost || product.price * 0.7, // 原価がなければ販売価格の70%
          total_price: suggestedQuantity * (product.cost || product.price * 0.7)
        };
      });

        setLowStockItems(orderItems);
        groupItemsBySupplier(orderItems);
      }
    } catch (error) {
      console.error('Error loading low stock items:', error);
      // エラーメッセージは1回だけ表示
      if (!localStorage.getItem('lowStockErrorShown')) {
        toast.error('在庫不足商品の読み込みに失敗しました');
        localStorage.setItem('lowStockErrorShown', 'true');
        setTimeout(() => {
          localStorage.removeItem('lowStockErrorShown');
        }, 5000);
      }
    }
  };

  const groupItemsBySupplier = (items: OrderItem[]) => {
    const grouped: {[key: string]: OrderItem[]} = {};
    items.forEach(item => {
      const supplierId = item.product.supplier_id;
      if (!grouped[supplierId]) {
        grouped[supplierId] = [];
      }
      grouped[supplierId].push(item);
    });
    setGroupedBySupplier(grouped);
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

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    setLowStockItems(prev => {
      const updated = prev.map(item => {
        if (item.product_id === productId) {
          const totalPrice = newQuantity * item.unit_price;
          return { ...item, suggested_quantity: newQuantity, total_price: totalPrice };
        }
        return item;
      });
      groupItemsBySupplier(updated);
      return updated;
    });
  };

  const removeItem = (productId: string) => {
    setLowStockItems(prev => {
      const filtered = prev.filter(item => item.product_id !== productId);
      groupItemsBySupplier(filtered);
      return filtered;
    });
  };

  const calculateTotal = () => {
    return lowStockItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const calculateSupplierTotal = (supplierId: string) => {
    const items = groupedBySupplier[supplierId] || [];
    return items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const generatePDF = () => {
    if (lowStockItems.length === 0) {
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

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // ヘッダー
    doc.setFontSize(20);
    doc.text('発注書', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // 店舗情報
    doc.setFontSize(12);
    doc.text(`発注日: ${new Date().toLocaleDateString('ja-JP')}`, 20, yPosition);
    yPosition += 10;
    doc.text(`納期希望: ${expectedDelivery}`, 20, yPosition);
    yPosition += 20;

    // 供給元情報
    const supplier = suppliers.find(s => s.id === selectedSupplier);
    if (supplier) {
      doc.text(`供給元: ${supplier.name}`, 20, yPosition);
      yPosition += 10;
      doc.text(`連絡先: ${supplier.phone}`, 20, yPosition);
      yPosition += 20;
    }

    // 商品一覧
    doc.setFontSize(14);
    doc.text('発注商品一覧', 20, yPosition);
    yPosition += 15;

    // テーブルヘッダー
    doc.setFontSize(10);
    doc.text('商品名', 20, yPosition);
    doc.text('数量', 120, yPosition);
    doc.text('単価', 150, yPosition);
    doc.text('金額', 180, yPosition);
    yPosition += 10;

    // 区切り線
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // 商品データ
    lowStockItems.forEach(item => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      doc.text(item.product.name, 20, yPosition);
      doc.text(item.suggested_quantity.toString(), 120, yPosition);
      doc.text(`¥${item.unit_price.toLocaleString()}`, 150, yPosition);
      doc.text(`¥${item.total_price.toLocaleString()}`, 180, yPosition);
      yPosition += 10;
    });

    // 合計
    yPosition += 10;
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;
    doc.setFontSize(12);
    doc.text(`合計金額: ¥${calculateTotal().toLocaleString()}`, 150, yPosition);

    // メモ
    if (notes) {
      yPosition += 20;
      doc.setFontSize(10);
      doc.text('備考:', 20, yPosition);
      yPosition += 10;
      doc.text(notes, 20, yPosition);
    }

    // PDFをダウンロード
    doc.save(`発注書_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('発注書をPDFでダウンロードしました');
  };

  const createOrder = async () => {
    if (lowStockItems.length === 0) {
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
          const orderItemsData = lowStockItems.map(item => ({
            order_id: newOrder.id,
            product_id: item.product_id,
            quantity: item.suggested_quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          }));

          const { error: itemsError } = await db.createOrderItems(orderItemsData);
          
          if (itemsError) {
            throw itemsError;
          }
        }
      } else {
        // デモ用の発注書作成処理
        console.log('Creating order:', {
          store_id: storeId,
          supplier_id: selectedSupplier,
          total_amount: calculateTotal(),
          expected_delivery: expectedDelivery,
          notes: notes,
          items: lowStockItems
        });
      }

      toast.success('発注書を作成しました');
      onOrderCreated();
      onClose();
    } catch (error: any) {
      console.error('Error creating order:', error);
      // エラーメッセージは1回だけ表示
      if (!localStorage.getItem('orderCreateErrorShown')) {
        toast.error(error.message || '発注書の作成に失敗しました');
        localStorage.setItem('orderCreateErrorShown', 'true');
        setTimeout(() => {
          localStorage.removeItem('orderCreateErrorShown');
        }, 5000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">自動発注書生成</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {lowStockItems.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">在庫不足商品はありません</h3>
            <p className="text-gray-600">すべての商品が適正在庫を維持しています。</p>
          </div>
        ) : (
          <>
            {/* 発注情報 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  供給元 <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  required
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
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  合計金額
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  <span className="text-lg font-semibold text-gray-900">
                    ¥{calculateTotal().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 供給元別在庫不足商品一覧 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                供給元別在庫不足商品 ({lowStockItems.length}件)
              </h3>
              <div className="space-y-6">
                {Object.entries(groupedBySupplier).map(([supplierId, items]) => {
                  const supplier = suppliers.find(s => s.id === supplierId);
                  const supplierTotal = calculateSupplierTotal(supplierId);
                  
                  return (
                    <div key={supplierId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {supplier?.name || '不明な供給元'}
                          </h4>
                          <span className="text-sm text-gray-500">
                            ({items.length}商品)
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">供給元合計</p>
                          <p className="text-lg font-bold text-blue-600">
                            ¥{supplierTotal.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div key={item.product_id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <AlertTriangle className="h-5 w-5 text-red-600" />
                                  <div>
                                    <h5 className="font-medium text-gray-900">{item.product.name}</h5>
                                    <p className="text-sm text-gray-600">
                                      現在: {item.current_stock}個 / 最小: {item.minimum_stock}個
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => updateQuantity(item.product_id, item.suggested_quantity - 1)}
                                    className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="w-12 text-center font-medium">
                                    {item.suggested_quantity}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(item.product_id, item.suggested_quantity + 1)}
                                    className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">単価: ¥{item.unit_price.toLocaleString()}</p>
                                  <p className="font-medium text-gray-900">¥{item.total_price.toLocaleString()}</p>
                                </div>
                                <button
                                  onClick={() => removeItem(item.product_id)}
                                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 備考 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                備考
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="発注に関する特記事項があれば入力してください"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* アクションボタン */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={generatePDF}
                disabled={!selectedSupplier || !expectedDelivery}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>PDF出力</span>
              </button>
              <button
                onClick={createOrder}
                disabled={isLoading || !selectedSupplier || !expectedDelivery}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>{isLoading ? '作成中...' : '発注書作成'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AutoOrderGenerator;
