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

interface InventoryItem {
  productId: number;
  productName: string;
  specification: string;
  unit: string;
  baseCount: number;
  purchaseTotal: number;
  transferInTotal: number;
  transferOutTotal: number;
  currentInventory: number;
  changes: Array<{
    quantity: number;
    documentId: string;
    date: string;
    type: string;
    detail?: string;
  }>;
  hasInventory: boolean;
}

const StoreInventoryPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeIdFromUrl = searchParams.get('storeId');

  const [formData, setFormData] = useState({
    storeId: storeIdFromUrl || '',
    storeShortName: '',
    targetDate: new Date().toISOString().split('T')[0],
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [countDocumentId, setCountDocumentId] = useState<string | null>(null);
  const [countDate, setCountDate] = useState<string | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  const [hasData, setHasData] = useState(false);

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

  // 查询库存数据
  const fetchInventory = async () => {
    if (!formData.storeId || !formData.targetDate) {
      setMessage('请先选择门店和日期');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    setExpandedProducts(new Set());

    try {
      const response = await fetch(`/api/store-inventory?storeId=${formData.storeId}&targetDate=${formData.targetDate}`);
      const data = await response.json();

      if (data.success) {
        setInventoryData(data.data.inventoryData);
        setCountDocumentId(data.data.countDocumentId);
        setCountDate(data.data.countDate);
        setHasData(true);
        setMessage('');
      } else {
        setMessage(data.message || '获取库存数据失败');
        setMessageType('error');
      }
    } catch (err) {
      console.error('获取库存数据失败:', err);
      setMessage('网络错误，请稍后重试');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // 当门店变化时，清空数据
  useEffect(() => {
    if (formData.storeId) {
      setHasData(false);
      setInventoryData([]);
      setCountDocumentId(null);
      setCountDate(null);
    }
  }, [formData.storeId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'storeId') {
      const selectedStore = stores.find(store => store.id == parseInt(value));
      if (selectedStore) {
        setFormData(prev => ({
          ...prev,
          storeShortName: selectedStore.short_name
        }));
      }
      setHasData(false);
      setInventoryData([]);
    }
  };

  // 展开/折叠商品变化详情
  const toggleProductExpand = (productId: number) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // 格式化数量
  const formatQty = (num: number) => {
    if (num === 0) return '0';
    const fixed = Number(num.toFixed(4));
    return String(fixed);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-20">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">门店库存</h1>

        {message && (
          <div className={`mb-4 p-3 rounded ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="space-y-4">
          {storeIdFromUrl ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">门店</label>
              <input
                type="text"
                value={formData.storeShortName}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="storeId" className="block text-sm font-medium text-gray-700 mb-1">选择门店</label>
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
            <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-1">预估日期</label>
            <input
              type="date"
              id="targetDate"
              name="targetDate"
              value={formData.targetDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="button"
            onClick={fetchInventory}
            disabled={loading || !formData.storeId || !formData.targetDate}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? '查询中...' : '查询库存'}
          </button>
        </div>

        {/* 盘点基准信息 */}
        {hasData && countDate && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            <span className="font-semibold">盘点基准：</span>
            <span>基于 {countDate} 的盘点单 </span>
            <span className="font-mono text-blue-600">{countDocumentId}</span>
            <span>，之后加上进货和调拨变化计算当前库存</span>
          </div>
        )}

        {/* 库存表格 */}
        {hasData && inventoryData.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">库存数据</label>
            <div className="max-h-[500px] overflow-y-auto border border-gray-300 rounded-md p-2">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">商品</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">单位</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">盘点库存</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-green-600 uppercase">进货</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-blue-600 uppercase">调拨入</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-red-600 uppercase">调拨出</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-yellow-700 uppercase bg-yellow-50">当前库存</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">详情</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventoryData.map((item) => {
                    const hasChanges = item.changes.length > 0;
                    const isExpanded = expandedProducts.has(item.productId);

                    return (
                      <React.Fragment key={item.productId}>
                        <tr className={hasChanges ? 'cursor-pointer hover:bg-blue-50' : ''}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.productName}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-center text-gray-500">{item.unit || '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-center">{formatQty(item.baseCount)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-center text-green-600">
                            {item.purchaseTotal > 0 ? `+${formatQty(item.purchaseTotal)}` : formatQty(item.purchaseTotal)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-center text-blue-600">
                            {item.transferInTotal > 0 ? `+${formatQty(item.transferInTotal)}` : formatQty(item.transferInTotal)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-center text-red-600">
                            {item.transferOutTotal > 0 ? `-${formatQty(item.transferOutTotal)}` : formatQty(item.transferOutTotal)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-center font-semibold bg-yellow-50">{formatQty(item.currentInventory)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                            {hasChanges ? (
                              <button
                                onClick={() => toggleProductExpand(item.productId)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                {isExpanded ? '收起' : '展开'}
                              </button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                        {isExpanded && hasChanges && (
                          <tr className="bg-blue-50">
                            <td colSpan={8} className="px-3 py-2">
                              <div className="space-y-1">
                                {item.changes.map((change, ci) => (
                                  <div key={ci} className="flex items-center gap-2 text-xs">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-white ${
                                      change.type === '进货' ? 'bg-green-500' :
                                      change.type === '调拨入' ? 'bg-blue-500' :
                                      'bg-red-500'
                                    }`}>
                                      {change.type}
                                    </span>
                                    <span className="text-gray-600">{change.date}</span>
                                    <span className="font-mono text-indigo-600 hover:text-indigo-900 cursor-pointer"
                                      onClick={() => {
                                        if (change.type === '进货') {
                                          router.push(`/store-purchase/detail/${change.documentId}`);
                                        } else {
                                          router.push(`/store-transfer/detail/${change.documentId}`);
                                        }
                                      }}
                                    >
                                      {change.documentId}
                                    </span>
                                    {change.detail && <span className="text-gray-500">{change.detail}</span>}
                                    <span className={`font-semibold ${
                                      change.quantity > 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {change.quantity > 0 ? `+${formatQty(change.quantity)}` : formatQty(change.quantity)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!hasData && !loading && !message && (
          <div className="mt-4 text-center py-4 text-gray-500">
            请选择门店和日期后点击"查询库存"按钮
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreInventoryPage;