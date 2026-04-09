'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

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
  id: number;
  productId: number;
  productName: string;
  purchaseQuantity: number;
  createdAt: string;
  updatedAt: string;
}

const StorePurchaseDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = useParams(); // id 现在可能是数字ID或文档ID
  const [storePurchase, setStorePurchase] = useState<StorePurchase | null>(null);
  const [details, setDetails] = useState<PurchaseDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStorePurchaseDetail = async () => {
      try {
        setLoading(true);
        // 尝试通过文档ID获取详情，如果失败再尝试通过ID获取
        let response;
        let result;
        
        // 首先尝试按文档ID获取（因为文档ID通常包含字母）
        if (typeof id === 'string' && isNaN(Number(id))) {
          response = await fetch(`/api/store-purchase/${encodeURIComponent(id)}`);
        } else {
          // 如果是纯数字，则按ID获取
          response = await fetch(`/api/store-purchase/${id}`);
        }
        
        result = await response.json();

        if (result.success) {
          setStorePurchase(result.storePurchase);
          setDetails(result.details);
        } else {
          setError(result.message || '获取进货详情失败');
        }
      } catch (err) {
        setError('获取进货详情失败');
        console.error('Error fetching store purchase detail:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStorePurchaseDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="text-red-500">错误: {error}</div>
        </div>
      </div>
    );
  }

  if (!storePurchase) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="text-gray-500">未找到进货记录</div>
        </div>
      </div>
    );
  }

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
        <h2 className="text-2xl font-bold text-center mb-6">门店进货详情</h2>
        
        {error && (
          <div className="mb-4 p-3 rounded bg-red-100 text-red-700">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              单据ID
            </label>
            <input
              type="text"
              value={storePurchase.documentId}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              门店
            </label>
            <input
              type="text"
              value={storePurchase.storeName}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              进货日期
            </label>
            <input
              type="text"
              value={formatDate(storePurchase.createdDate)}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              商品进货数量
            </label>
            <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-md p-2">
              {details.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名称</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">进货数量</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {details.map((detail) => (
                      <tr key={detail.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {detail.productName}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                           {detail.purchaseQuantity}
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-gray-500 italic p-2">暂无商品数据</div>
              )}
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
};

export default StorePurchaseDetailPage;