'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface StoreHeader {
  id: number;
  name: string;
  shortName: string;
  latestDate: string | null;
}

interface TableRow {
  productId: number;
  productName: string;
  specification: string;
  unit: string;
  storeData: { [storeId: number]: number | null };
}

const InventorySummaryPage: React.FC = () => {
  const router = useRouter();
  const [storeHeaders, setStoreHeaders] = useState<StoreHeader[]>([]);
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/inventory-summary');
        const data = await response.json();
        
        if (data.success) {
          setStoreHeaders(data.storeHeaders);
          setTableRows(data.tableRows);
        } else {
          setError(data.message || '获取数据失败');
        }
      } catch (err) {
        console.error('获取库存汇总数据失败:', err);
        setError('网络错误，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 格式化日期显示，只保留日期部分
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    // 如果包含时间，只取日期部分
    return dateStr.split(' ')[0];
  };

  // 格式化数量显示
  const formatQuantity = (quantity: number | null) => {
    if (quantity === null) return '-';
    return quantity;
  };

  // 跳转到盘点详情页面
  const handleViewDetail = (storeId: number) => {
    router.push(`/inventory-count?storeId=${storeId}`);
  };

  // 导出Excel
  const handleExport = () => {
    window.open('/api/inventory-summary?action=export', '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 页面头部 */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-full mx-auto px-2 py-4 flex items-center justify-between">
          <div className="flex-1"></div>
          <h1 className="text-xl font-bold text-gray-800 text-center">库存汇总</h1>
          <div className="flex-1 flex justify-end">
            <button
              onClick={handleExport}
              disabled={loading}
              className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              导出Excel
            </button>
          </div>
        </div>
      </div>

      {/* 说明文字 */}
      <div className="max-w-full mx-auto px-2 py-2">
        <p className="text-sm text-gray-500">
          展示各门店最新一次库存盘点的数据，"-"表示该门店未进行过盘点或该商品未录入
        </p>
      </div>

      {/* 表格容器 */}
      <div className="max-w-full mx-auto px-2 overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="min-w-full bg-white border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="sticky left-0 z-20 px-2 py-2 border border-gray-300 bg-gray-100 text-left font-semibold w-48">
                  商品
                </th>
                <th className="px-2 py-2 border border-gray-300 bg-gray-100 text-center font-semibold w-24">
                  规格
                </th>
                <th className="px-2 py-2 border border-gray-300 bg-gray-100 text-center font-semibold w-16">
                  单位
                </th>
                {storeHeaders.map(store => (
                  <th 
                    key={store.id} 
                    className="px-2 py-2 border border-gray-300 bg-gray-100 text-center font-semibold min-w-24"
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">{store.name}</span>
                      <button
                        onClick={() => handleViewDetail(store.id)}
                        className={`text-xs mt-1 px-1 py-0.5 rounded ${
                          store.latestDate 
                            ? 'text-blue-600 hover:bg-blue-50 cursor-pointer' 
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!store.latestDate}
                        title={store.latestDate ? `查看详情（${store.latestDate}）` : '暂无盘点数据'}
                      >
                        {store.latestDate ? formatDate(store.latestDate) : '未盘点'}
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td 
                    colSpan={3 + storeHeaders.length} 
                    className="px-2 py-4 border border-gray-300 text-center text-gray-500"
                  >
                    暂无商品数据
                  </td>
                </tr>
              ) : (
                tableRows.map((row, index) => (
                  <tr 
                    key={row.productId} 
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="sticky left-0 z-10 px-2 py-2 border border-gray-300 bg-inherit">
                      {row.productName}
                    </td>
                    <td className="px-2 py-2 border border-gray-300 text-center">
                      {row.specification || '-'}
                    </td>
                    <td className="px-2 py-2 border border-gray-300 text-center">
                      {row.unit || '-'}
                    </td>
                    {storeHeaders.map(store => (
                      <td 
                        key={store.id} 
                        className="px-2 py-2 border border-gray-300 text-center"
                      >
                        {formatQuantity(row.storeData[store.id])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventorySummaryPage;
