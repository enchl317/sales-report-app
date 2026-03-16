'use client';

import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import axios from 'axios';

interface Store {
  id: number;
  name: string;
  short_name: string;
}

interface MonthlyTarget {
  id: number;
  store_id: number;
  store_name: string;
  year: number;
  month: number;
  target_amount: number;
  created_at: string;
  updated_at: string;
}

const MonthlyTargetManagementPage: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [targets, setTargets] = useState<MonthlyTarget[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState<{[key: number]: boolean}>({});

  // 获取所有门店
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await axios.get('/api/stores');
        if (response.data.success) {
          setStores(response.data.stores);
        } else {
          alert('获取门店列表失败');
        }
      } catch (error) {
        console.error('获取门店列表失败:', error);
        alert('获取门店列表失败');
      }
    };

    fetchStores();
  }, []);

  // 获取指定门店和年份的目标数据
  const fetchTargets = async () => {
    if (!selectedStore || !selectedYear) {
      alert('请选择门店和年份');
      return;
    }

    setFetching(true);
    try {
      const response = await axios.get('/api/monthly-targets');
      if (response.data.success) {
        // 过滤出指定门店和年份的数据
        const filteredTargets = response.data.targets.filter((target: MonthlyTarget) => 
          target.store_id === selectedStore && target.year === parseInt(selectedYear)
        ) as MonthlyTarget[];
        
        // 确保每个月都有数据（即使数据库中没有）
        const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
        const updatedTargets = allMonths.map(month => {
          const existingTarget = filteredTargets.find(t => t.month === month);
          if (existingTarget) {
            return existingTarget;
          } else {
            return {
              id: 0,
              store_id: selectedStore,
              store_name: stores.find(s => s.id === selectedStore)?.name || '',
              year: parseInt(selectedYear),
              month: month,
              target_amount: 0,
              created_at: '',
              updated_at: ''
            };
          }
        });
        
        setTargets(updatedTargets);
      } else {
        alert('获取月度目标数据失败');
      }
    } catch (error) {
      console.error('获取月度目标数据失败:', error);
      alert('获取月度目标数据失败');
    } finally {
      setFetching(false);
    }
  };

  // 保存单个月份的目标
  const saveTarget = async (month: number, targetAmount: number) => {
    if (targetAmount < 0) {
      alert('销售阈值不能为负数');
      return;
    }

    setSaving(prev => ({ ...prev, [month]: true }));

    try {
      const response = await axios.post('/api/monthly-targets', {
        storeId: selectedStore,
        year: parseInt(selectedYear),
        month,
        targetAmount
      });

      if (response.data.success) {
        // 更新本地状态
        setTargets(prev => prev.map((target: MonthlyTarget) => 
          target.month === month 
            ? { ...target, target_amount: targetAmount, updated_at: new Date().toISOString() } 
            : target
        ));
        alert('保存成功');
      } else {
        alert(response.data.message || '保存失败');
      }
    } catch (error) {
      console.error('保存月度目标失败:', error);
      alert('保存失败');
    } finally {
      setSaving(prev => ({ ...prev, [month]: false }));
    }
  };

  // 年份选项（包含2026年及前后几年）
  const years = [2024, 2025, 2026, 2027, 2028];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">门店月度销售阈值标准维护</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择门店</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={selectedStore || ''}
              onChange={(e) => setSelectedStore(e.target.value ? Number(e.target.value) : null)}
              disabled={stores.length === 0}
            >
              <option value="">请选择门店</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.short_name} ({store.name})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择年份</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              disabled={!selectedStore}
            >
              <option value="">请选择年份</option>
              {years.map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button 
              className="w-full px-4 py-2 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700"
              onClick={fetchTargets}
              disabled={!selectedStore || !selectedYear || fetching}
            >
              {fetching ? '加载中...' : '查询'}
            </button>
          </div>
        </div>
        
        {targets.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    月份
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    销售阈值标准 (元)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {targets.map((target) => (
                  <tr key={target.month}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {target.month}月
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <input
                        type="number"
                        className="w-32 px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={target.target_amount}
                        onChange={(e) => {
                          const newValue = Number(e.target.value);
                          if (newValue >= 0) {
                            setTargets(prev => 
                              prev.map((t: MonthlyTarget) => 
                                t.month === target.month 
                                  ? { ...t, target_amount: newValue } 
                                  : t
                              )
                            );
                          }
                        }}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button 
                        className={`px-3 py-1 rounded text-white text-sm ${
                          saving[target.month] 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                        onClick={() => saveTarget(target.month, target.target_amount)}
                        disabled={saving[target.month]}
                      >
                        {saving[target.month] ? '保存中...' : '保存'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {targets.length === 0 && selectedStore && selectedYear && !fetching && (
          <div className="text-center py-8 text-gray-500">
            该门店在 {selectedYear} 年暂无数据
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyTargetManagementPage;