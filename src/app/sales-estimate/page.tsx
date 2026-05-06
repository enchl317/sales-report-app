'use client';

import React, { useState } from 'react';

interface StoreInfo {
  id: number;
  name: string;
  short_name: string;
  storeType: number;
}

interface ProductInfo {
  id: number;
  name: string;
  specification: string;
  unit: string;
}

const SalesEstimatePage: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    startDate: today,
    endDate: today,
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [salesEstimates, setSalesEstimates] = useState<{ [key: number]: { [key: number]: number } }>({});

  const fetchSalesEstimate = async () => {
    if (!formData.startDate || !formData.endDate) {
      setMessage('请选择起始日期和结束日期');
      setMessageType('error');
      return;
    }

    if (formData.startDate > formData.endDate) {
      setMessage('起始日期不能大于结束日期');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    setHasData(false);

    try {
      const response = await fetch(`/api/sales-estimate?startDate=${formData.startDate}&endDate=${formData.endDate}`);
      const data = await response.json();

      if (data.success) {
        setStores(data.data.stores);
        setProducts(data.data.products);
        setSalesEstimates(data.data.salesEstimates);
        setHasData(true);
        setMessage('');
      } else {
        setMessage(data.message || '获取销售预估数据失败');
        setMessageType('error');
      }
    } catch (err) {
      console.error('获取销售预估数据失败:', err);
      setMessage('网络错误，请稍后重试');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setHasData(false);
  };

  // 格式化数量
  const formatQty = (num: number) => {
    if (num === 0) return '0';
    const fixed = Number(num.toFixed(4));
    return String(fixed);
  };

  // 计算每个SKU的总销售预估
  const getProductTotal = (productId: number) => {
    let total = 0;
    stores.forEach(store => {
      total += salesEstimates[store.id]?.[productId] || 0;
    });
    return total;
  };

  // 计算每个门店的总销售预估
  const getStoreTotal = (storeId: number) => {
    let total = 0;
    products.forEach(product => {
      total += salesEstimates[storeId]?.[product.id] || 0;
    });
    return total;
  };

  // 计算全部总计
  const getGrandTotal = () => {
    let total = 0;
    stores.forEach(store => {
      products.forEach(product => {
        total += salesEstimates[store.id]?.[product.id] || 0;
      });
    });
    return total;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-20">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">各门店销售预估</h1>

        {message && (
          <div className={`mb-4 p-3 rounded ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">起始日期</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={fetchSalesEstimate}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? '查询中...' : '查询销售预估'}
          </button>
        </div>

        {/* 计算逻辑说明 */}
        {hasData && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            <span className="font-semibold">计算逻辑：</span>
            <span>销售预估 = {formData.endDate}当日库存 - {formData.startDate}当日库存。当日库存基于盘点+进货+调拨入-调拨出计算。负数表示库存增加（进货/调拨多于销售）。</span>
          </div>
        )}

        {/* 销售预估表格 */}
        {hasData && products.length > 0 && stores.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">销售预估数据</label>
            <div className="max-h-[500px] overflow-auto border border-gray-300 rounded-md p-2">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap sticky left-0 bg-gray-50 z-20">SKU</th>
                    {stores.map(store => (
                      <th key={store.id} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap min-w-[80px]">
                        {store.short_name}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-center text-xs font-medium text-yellow-700 uppercase whitespace-nowrap bg-yellow-50 min-w-[80px]">合计</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map(product => {
                    const productTotal = getProductTotal(product.id);
                    return (
                      <tr key={product.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                          {product.name}
                        </td>
                        {stores.map(store => {
                          const value = salesEstimates[store.id]?.[product.id] || 0;
                          const isNegative = value < 0;
                          return (
                            <td key={store.id} className={`px-3 py-2 whitespace-nowrap text-sm text-center ${isNegative ? 'text-red-600 font-semibold' : ''}`}>
                              {formatQty(value)}
                            </td>
                          );
                        })}
                        <td className={`px-3 py-2 whitespace-nowrap text-sm text-center font-semibold bg-yellow-50 ${productTotal < 0 ? 'text-red-600' : ''}`}>
                          {formatQty(productTotal)}
                        </td>
                      </tr>
                    );
                  })}
                  {/* 门店合计行 */}
                  <tr className="bg-gray-100 font-semibold">
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-gray-900 sticky left-0 bg-gray-100 z-10">门店合计</td>
                    {stores.map(store => {
                      const storeTotal = getStoreTotal(store.id);
                      return (
                        <td key={store.id} className={`px-3 py-2 whitespace-nowrap text-sm text-center ${storeTotal < 0 ? 'text-red-600' : ''}`}>
                          {formatQty(storeTotal)}
                        </td>
                      );
                    })}
                    <td className={`px-3 py-2 whitespace-nowrap text-sm text-center font-bold bg-yellow-50 ${getGrandTotal() < 0 ? 'text-red-600' : ''}`}>
                      {formatQty(getGrandTotal())}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!hasData && !loading && !message && (
          <div className="mt-4 text-center py-4 text-gray-500">
            请选择起始日期和结束日期后点击"查询销售预估"按钮
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesEstimatePage;