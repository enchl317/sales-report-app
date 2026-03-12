// src/app/history/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import NavigationMenu from '@/components/NavigationMenu';
import { getCurrentUser } from '@/lib/auth';

interface SalesReport {
  id: string;
  userId: number;
  storeId: number;
  store_name: string;
  store_short_name: string;
  reportDate: string;
  totalSales: number;
  cashSales: number;
  cardSales: number;
  onlineSales: number;
  customerCount: number;
  notes: string;
  createdAt: string;
}

export default function HistoryPage() {
  const [reports, setReports] = useState<SalesReport[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }
      
      const user = getCurrentUser(token);
      if (!user) {
        router.push('/login');
        return;
      }
      
      setCurrentUser(user);
    }
  }, [router]);

  useEffect(() => {
    const fetchReports = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        const params = new URLSearchParams();
        // 根据用户角色，API会自动返回相应的数据
        // 员工只能看到自己的报告
        // 经理可以看到自己门店的报告
        // 管理员可以看到所有报告
        
        const response = await fetch(`/api/sales-report?${params}`);
        const result = await response.json();
        
        if (result.success) {
          setReports(result.data);
        } else {
          console.error('获取报告失败:', result.message);
        }
      } catch (error) {
        console.error('获取报告时出错:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [currentUser]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
    router.push('/login');
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('YYYY年MM月DD日');
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 max-w-md flex flex-col min-h-screen pb-16">
      <div className="flex items-center justify-between bg-white p-4 border-b">
        <button onClick={() => router.push('/')} className="text-blue-500">
          ← 返回
        </button>
        <span className="font-medium">历史记录</span>
        <button onClick={handleLogout} className="text-blue-500">
          退出
        </button>
      </div>

      <div className="flex-grow">
        <h2 className="text-lg font-medium mb-4">销售报告历史</h2>
        
        {loading ? (
          <div className="text-center py-8">加载中...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无记录</div>
        ) : (
          <div className="space-y-4">
            {reports.map(report => (
              <div key={report.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">[{report.store_short_name}] {report.store_name}</span>
                  <span className="text-blue-600 font-bold">¥{report.totalSales.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-500">
                  <div>日期: {formatDate(report.reportDate)}</div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>现金: ¥{report.cashSales.toFixed(2)}</div>
                    <div>刷卡: ¥{report.cardSales.toFixed(2)}</div>
                    <div>线上: ¥{report.onlineSales.toFixed(2)}</div>
                    <div>顾客数: {report.customerCount}</div>
                  </div>
                  {report.notes && (
                    <div className="mt-2 text-gray-600">备注: {report.notes}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NavigationMenu />
    </div>
  );
}