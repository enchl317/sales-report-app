'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Transfer {
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
  id: number;
  productId: number;
  productName: string;
  transferQuantity: number;
}

const StoreTransferDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;

  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [details, setDetails] = useState<TransferDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransferDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/store-transfer/${documentId}`);
        const result = await response.json();

        if (result.success) {
          setTransfer(result.transfer);
          setDetails(result.details || []);
        } else {
          setError(result.message || '获取调拨单详情失败');
        }
      } catch (err) {
        setError('获取调拨单详情失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchTransferDetail();
    }
  }, [documentId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8">
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <button
              onClick={handleBack}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-20">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">门店调拨单详情</h1>
        
        {transfer && (
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">单据ID</label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  {transfer.documentId}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">调拨日期</label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  {formatDate(transfer.createdDate)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">目标门店</label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  {transfer.targetStoreName}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">来源门店</label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  {transfer.sourceStoreName}
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold mb-4">调拨商品明细</h2>
          
          {details.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">序号</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名称</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">调拨数量</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {details.map((detail, index) => (
                    <tr key={detail.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{detail.productName}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{detail.transferQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">暂无调拨明细</div>
          )}
        </div>

        <button
          onClick={handleBack}
          className="w-full mt-6 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          返回
        </button>
      </div>
    </div>
  );
};

export default StoreTransferDetailPage;