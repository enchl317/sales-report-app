// src/app/yearly-sales/page.tsx
'use client';

import { useState, useEffect } from 'react';

export default function YearlySalesPage() {
  const [yearlyData, setYearlyData] = useState<Record<string, Record<string, any[]>> | null>(null);
  const [totalData, setTotalData] = useState<Record<string, any[]> | null>(null);
  const [yearlyStoreTotals, setYearlyStoreTotals] = useState<Record<string, number> | null>(null);
  const [monthlyStoreTotals, setMonthlyStoreTotals] = useState<Record<string, Record<string, number>> | null>(null);
  const [totalYearlySales, setTotalYearlySales] = useState<number | null>(null);
  const [totalMonthlySales, setTotalMonthlySales] = useState<Record<string, number> | null>(null);
  const [monthlyTargets, setMonthlyTargets] = useState<Record<string, Record<string, number>> | null>(null); // 月度目标数据
  const [monthlyTotalTargets, setMonthlyTotalTargets] = useState<Record<string, number> | null>(null); // 每月总目标数据
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  // 状态管理每个月份的显示/隐藏
  const [visibleMonths, setVisibleMonths] = useState<Record<string, boolean>>({});
  const [visibleStoreMonths, setVisibleStoreMonths] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchYearlySales();
  }, [selectedYear]);

  useEffect(() => {
    // 初始化月份可见性，默认当前年月显示，其他隐藏
    if (totalData) {
      const initialVisible: Record<string, boolean> = {};
      const currentMonth = new Date().getMonth() + 1; // 月份从0开始，需要+1
      const currentYear = new Date().getFullYear();
      const selectedYearNum = parseInt(selectedYear);
      
      // 只有当选择的年份是当前年份时，才显示当前月份，其他情况都默认隐藏
      const sortedMonths = Object.keys(totalData).sort((a, b) => parseInt(b) - parseInt(a));
      sortedMonths.forEach((month) => {
        if (selectedYearNum === currentYear) {
          initialVisible[`total-${month}`] = parseInt(month) === currentMonth;
        } else {
          // 如果不是当前年份，则所有月份都默认隐藏
          initialVisible[`total-${month}`] = false;
        }
      });
      setVisibleMonths(initialVisible);
    }
    
    if (yearlyData) {
      const initialVisible: Record<string, boolean> = {};
      const currentMonth = new Date().getMonth() + 1; // 月份从0开始，需要+1
      const currentYear = new Date().getFullYear();
      const selectedYearNum = parseInt(selectedYear);
      
      Object.entries(yearlyData).forEach(([storeName, monthsData]) => {
        const sortedMonths = Object.keys(monthsData).sort((a, b) => parseInt(b) - parseInt(a));
        sortedMonths.forEach((month) => {
          if (selectedYearNum === currentYear) {
            initialVisible[`${storeName}-${month}`] = parseInt(month) === currentMonth;
          } else {
            // 如果不是当前年份，则所有月份都默认隐藏
            initialVisible[`${storeName}-${month}`] = false;
          }
        });
      });
      setVisibleStoreMonths(initialVisible);
    }
  }, [totalData, yearlyData, selectedYear]);

  const fetchYearlySales = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/yearly-sales?year=${selectedYear}`);
      const result = await response.json();
      
      if (result.success) {
        setYearlyData(result.data);
        setTotalData(result.totalData);
        setYearlyStoreTotals(result.yearlyStoreTotals);
        setMonthlyStoreTotals(result.monthlyStoreTotals);
        setTotalYearlySales(result.totalYearlySales);
        setTotalMonthlySales(result.totalMonthlySales);
        setMonthlyTargets(result.monthlyTargets); // 设置月度目标数据
        setMonthlyTotalTargets(result.monthlyTotalTargets); // 设置每月总目标数据
      } else {
        setError(result.message || '获取数据失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
      console.error('获取年度销售数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value);
  };

  const toggleMonthVisibility = (key: string) => {
    setVisibleMonths(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleStoreMonthVisibility = (key: string) => {
    setVisibleStoreMonths(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 生成过去几年的选项
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push(i);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6">年度销售汇总</h1>
          <div className="text-center py-8">加载中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6">年度销售汇总</h1>
          <div className="text-center py-8 text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">年度销售汇总</h1>
          <div>
            <label htmlFor="year-select" className="mr-2">选择年份:</label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={handleYearChange}
              className="border border-gray-300 rounded px-3 py-1"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
          </div>
        </div>

        {totalData && Object.keys(totalData).length > 0 && (
          <div className="mb-8 border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-blue-700">总销售汇总</h2>
              {totalYearlySales !== null && (
                <div className="text-lg font-medium">年度销售额: ¥{totalYearlySales.toFixed(2)}</div>
              )}
            </div>
            
            {Object.entries(totalData)
              .sort(([monthA], [monthB]) => parseInt(monthB) - parseInt(monthA))
              .map(([month, dailyRecords]) => {
                const isVisible = visibleMonths[`total-${month}`] ?? false;
                
                // 计算总销售的月度目标和达成率
                const hasTotalTarget = monthlyTotalTargets && monthlyTotalTargets[month];
                const totalTargetAmount = hasTotalTarget ? monthlyTotalTargets[month] : 0;
                const totalMonthlySalesValue = totalMonthlySales && totalMonthlySales[month] ? totalMonthlySales[month] : 0;
                const totalAchievementRate = totalTargetAmount > 0 ? (totalMonthlySalesValue / totalTargetAmount) * 100 : 0;
                
                return (
                  <div key={month} className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium text-gray-700">{month}月销售汇总</h3>
                      <div className="flex items-center space-x-4">
                        {totalMonthlySales && totalMonthlySales[month] && (
                          <div className="text-md font-medium">月度销售额: ¥{totalMonthlySales[month].toFixed(2)}</div>
                        )}
                        {hasTotalTarget && (
                          <>
                            <div className="text-md font-medium text-blue-600">月度目标: ¥{totalTargetAmount.toFixed(2)}</div>
                            <div className={`text-md font-medium ${
                              totalAchievementRate >= 100 ? 'text-emerald-800' : 
                              totalAchievementRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              达成率: {totalAchievementRate.toFixed(2)}%
                            </div>
                          </>
                        )}
                        <button
                          onClick={() => toggleMonthVisibility(`total-${month}`)}
                          className="ml-4 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm transition-colors"
                        >
                          {isVisible ? '隐藏' : '显示'}详情
                        </button>
                      </div>
                    </div>
                    
                    {isVisible && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总销售额</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">肉松销售额</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">其它销售额</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {dailyRecords.map((record, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{record.date}日</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">¥{parseFloat(record.total_sales).toFixed(2)}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">¥{parseFloat(record.meat_floss_sales).toFixed(2)}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">¥{parseFloat(record.other_sales).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {yearlyData && Object.keys(yearlyData).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(yearlyData).map(([storeName, monthsData]) => (
              <div key={storeName} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-blue-700">{storeName}</h2>
                  {yearlyStoreTotals && yearlyStoreTotals[storeName] && (
                    <div className="text-lg font-medium">年度销售额: ¥{yearlyStoreTotals[storeName].toFixed(2)}</div>
                  )}
                </div>
                
                {Object.entries(monthsData)
                  .sort(([monthA], [monthB]) => parseInt(monthB) - parseInt(monthA))
                  .map(([month, dailyRecords]) => {
                    const isVisible = visibleStoreMonths[`${storeName}-${month}`] ?? false;
                    
                    // 获取月度目标和计算达成率
                    const hasTarget = monthlyTargets && monthlyTargets[storeName] && monthlyTargets[storeName][month];
                    const targetAmount = hasTarget ? monthlyTargets[storeName][month] : 0;
                    const monthlySales = monthlyStoreTotals && monthlyStoreTotals[storeName] && monthlyStoreTotals[storeName][month] 
                      ? monthlyStoreTotals[storeName][month] 
                      : 0;
                    const achievementRate = targetAmount > 0 ? (monthlySales / targetAmount) * 100 : 0;
                    
                    return (
                      <div key={month} className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-medium text-gray-700">{month}月销售汇总</h3>
                          <div className="flex items-center space-x-4">
                            {monthlyStoreTotals && monthlyStoreTotals[storeName] && monthlyStoreTotals[storeName][month] && (
                              <div className="text-md font-medium">月度销售额: ¥{monthlyStoreTotals[storeName][month].toFixed(2)}</div>
                            )}
                            {hasTarget && (
                              <>
                                <div className="text-md font-medium text-blue-600">月度目标: ¥{targetAmount.toFixed(2)}</div>
                                <div className={`text-md font-medium ${
                                  achievementRate >= 100 ? 'text-emerald-800' : 
                                  achievementRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  达成率: {achievementRate.toFixed(2)}%
                                </div>
                              </>
                            )}
                            <button
                              onClick={() => toggleStoreMonthVisibility(`${storeName}-${month}`)}
                              className="ml-4 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm transition-colors"
                            >
                              {isVisible ? '隐藏' : '显示'}详情
                            </button>
                          </div>
                        </div>
                        
                        {isVisible && (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总销售额</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">肉松销售额</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">其它销售额</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>上报人</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {dailyRecords.map((record, index) => (
                                  <tr key={index}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{record.date}日</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">¥{parseFloat(record.total_sales).toFixed(2)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">¥{parseFloat(record.meat_floss_sales).toFixed(2)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">¥{parseFloat(record.other_sales).toFixed(2)}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500" style={{ minWidth: '120px' }}>
                                      {record.reporter_names && Array.isArray(record.reporter_names) 
                                        ? record.reporter_names.join(', ') 
                                        : record.reporter_names}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">暂无销售数据</div>
        )}
      </div>
    </div>
  );
}