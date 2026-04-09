'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

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

interface TransferRecord {
  id: number;
  documentId: string;
  createdDate: string;
  targetStoreId: number;
  targetStoreName: string;
  sourceStoreId: number;
  sourceStoreName: string;
  createdAt: string;
  updatedAt: string;
}

interface TransferDetail {
  id: string;
  productId: number;
  productName: string;
  transferQuantity: number | null;
}

const StoreTransferPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeIdFromUrl = searchParams.get('storeId');

  const [formData, setFormData] = useState({
    targetStoreId: storeIdFromUrl || '',
    targetStoreShortName: '',
    sourceStoreId: '',
    createdDate: new Date().toISOString().split('T')[0],
    details: [{ id: 'temp-0', productId: 0, productName: '', transferQuantity: null }] as TransferDetail[]
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(false);
  const [transferHistory, setTransferHistory] = useState<TransferRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentStoreType, setCurrentStoreType] = useState<number>(0); // 门店类型：0-线下门店，1-电商门店

  // 获取门店列表
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch('/api/stores');
        const data = await response.json();
        if (data.success) {
          setStores(data.stores);

          // 如果URL中有storeId参数，设置对应的门店信息
          if (storeIdFromUrl) {
            const store = data.stores.find((s: any) => s.id == storeIdFromUrl);
            if (store) {
              setFormData(prev => ({
                ...prev,
                targetStoreShortName: store.short_name
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

  // 当目标门店、来源门店或日期变化时，加载该门店当日的调拨记录
  useEffect(() => {
    const loadTodayTransfer = async () => {
      if (formData.targetStoreId && formData.createdDate && formData.sourceStoreId) {
        try {
          const response = await fetch(`/api/store-transfer?storeId=${formData.targetStoreId}&date=${formData.createdDate}`);
          const result = await response.json();

          // 筛选出来源门店也匹配的记录
          const matchingTransfer = result.storeTransfers?.find((t: any) => 
            Number(t.sourceStoreId) === Number(formData.sourceStoreId)
          );

          if (matchingTransfer) {
            // 存在当日记录，加载已有的调拨商品
            const detailResponse = await fetch(`/api/store-transfer/${matchingTransfer.id}`);
            const detailResult = await detailResponse.json();

            if (detailResult.success && detailResult.details) {
              const loadedDetails = detailResult.details.map((d: any) => ({
                id: `temp-${d.id}`,
                productId: d.productId,
                productName: d.productName,
                transferQuantity: d.transferQuantity
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
              details: [{ id: 'temp-0', productId: 0, productName: '', transferQuantity: null }]
            }));
          }
        } catch (error) {
          console.error('加载当日调拨记录失败:', error);
        }
      }
    };

    loadTodayTransfer();
  }, [formData.targetStoreId, formData.createdDate, formData.sourceStoreId]);

  // 获取历史调拨记录
  const fetchHistory = async () => {
    if (!formData.targetStoreId) {
      setMessage('请先选择门店');
      setMessageType('error');
      return;
    }

    setHistoryLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/store-transfer?storeId=${formData.targetStoreId}`);
      const result = await response.json();

      if (result.success) {
        setTransferHistory(result.storeTransfers);
        setShowHistory(true);
        setMessage('');
      } else {
        setMessage(result.message || '获取历史调拨记录失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('获取历史调拨记录失败');
      setMessageType('error');
    } finally {
      setHistoryLoading(false);
    }
  };

  // 当门店变化时，清空历史记录显示
  useEffect(() => {
    if (formData.targetStoreId) {
      setShowHistory(false);
      setTransferHistory([]);
    }
  }, [formData.targetStoreId]);

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
          ? { ...detail, transferQuantity: numValue }
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
    const newDetail: TransferDetail = {
      id: `temp-${Date.now()}`,
      productId: 0,
      productName: '',
      transferQuantity: null
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

    // 如果选择了目标门店，自动填充门店信息
    if (name === 'targetStoreId') {
      const selectedStore = stores.find(store => store.id === Number(value));
      if (selectedStore) {
        setFormData(prev => ({
          ...prev,
          targetStoreShortName: selectedStore.short_name,
          sourceStoreId: '', // 清除来源门店选择
          details: [{ id: 'temp-0', productId: 0, productName: '', transferQuantity: null }] // 切换门店时重置为默认一行
        }));
        setCurrentStoreType(selectedStore.store_type);
      }
    }
  };

  // 提交调拨单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.targetStoreId || !formData.sourceStoreId) {
      setMessage('请选择目标门店和来源门店');
      setMessageType('error');
      return;
    }

    if (formData.targetStoreId === formData.sourceStoreId) {
      setMessage('目标门店和来源门店不能相同');
      setMessageType('error');
      return;
    }

    // 获取有效的商品明细（过滤掉productId为0或quantity为null的）
    const validDetails = formData.details.filter(d => d.productId > 0 && d.transferQuantity !== null);

    if (validDetails.length === 0) {
      setMessage('请至少填写一个商品的调拨数量');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const targetStore = stores.find(s => s.id === Number(formData.targetStoreId));
      const sourceStore = stores.find(s => s.id === Number(formData.sourceStoreId));

      const response = await fetch('/api/store-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetStoreId: parseInt(formData.targetStoreId),
          targetStoreName: targetStore?.name || '',
          sourceStoreId: parseInt(formData.sourceStoreId),
          sourceStoreName: sourceStore?.name || '',
          createdDate: formData.createdDate,
          details: validDetails.map(d => ({
            productId: d.productId,
            productName: d.productName,
            transferQuantity: d.transferQuantity
          })),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage('提交成功');
        setMessageType('success');
        
        // 重新加载当日数据
        setTimeout(async () => {
          const response = await fetch(`/api/store-transfer?storeId=${formData.targetStoreId}&date=${formData.createdDate}`);
          const data = await response.json();
          
          if (data.success && data.storeTransfers && data.storeTransfers.length > 0) {
            // 筛选出来源门店匹配的记录
            const matchingTransfer = data.storeTransfers.find((t: any) => 
              Number(t.sourceStoreId) === Number(formData.sourceStoreId)
            );
            
            if (matchingTransfer) {
              const detailResponse = await fetch(`/api/store-transfer/${matchingTransfer.id}`);
              const detailResult = await detailResponse.json();
              
              if (detailResult.success && detailResult.details) {
                const loadedDetails = detailResult.details.map((d: any) => ({
                  id: `temp-${d.id}`,
                  productId: d.productId,
                  productName: d.productName,
                  transferQuantity: d.transferQuantity
                }));
                setFormData(prev => ({
                  ...prev,
                  details: loadedDetails
                }));
              }
            }
          }
        }, 500);
      } else {
        setMessage(result.message || '提交失败');
        setMessageType('error');
      }
    } catch (err) {
      console.error('提交失败:', err);
      setMessage('提交失败');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // 切换显示历史记录
  const handleShowHistory = async () => {
    if (!showHistory) {
      await fetchHistory();
    }
    setShowHistory(!showHistory);
  };

  // 获取可用的来源门店列表（不包括当前目标门店）
  const getAvailableSourceStores = () => {
    const targetId = Number(formData.targetStoreId);
    return stores.filter(store => store.id !== targetId);
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

  // 处理返回提交页面
  const handleBackToSubmit = () => {
    setShowHistory(false);
    setTransferHistory([]);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-20">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        {!showHistory ? (
          <>
            <h1 className="text-2xl font-bold text-center mb-6">门店调拨</h1>
            
            {message && (
              <div className={`mb-4 p-3 rounded ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* 目标门店 */}
                {storeIdFromUrl ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      目标门店
                    </label>
                    <input
                      type="text"
                      value={formData.targetStoreShortName}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="targetStoreId" className="block text-sm font-medium text-gray-700 mb-1">
                      目标门店
                    </label>
                    <select
                      id="targetStoreId"
                      name="targetStoreId"
                      value={formData.targetStoreId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">请选择目标门店</option>
                      {stores.map(store => (
                        <option key={store.id} value={store.id}>
                          {store.name} ({store.short_name})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* 调拨日期 */}
                <div>
                  <label htmlFor="createdDate" className="block text-sm font-medium text-gray-700 mb-1">
                    调拨日期
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

                {/* 来源门店选择 */}
                <div>
                  <label htmlFor="sourceStoreId" className="block text-sm font-medium text-gray-700 mb-1">
                    来源门店
                  </label>
                  <select
                    id="sourceStoreId"
                    name="sourceStoreId"
                    value={formData.sourceStoreId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">请选择来源门店</option>
                    {getAvailableSourceStores().map(store => (
                      <option key={store.id} value={store.id}>
                        {store.name} ({store.short_name})
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 调拨商品 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    调拨商品
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
                            value={detail.transferQuantity !== null ? detail.transferQuantity : ''}
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
                    <div className="text-gray-500 italic p-2 text-center">暂无调拨商品，请点击下方按钮添加</div>
                  )}
                  
                  <button
                    type="button"
                    onClick={handleAddDetail}
                    className="w-full mt-2 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    + 新增调拨商品
                  </button>
                </div>
               
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
                >
                  {loading ? '提交中...' : '提交调拨单'}
                </button>
                
                {/* 查看历史调拨单按钮 */}
                <button
                  type="button"
                  onClick={handleShowHistory}
                  disabled={historyLoading}
                  className="w-full mt-3 bg-green-600 text-white py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-400"
                >
                  {historyLoading ? '加载中...' : '查看历史调拨单'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">历史调拨单</h1>
              <button
                onClick={handleBackToSubmit}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                返回
              </button>
            </div>

            {transferHistory.length > 0 ? (
              <div className="space-y-2">
                {transferHistory.map(record => (
                  <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div>
                      <Link
                        href={`/store-transfer/detail/${record.documentId}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {record.documentId}
                      </Link>
                      <span className="ml-2 text-gray-500">
                        {formatDate(record.createdDate)}
                      </span>
                      <span className="ml-2 text-gray-500">
                        ← {record.sourceStoreName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">暂无历史调拨单</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StoreTransferPage;