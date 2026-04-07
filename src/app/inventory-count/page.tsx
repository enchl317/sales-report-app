'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Store {
  id: number;
  name: string;
  short_name: string;
  address: string;
}

interface Product {
  id: number;
  name: string;
  code?: string;
  category: string;
  specification?: string;
  unit?: string;
  sortOrder: number;
}

interface InventoryCount {
  id: number;
  documentId: string;
  createdDate: string;
  storeId: number;
  storeName: string;
  createdAt: string;
  updatedAt: string;
}

interface InventoryDetail {
  productId: number;
  productName: string;
  countedQuantity: number;
}

const InventoryCountPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeIdFromUrl = searchParams.get('storeId');
  
  const [formData, setFormData] = useState({
    storeId: storeIdFromUrl || '',
    storeShortName: '',
    createdDate: new Date().toISOString().split('T')[0],
    details: [] as { productId: number; productName: string; countedQuantity: number | null }[]
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(false);
  const [inventoryHistory, setInventoryHistory] = useState<InventoryCount[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // 获取门店列表
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch('/api/stores');
        const data = await response.json();
        if (data.success) {
          setStores(data.stores);
          
          // 如果URL中有storeId参数，设置对应的门店简称
          if (storeIdFromUrl) {
            const store = data.stores.find((s: any) => s.id == storeIdFromUrl);
            if (store) {
              setFormData(prev => ({
                ...prev,
                storeShortName: store.short_name
              }));
            }
          }
        }
      } catch (error) {
        console.error('获取门店列表失败:', error);
      }
    };

    fetchStores();
  }, [storeIdFromUrl]);

  // 获取商品列表
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        
        if (data.success) {
          // 按排序字段排序
          const sortedProducts = [...data.products].sort((a, b) => a.sortOrder - b.sortOrder);
          setProducts(sortedProducts);
          
          // 初始化盘点详情
          const initialDetails = sortedProducts.map(product => ({
            productId: product.id,
            productName: product.name,
            countedQuantity: null as number | null
          }));
          
          setFormData(prev => ({
            ...prev,
            details: initialDetails
          }));
        }
      } catch (error) {
        console.error('获取商品列表失败:', error);
      }
    };

    fetchProducts();
  }, []);

  // 获取历史盘点记录
  const fetchHistory = async () => {
    if (!formData.storeId) {
      setMessage('请先选择门店');
      setMessageType('error');
      return;
    }

    setHistoryLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/inventory-count?storeId=${formData.storeId}`);
      const result = await response.json();
      
      if (result.success) {
        setInventoryHistory(result.inventoryCounts);
        setShowHistory(true);
        setMessage('');
      } else {
        setMessage(result.message || '获取历史盘点记录失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('获取历史盘点记录失败');
      setMessageType('error');
    } finally {
      setHistoryLoading(false);
    }
  };

  // 当门店变化时，清空历史记录显示
  useEffect(() => {
    if (formData.storeId) {
      setShowHistory(false);
      setInventoryHistory([]);
    }
  }, [formData.storeId]);

  const handleQuantityChange = (productId: number, value: string) => {
    let numValue: number | null = null;
    
    if (value !== '') {
      numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        return; // 不允许负数
      }
    }

    setFormData(prev => ({
      ...prev,
      details: prev.details.map(detail =>
        detail.productId === productId
          ? { ...detail, countedQuantity: numValue }
          : detail
      )
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 如果选择了门店，自动填充门店简称
    if (name === 'storeId') {
      const selectedStore = stores.find(store => store.id == parseInt(value));
      if (selectedStore) {
        setFormData(prev => ({
          ...prev,
          storeShortName: selectedStore.short_name
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // 检查是否有负数
    const hasNegative = formData.details.some(detail => detail.countedQuantity !== null && detail.countedQuantity < 0);
    if (hasNegative) {
      setMessage('盘点数量不能为负数');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/inventory-count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
           storeId: parseInt(formData.storeId),
           createdDate: formData.createdDate,
           details: formData.details.map(detail => ({
             ...detail,
             countedQuantity: detail.countedQuantity !== null ? detail.countedQuantity : 0
           }))
          })
      });

      const result = await response.json();

      if (result.success) {
        setMessage('库存盘点提交成功！');
        setMessageType('success');
        
        // 清空表单
         setFormData({
           storeId: storeIdFromUrl || '',
           storeShortName: storeIdFromUrl && stores.length > 0 ? stores.find(s => s.id == parseInt(storeIdFromUrl))?.short_name || '' : '',
           createdDate: new Date().toISOString().split('T')[0],
           details: products.map(product => ({
             productId: product.id,
             productName: product.name,
             countedQuantity: null
           }))
         });
        
        // 自动跳转到查看历史盘点页面
        setTimeout(() => {
          fetchHistory();
        }, 1000);
      } else {
        setMessage(result.message || '提交失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('网络错误，请稍后重试');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSubmit = () => {
    setShowHistory(false);
    setInventoryHistory([]);
  };

  const viewHistoryDetail = (id: number, documentId: string) => {
    router.push(`/inventory-count/detail/${documentId}`);
  };

  const formatDate = (dateString: string) => {
    // 将日期字符串转换为 MM-DD 格式（不显示年份）
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要+1
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        {!showHistory ? (
          <>
            <h1 className="text-2xl font-bold text-center mb-6">门店库存盘点</h1>
            
            {message && (
              <div className={`mb-4 p-3 rounded ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {storeIdFromUrl ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      门店
                    </label>
                    <input
                      type="text"
                      value={formData.storeShortName}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="storeId" className="block text-sm font-medium text-gray-700 mb-1">
                      选择门店
                    </label>
                    <select
                      id="storeId"
                      name="storeId"
                      value={formData.storeId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">请选择门店</option>
                      {stores.map(store => (
                        <option key={store.id} value={store.id}>
                          {store.name} ({store.short_name})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label htmlFor="createdDate" className="block text-sm font-medium text-gray-700 mb-1">
                    盘点日期
                  </label>
                  <input
                    type="text"
                    id="createdDate"
                    value={new Date(formData.createdDate).toLocaleDateString('zh-CN')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    required
                    readOnly
                    disabled
                  />
                </div>
                
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     商品盘点数量
                   </label>
                   <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-md p-2">
                     {formData.details.length > 0 ? (
                       <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-50 sticky top-0">
                           <tr>
                             <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名称</th>
                             <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">盘点数量</th>
                           </tr>
                         </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                           {formData.details.map((detail, index) => {
                             return (
                               <tr key={detail.productId}>
                                 <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                   {detail.productName}
                                 </td>
                                 <td className="px-4 py-2 whitespace-nowrap text-sm">
                                   <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={detail.countedQuantity !== null ? detail.countedQuantity : ''}
                                    onChange={(e) => handleQuantityChange(detail.productId, e.target.value)}
                                    className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0"
                                  />
                                 </td>
                               </tr>
                             );
                           })}
                         </tbody>
                       </table>
                     ) : (
                       <div className="text-gray-500 italic p-2">暂无商品数据</div>
                     )}
                   </div>
                 </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? '提交中...' : '提交库存盘点'}
                </button>
                
                <button
                  type="button"
                  onClick={fetchHistory}
                  disabled={historyLoading}
                  className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {historyLoading ? '加载中...' : '查看历史盘点'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-center mb-4">历史盘点记录</h2>
            
            {message && (
              <div className={`mb-4 p-3 rounded ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message}
              </div>
            )}
            
            {inventoryHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单据ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">盘点日期</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventoryHistory.map((record, index) => (
                      <tr key={record.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{record.documentId}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatDate(record.createdDate)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => viewHistoryDetail(record.id, record.documentId)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            查看详情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                {historyLoading ? '加载中...' : '暂无盘点记录'}
              </div>
            )}
            
            <button
              type="button"
              onClick={handleBackToSubmit}
              className="w-full mt-4 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              返回提交盘点
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryCountPage;