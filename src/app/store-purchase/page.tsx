'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Store {
  id: number;
  name: string;
  short_name: string;
  address: string;
  store_type: number;
}

interface Product {
  id: number;
  name: string;
  code?: string;
  category: string;
  specification?: string;
  unit?: string;
  sortOrder: number;
  offlineSale: number;
}

interface StorePurchase {
  id: number;
  documentId: string;
  createdDate: string;
  storeId: number;
  storeName: string;
  createdAt: string;
  updatedAt: string;
}

interface PurchaseDetail {
  id: string;
  productId: number;
  productName: string;
  purchaseQuantity: number | null;
}

const StorePurchasePage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeIdFromUrl = searchParams.get('storeId');
  
  const [formData, setFormData] = useState({
    storeId: storeIdFromUrl || '',
    storeShortName: '',
    createdDate: new Date().toISOString().split('T')[0],
    details: [{ id: 'temp-0', productId: 0, productName: '', purchaseQuantity: null }] as PurchaseDetail[]
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState<StorePurchase[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentStoreType, setCurrentStoreType] = useState<number>(0);

  // 获取门店列表
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch('/api/stores');
        const data = await response.json();
        if (data.success) {
          setStores(data.stores);
          
          // 如果URL中有storeId参数，设置对应的门店简称和门店类型
          if (storeIdFromUrl) {
            const store = data.stores.find((s: any) => s.id == storeIdFromUrl);
            if (store) {
              setFormData(prev => ({
                ...prev,
                storeShortName: store.short_name
              }));
              setCurrentStoreType(store.store_type);
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
        }
      } catch (error) {
        console.error('获取商品列表失败:', error);
      }
    };

    fetchProducts();
  }, []);

  // 当门店变化时，加载该门店当日的进货记录
  useEffect(() => {
    const loadTodayPurchase = async () => {
      if (formData.storeId && formData.createdDate) {
        try {
          const response = await fetch(`/api/store-purchase?storeId=${formData.storeId}&date=${formData.createdDate}`);
          const result = await response.json();
          
          if (result.success && result.storePurchases && result.storePurchases.length > 0) {
            // 存在当日记录，加载已有的进货商品
            const purchase = result.storePurchases[0];
            const detailResponse = await fetch(`/api/store-purchase/${purchase.id}`);
            const detailResult = await detailResponse.json();
            
            if (detailResult.success && detailResult.details) {
              const loadedDetails = detailResult.details.map((d: any) => ({
                id: `temp-${d.id}`,
                productId: d.productId,
                productName: d.productName,
                purchaseQuantity: d.purchaseQuantity
              }));
              setFormData(prev => ({
                ...prev,
                details: loadedDetails
              }));
            }
          } else {
            // 无当日记录，重置为默认一行
            setFormData(prev => ({
              ...prev,
              details: [{ id: 'temp-0', productId: 0, productName: '', purchaseQuantity: null }]
            }));
          }
        } catch (error) {
          console.error('加载当日进货记录失败:', error);
        }
      }
    };

    loadTodayPurchase();
  }, [formData.storeId, formData.createdDate]);

  // 获取历史进货记录
  const fetchHistory = async () => {
    if (!formData.storeId) {
      setMessage('请先选择门店');
      setMessageType('error');
      return;
    }

    setHistoryLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/store-purchase?storeId=${formData.storeId}`);
      const result = await response.json();
      
      if (result.success) {
        setPurchaseHistory(result.storePurchases);
        setShowHistory(true);
        setMessage('');
      } else {
        setMessage(result.message || '获取历史进货记录失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('获取历史进货记录失败');
      setMessageType('error');
    } finally {
      setHistoryLoading(false);
    }
  };

  // 当门店变化时，清空历史记录显示
  useEffect(() => {
    if (formData.storeId) {
      setShowHistory(false);
      setPurchaseHistory([]);
    }
  }, [formData.storeId]);

  const handleQuantityChange = (id: string, value: string) => {
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
        detail.id === id
          ? { ...detail, purchaseQuantity: numValue }
          : detail
      )
    }));
  };

  const handleProductChange = (id: string, productId: string) => {
    const selectedProduct = products.find(p => p.id === parseInt(productId));
    if (!selectedProduct) return;

    // 检查是否已选择该商品
    const existingDetail = formData.details.find(d => d.productId === parseInt(productId) && d.id !== id);
    if (existingDetail) {
      setMessage('该商品已添加');
      setMessageType('error');
      return;
    }

    setFormData(prev => ({
      ...prev,
      details: prev.details.map(detail =>
        detail.id === id
          ? { ...detail, productId: parseInt(productId), productName: selectedProduct.name }
          : detail
      )
    }));
  };

  const handleDeleteDetail = (id: string) => {
    setFormData(prev => ({
      ...prev,
      details: prev.details.filter(detail => detail.id !== id)
    }));
  };

  const handleAddDetail = () => {
    const newDetail: PurchaseDetail = {
      id: `temp-${Date.now()}`,
      productId: 0,
      productName: '',
      purchaseQuantity: null
    };

    setFormData(prev => ({
      ...prev,
      details: [...prev.details, newDetail]
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 如果选择了门店，自动填充门店简称和门店类型
    if (name === 'storeId') {
      const selectedStore = stores.find(store => store.id == parseInt(value));
      if (selectedStore) {
        setFormData(prev => ({
          ...prev,
          storeShortName: selectedStore.short_name,
          details: [{ id: 'temp-0', productId: 0, productName: '', purchaseQuantity: null }] // 切换门店时重置为默认一行
        }));
        setCurrentStoreType(selectedStore.store_type);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // 检查是否有未选择商品的行
    const hasEmptyProduct = formData.details.some(detail => detail.productId === 0);
    if (hasEmptyProduct) {
      setMessage('请选择商品');
      setMessageType('error');
      setLoading(false);
      return;
    }

    // 检查是否有负数
    const hasNegative = formData.details.some(detail => detail.purchaseQuantity !== null && detail.purchaseQuantity < 0);
    if (hasNegative) {
      setMessage('进货数量不能为负数');
      setMessageType('error');
      setLoading(false);
      return;
    }

    // 过滤掉没有填写数量的商品
    const validDetails = formData.details.filter(detail => detail.purchaseQuantity !== null);

    // 如果没有有效商品，提示用户
    if (validDetails.length === 0) {
      setMessage('请至少填写一个商品的进货数量');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/store-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
           storeId: parseInt(formData.storeId),
           createdDate: formData.createdDate,
           details: validDetails.map(detail => ({
             productId: detail.productId,
             productName: detail.productName,
             purchaseQuantity: detail.purchaseQuantity || 0
           }))
         })
      });

      const result = await response.json();

      if (result.success) {
        setMessage('门店进货单提交成功！');
        setMessageType('success');
        
        // 重新加载当日数据
        setTimeout(async () => {
          const response = await fetch(`/api/store-purchase?storeId=${formData.storeId}&date=${formData.createdDate}`);
          const data = await response.json();
          
          if (data.success && data.storePurchases && data.storePurchases.length > 0) {
            const purchase = data.storePurchases[0];
            const detailResponse = await fetch(`/api/store-purchase/${purchase.id}`);
            const detailResult = await detailResponse.json();
            
            if (detailResult.success && detailResult.details) {
              const loadedDetails = detailResult.details.map((d: any) => ({
                id: `temp-${d.id}`,
                productId: d.productId,
                productName: d.productName,
                purchaseQuantity: d.purchaseQuantity
              }));
              setFormData(prev => ({
                ...prev,
                details: loadedDetails
              }));
            }
          }
        }, 500);
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
    setPurchaseHistory([]);
  };

  const viewHistoryDetail = (id: number, documentId: string) => {
    router.push(`/store-purchase/detail/${documentId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  };

  // 获取未选择的商品列表，根据门店类型过滤
  const getAvailableProducts = (currentProductId: number) => {
    // 线下门店(store_type=0)：只显示线下售卖为是的商品
    // 电商门店(store_type=1)：显示所有商品
    const filteredProducts = products.filter(product => 
      currentStoreType === 1 || product.offlineSale === 1
    );
    
    return filteredProducts.filter(product => 
      !formData.details.some(d => d.productId === product.id) || product.id === currentProductId
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-20">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        {!showHistory ? (
          <>
            <h1 className="text-2xl font-bold text-center mb-6">门店进货单</h1>
            
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
                    进货日期
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
                    进货商品
                  </label>
                  
                  {formData.details.length > 0 ? (
                    <div className="space-y-2 mb-2">
                      {formData.details.map((detail, index) => (
                        <div key={detail.id} className="flex items-center gap-2">
                          <select
                            value={detail.productId}
                            onChange={(e) => handleProductChange(detail.id, e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value={0}>请选择商品</option>
                            {getAvailableProducts(detail.productId).map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="0"
                            step="0.0001"
                            value={detail.purchaseQuantity !== null ? detail.purchaseQuantity : ''}
                            onChange={(e) => handleQuantityChange(detail.id, e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="数量"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteDetail(detail.id)}
                            className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                          >
                            删除
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 italic p-2 text-center">暂无进货商品，请点击下方按钮添加</div>
                  )}
                  
                  <button
                    type="button"
                    onClick={handleAddDetail}
                    className="w-full mt-2 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    + 新增进货商品
                  </button>
                </div>
               
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? '提交中...' : '提交门店进货单'}
                </button>
                
                <button
                  type="button"
                  onClick={fetchHistory}
                  disabled={historyLoading}
                  className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {historyLoading ? '加载中...' : '查看历史进货单'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-center mb-4">历史进货记录</h2>
            
            {message && (
              <div className={`mb-4 p-3 rounded ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message}
              </div>
            )}
            
            {purchaseHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单据ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">进货日期</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchaseHistory.map((record, index) => (
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
                {historyLoading ? '加载中...' : '暂无进货记录'}
              </div>
            )}
            
            <button
              type="button"
              onClick={handleBackToSubmit}
              className="w-full mt-4 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              返回提交进货单
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StorePurchasePage;