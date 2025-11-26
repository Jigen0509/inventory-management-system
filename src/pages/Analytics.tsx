import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart,
  Calendar,
  Filter,
  Download
} from 'lucide-react';

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7days');
  const [category, setCategory] = useState('all');

  const salesData = [
    { date: '1/15', sales: 45000, orders: 25, products: 120 },
    { date: '1/16', sales: 52000, orders: 28, products: 135 },
    { date: '1/17', sales: 48000, orders: 26, products: 128 },
    { date: '1/18', sales: 61000, orders: 32, products: 145 },
    { date: '1/19', sales: 55000, orders: 29, products: 138 },
    { date: '1/20', sales: 58000, orders: 31, products: 142 },
    { date: '1/21', sales: 62000, orders: 33, products: 148 }
  ];

  const topProducts = [
    { name: 'りんごジュース', sales: 15000, quantity: 100, growth: 12 },
    { name: '食パン', sales: 12000, quantity: 80, growth: 8 },
    { name: '牛乳（1L）', sales: 10000, quantity: 60, growth: -5 },
    { name: 'お米（5kg）', sales: 8000, quantity: 20, growth: 15 },
    { name: '冷凍うどん', sales: 6000, quantity: 50, growth: 3 }
  ];

  const categoryData = [
    { name: '飲み物', sales: 25000, percentage: 35 },
    { name: 'パン類', sales: 18000, percentage: 25 },
    { name: '乳製品', sales: 15000, percentage: 21 },
    { name: '主食', sales: 8000, percentage: 11 },
    { name: 'その他', sales: 5000, percentage: 8 }
  ];

  const totalSales = salesData.reduce((sum, day) => sum + day.sales, 0);
  const totalOrders = salesData.reduce((sum, day) => sum + day.orders, 0);
  const avgOrderValue = totalSales / totalOrders;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">売れ筋分析</h1>
          <p className="text-gray-600">売上データと商品分析を確認しましょう</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7days">過去7日</option>
            <option value="30days">過去30日</option>
            <option value="90days">過去90日</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="h-4 w-4" />
            <span>エクスポート</span>
          </button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-50 text-green-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div className="flex items-center text-sm font-medium text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              +8.2%
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">¥{totalSales.toLocaleString()}</p>
            <p className="text-sm text-gray-600">総売上</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div className="flex items-center text-sm font-medium text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              +12%
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            <p className="text-sm text-gray-600">総注文数</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Package className="h-6 w-6" />
            </div>
            <div className="flex items-center text-sm font-medium text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              +5%
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{Math.round(avgOrderValue).toLocaleString()}</p>
            <p className="text-sm text-gray-600">平均注文額</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="flex items-center text-sm font-medium text-red-600">
              <TrendingDown className="h-4 w-4 mr-1" />
              -2%
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">148</p>
            <p className="text-sm text-gray-600">商品種類数</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 売上推移 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">売上推移</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {salesData.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{day.date}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-900">¥{day.sales.toLocaleString()}</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(day.sales / 70000) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* カテゴリ別売上 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">カテゴリ別売上</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {categoryData.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{category.name}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-900">¥{category.sales.toLocaleString()}</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{category.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 売れ筋商品 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">売れ筋商品 TOP5</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">数量: {product.quantity}個</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">¥{product.sales.toLocaleString()}</p>
                  <div className={`flex items-center text-sm ${
                    product.growth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {product.growth >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(product.growth)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;