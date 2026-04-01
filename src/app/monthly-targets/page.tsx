'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MonthlyTargetsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [stores, setStores] = useState<any[]>([]);
  const [targets, setTargets] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  

  const router = useRouter();

  useEffect(() => {
    fetchStores();
    fetchTargets();
  }, [year, month]);

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/stores');
      const result = await response.json();
      
      // 确保返回的是stores数组
      const storesData = result.stores || result || [];
      setStores(Array.isArray(storesData) ? storesData : []);
      
      // 初始化targets状态
      const initialTargets: Record<number, number> = {};
      if (Array.isArray(storesData)) {
        storesData.forEach((store: any) => {
          initialTargets[store.id] = 0;
        });
      }
      setTargets(initialTargets);
    } catch (error) {
      console.error('获取门店列表失败:', error);
      setStores([]); // 确保在错误情况下stores是空数组
    }
  };

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/monthly-targets?year=${year}&month=${month}`);
      const result = await response.json();

      // API返回的是 { success: true, targets: [...] } 格式
      const targetsData = result.success && Array.isArray(result.targets) ? result.targets : [];
      const targetsMap: Record<number, number> = {};

      targetsData.forEach((target: any) => {
        targetsMap[target.store_id] = parseFloat(target.target_amount);
      });

      setTargets(prev => ({ ...prev, ...targetsMap }));
    } catch (error) {
      console.error('获取目标数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTargetChange = (storeId: number, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setTargets(prev => ({
      ...prev,
      [storeId]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/monthly-targets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year,
          month,
          targets: Object.entries(targets).map(([storeId, targetAmount]) => ({
            storeId: parseInt(storeId),
            targetAmount
          }))
        })
      });

      if (response.ok) {
        setMessage('月度目标保存成功！');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setMessage(`保存失败: ${errorData.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('保存目标失败:', error);
      setMessage('保存失败，请重试');
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(parseInt(e.target.value));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonth(parseInt(e.target.value));
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">月度销售目标设置</h1>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('成功') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              年份
            </label>
            <select
              id="year"
              value={year}
              onChange={handleYearChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {generateYearOptions().map(y => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
              月份
            </label>
            <select
              id="month"
              value={month}
              onChange={handleMonthChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}月</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-3">
            {year}年{month}月 目标设置
          </h2>
          
          {loading ? (
            <div className="text-center py-4">加载中...</div>
          ) : (
            <div className="space-y-3">
              {Array.isArray(stores) && stores.map(store => (
                <div key={store.id} className="flex items-center justify-between p-3 border-b border-gray-200">
                  <span className="font-medium">{store.short_name} ({store.name})</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">¥</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={targets[store.id] !== undefined ? targets[store.id] : ''}
                      onChange={(e) => handleTargetChange(store.id, e.target.value)}
                      className="w-40 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="输入目标金额"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? '保存中...' : '保存目标'}
        </button>
      </form>
      
      <button
        onClick={() => router.back()}
        className="mt-4 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
      >
        返回
      </button>
    </div>
  );
}