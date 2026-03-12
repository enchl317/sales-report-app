// src/app/stats/page.tsx
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

interface StoreStats {
  storeId: number;
  storeName: string;
  storeShortName: string;
  totalSales: number;
  avgDailySales: number;
  totalCustomers: number;
  reportDays: number;
}

export default function StatsPage() {
  const [reports, setReports] = useState<SalesReport[]>([]);
  const [stats, setStats] = useState<StoreStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 检查用户认证状态
  useEffect(() => {
    // 确保在客户端环境下才使用 localStorage
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

  // 获取销售报告数据
  useEffect(() => {
    const fetchReports = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        // 获取所有报告（管理员权限下）
        const params = new URLSearchParams({
          ...(filterDate && { date: filterDate })
        });
        
        const response = await fetch(`/api/sales-report?${params}`);
        const result = await response.json();
        
        if (result.success) {
          setReports(result.data);
          
          // 计算统计数据
          const storeMap: Record<number, StoreStats> = {};
          
          // 初始化门店数据
          for (let i = 1; i <= 6; i++) {
            storeMap[i] = {
              storeId: i,
              storeName: `门店 ${i}`,
              storeShortName: `店${i}`,
              totalSales: 0,
              avgDailySales: 0,
              totalCustomers: 0,
              reportDays: 0
            };
          }
          
          // 汇总数据
          result.data.forEach((report: SalesReport) => {
            const storeStat = storeMap[report.storeId];
            if (storeStat) {
              storeStat.totalSales += report.totalSales;
              storeStat.totalCustomers += report.customerCount;
              storeStat.reportDays += 1;
            }
          });
          
          // 计算平均值
          Object.values(storeMap).forEach(stat => {
            stat.avgDailySales = stat.reportDays > 0 ? stat.totalSales / stat.reportDays : 0;
          });
          
          setStats(Object.values(storeMap));
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
  }, [currentUser, filterDate]);

  const handleLogout = () => {
    // 确保在客户端环境下才使用 localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
    router.push('/login');
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('YYYY年MM月DD日');
  };

  if (!currentUser) {
    return null; // 或者显示加载状态
  }

  // 计算总体统计
  const totalSales = stats.reduce((sum, stat) => sum + stat.totalSales, 0);
  const totalCustomers = stats.reduce((sum, stat) => sum + stat.totalCustomers, 0);
  const totalReportDays = stats.reduce((sum, stat) => sum + stat.reportDays, 0);
  const avgDailySales = totalReportDays > 0 ? totalSales / totalReportDays : 0;

  return (
    <div className="container mx-auto p-4 max-w-md flex flex-col min-h-screen pb-16">
      <div className="flex items-center justify-between bg-white p-4 border-b">
        <button onClick={() => router.push('/')} className="text-blue-500">
          ← 返回
        </button>
        <span className="font-medium">数据统计</span>
        <button onClick={handleLogout} className="text-blue-500">
          退出
        </button>
      </div>

      <div className="flex-grow">
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h3 className="font-medium mb-4">总体概览</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">总销售额</div>
              <div className="text-xl font-bold text-blue-600">¥{totalSales.toFixed(2)}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">总顾客数</div>
              <div className="text-xl font-bold text-blue-600">{totalCustomers}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">平均日销售额</div>
              <div className="text-xl font-bold text-blue-600">¥{avgDailySales.toFixed(2)}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">报告天数</div>
              <div className="text-xl font-bold text-blue-600">{totalReportDays}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h3 className="font-medium mb-4">筛选条件</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">选择日期</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded"
              value={filterDate || ''}
              onChange={(e) => setFilterDate(e.target.value || null)}
            />
          </div>
          <button 
            onClick={() => setFilterDate(null)}
            className="w-full p-2 bg-blue-500 text-white rounded"
          >
            清除筛选
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-4">各门店销售统计</h3>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <div className="space-y-4">
              {stats.map(stat => (
                <div key={stat.storeId} className="border-b pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">[{stat.storeShortName}] {stat.storeName}</span>
                    <span className="text-blue-600 font-bold">¥{stat.totalSales.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-gray-500 grid grid-cols-2 gap-2">
                    <div>平均日销售额: ¥{stat.avgDailySales.toFixed(2)}</div>
                    <div>总顾客数: {stat.totalCustomers}</div>
                    <div>报告天数: {stat.reportDays}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <NavigationMenu />
    </div>
  );
}