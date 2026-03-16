'use client';

import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import axios from 'axios';

interface StoreSaleRecord {
  id: number;
  store_id: number;
  store_short_name: string;
  report_date: string;
  total_sales: number;
  reporter_ids: string; // JSON string
  reporter_names: string; // JSON string
}

interface EmployeeSaleStat {
  storeName: string;
  date: string;
  storeId: number;
  personalSales: number;
  totalDailySales: number;
  reporterCount: number;
}

interface StoreSummary {
  storeName: string;
  storeId: number;
  totalSales: number;
  attendanceCount: number; // 出勤数
  storeCurrentTotalSales: number; // 该门店目前总销售额
  storeMonthlyTarget: number; // 该门店本月的销售阈值标准
  currentWagePercentage: number; // 目前执行工资百分比
}

interface User {
  id: number;
  name: string;
}

const EmployeeSalesStatsPage: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [statsData, setStatsData] = useState<EmployeeSaleStat[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [totalAttendance, setTotalAttendance] = useState<number>(0); // 总出勤数
  const [budgetSalary, setBudgetSalary] = useState<number>(0); // 预算工资
  const [storeSummaries, setStoreSummaries] = useState<StoreSummary[]>([]);

  // 获取所有员工列表
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get('/api/users'); // 假设有一个API获取用户列表
        if (response.data.success) {
          setEmployees(response.data.users);
        } else {
          alert('获取员工列表失败');
        }
      } catch (error) {
        console.error('获取员工列表失败:', error);
        alert('获取员工列表失败');
      }
    };

    fetchEmployees();
  }, []);

  // 计算员工销售额统计
  const calculateEmployeeSales = async () => {
    if (!selectedEmployee || !selectedMonth) {
      alert('请选择员工和月份');
      return;
    }

    setLoading(true);
    try {
      // 获取指定月份的所有销售记录
      const response = await axios.get(`/api/store-sales?month=${selectedMonth}`);
      if (response.data.success) {
        const records: StoreSaleRecord[] = response.data.records;
        
        // 获取月度销售目标
        const monthlyTargetsResponse = await axios.get('/api/monthly-targets');
        let monthlyTargets = [];
        if (monthlyTargetsResponse.data.success) {
          monthlyTargets = monthlyTargetsResponse.data.targets;
        }
        
        // 找到选中员工的信息
        const employeeInfo = employees.find(emp => emp.id === selectedEmployee);
        if (!employeeInfo) {
          alert('找不到选中的员工');
          setLoading(false);
          return;
        }
        
        const employeeName = employeeInfo.name;
        
        // 计算该员工在该月的销售额统计
        const calculatedStats: EmployeeSaleStat[] = [];
        let totalPersonalSales = 0;
        
        // 用于存储门店汇总数据
        const storeSummaryMap: { [key: number]: StoreSummary } = {};
        
        // 按门店分组所有记录，用于计算门店总销售额
        const storeRecordsMap: { [key: number]: StoreSaleRecord[] } = {};
        for (const record of records) {
          if (!storeRecordsMap[record.store_id]) {
            storeRecordsMap[record.store_id] = [];
          }
          storeRecordsMap[record.store_id].push(record);
        }
        
        for (const record of records) {
          // 直接使用已解析的上报人信息
          // 注意：API返回的数据已经是解析后的数组，不需要再次解析
          const reporterIds: number[] = Array.isArray(record.reporter_ids) 
            ? record.reporter_ids 
            : JSON.parse(record.reporter_ids);
          const reporterNames: string[] = Array.isArray(record.reporter_names) 
            ? record.reporter_names 
            : JSON.parse(record.reporter_names);
          
          // 检查该员工是否是当天的上报人之一
          const employeeIndex = reporterNames.indexOf(employeeName);
          if (employeeIndex !== -1) {
            // 计算该员工当天的个人销售额
            const personalSales = record.total_sales / reporterIds.length;
            
            calculatedStats.push({
              storeName: record.store_short_name,
              date: dayjs(record.report_date).format('YYYY-MM-DD'),
              storeId: record.store_id,
              personalSales: parseFloat(personalSales.toFixed(2)),
              totalDailySales: record.total_sales,
              reporterCount: reporterIds.length
            });
            
            totalPersonalSales += personalSales;
            
            // 更新门店汇总数据
            if (!storeSummaryMap[record.store_id]) {
              // 计算门店总销售额
              let storeCurrentTotalSales = 0;
              if (record.store_id === 1 || record.store_id === 5) { // 南东店(1)和杨浦店(5)
                // 南东和杨浦店：汇总两店的每日销售额
                const nanDongRecords = storeRecordsMap[1] || [];
                const yangPuRecords = storeRecordsMap[5] || [];
                
                for (const ndRecord of nanDongRecords) {
                  storeCurrentTotalSales += ndRecord.total_sales;
                }
                for (const ypRecord of yangPuRecords) {
                  storeCurrentTotalSales += ypRecord.total_sales;
                }
              } else {
                // 其他门店：只计算本门店的每日销售额
                const storeRecords = storeRecordsMap[record.store_id] || [];
                for (const sRecord of storeRecords) {
                  storeCurrentTotalSales += sRecord.total_sales;
                }
              }
              
              // 计算门店销售阈值标准
              let storeMonthlyTarget = 0;
              const year = selectedMonth.split('-')[0];
              const month = parseInt(selectedMonth.split('-')[1]);
              
              if (record.store_id === 1 || record.store_id === 5) { // 南东店(1)和杨浦店(5)
                // 南东和杨浦店：汇总两店的销售阈值标准
                const nanDongTarget = monthlyTargets.find(
                  (target: any) => target.store_id === 1 && target.year == year && target.month == month
                );
                const yangPuTarget = monthlyTargets.find(
                  (target: any) => target.store_id === 5 && target.year == year && target.month == month
                );
                
                storeMonthlyTarget = (nanDongTarget?.target_amount || 0) + (yangPuTarget?.target_amount || 0);
              } else {
                // 其他门店：只取本门店的销售阈值标准
                const target = monthlyTargets.find(
                  (target: any) => target.store_id === record.store_id && target.year == year && target.month == month
                );
                storeMonthlyTarget = target?.target_amount || 0;
              }
              
              storeSummaryMap[record.store_id] = {
                storeName: record.store_short_name,
                storeId: record.store_id,
                totalSales: 0,
                attendanceCount: 0, // 出勤数
                storeCurrentTotalSales: parseFloat(storeCurrentTotalSales.toFixed(2)), // 该门店目前总销售额
                storeMonthlyTarget: parseFloat(storeMonthlyTarget.toFixed(2)), // 该门店本月的销售阈值标准
                currentWagePercentage: 0 // 目前执行工资百分比，稍后计算
              };
            }
            
            storeSummaryMap[record.store_id].totalSales += personalSales;
            storeSummaryMap[record.store_id].attendanceCount += 1;
          }
        }
        
        setStatsData(calculatedStats);
        setTotalAmount(parseFloat(totalPersonalSales.toFixed(2)));
        
        // 计算总出勤数：该员工在当月的销售上报中出现的记录数总和
        const totalAttendanceCount = calculatedStats.length;
        setTotalAttendance(totalAttendanceCount);
        
        // 获取员工门店工资百分比数据
        let employeeWageData = [];
        try {
          const employeeWageResponse = await axios.get(`/api/employee-store-wages?employeeId=${selectedEmployee}`);
          if (employeeWageResponse.data.success) {
            employeeWageData = employeeWageResponse.data.standards || [];
          }
        } catch (error) {
          console.error('获取员工门店工资百分比数据失败:', error);
          // 即使获取失败，也要继续处理，只是所有门店的工资百分比为0
        }
        
        // 计算每个门店的目前执行工资百分比
        const storeSummariesArray = Object.values(storeSummaryMap).map(summary => {
          // 查找该员工在该门店的工资百分比
          const storeWageData = employeeWageData.find(
            (wage: any) => wage && wage.store_id === summary.storeId
          );
          
          let currentWagePercentage = 0;
          if (storeWageData) {
            // 如果门店总销售额大于等于销售阈值标准，使用高于销售目标工资百分比
            // 否则使用低于销售目标工资百分比
            if (summary.storeCurrentTotalSales >= summary.storeMonthlyTarget) {
              currentWagePercentage = storeWageData.wage_percentage_above_target || 0;
            } else {
              currentWagePercentage = storeWageData.wage_percentage_below_target || 0;
            }
          }
          
          return {
            ...summary,
            totalSales: parseFloat(summary.totalSales.toFixed(2)),
            currentWagePercentage: parseFloat(currentWagePercentage.toFixed(2))
          };
        });
        
        setStoreSummaries(storeSummariesArray);
        
        // 计算预算工资：该员工在各个店的销售额乘以该员工在各店的目前执行工资百分比的乘积之和
        let totalBudgetSalary = 0;
        for (const summary of storeSummariesArray) {
          // 计算该门店的预算工资：门店销售额 × 目前执行工资百分比
          const storeBudgetSalary = summary.totalSales * (summary.currentWagePercentage / 100);
          totalBudgetSalary += storeBudgetSalary;
        }
        setBudgetSalary(parseFloat(totalBudgetSalary.toFixed(2)));
      } else {
        alert('获取销售记录失败');
      }
    } catch (error) {
      console.error('计算员工销售额失败:', error);
      alert('计算员工销售额失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">员工销售额统计</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择员工</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={selectedEmployee || ''}
              onChange={(e) => setSelectedEmployee(e.target.value ? Number(e.target.value) : null)}
              disabled={employees.length === 0}
            >
              <option value="">请选择员工</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择月份</label>
            <input
              type="month"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex justify-center mb-6">
          <button 
            className={`px-6 py-2 rounded-md text-white font-medium ${
              (!selectedEmployee || !selectedMonth) 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={calculateEmployeeSales}
            disabled={!selectedEmployee || !selectedMonth || loading}
          >
            {loading ? '查询中...' : '查询'}
          </button>
        </div>
        
        {statsData.length > 0 && (
          <>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">员工销售统计</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-xl font-bold text-blue-600 text-left">总销售额: ¥{totalAmount.toLocaleString()}</div>
                <div className="text-xl font-bold text-blue-600 text-center">总出勤数: {totalAttendance}</div>
                <div className="text-xl font-bold text-blue-600 text-right">预算工资: ¥{budgetSalary.toLocaleString()}</div>
              </div>
            </div>
            
            {/* 门店汇总数据 */}
            {storeSummaries.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">各门店销售额汇总</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {storeSummaries.map((summary) => (
                    <div key={summary.storeId} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                      <div className="font-medium text-gray-900">{summary.storeName}</div>
                      <div className="mt-1 text-sm text-gray-600">门店ID: {summary.storeId}</div>
                      <div className="mt-2 text-lg font-bold text-green-600">销售额: ¥{summary.totalSales.toLocaleString()}</div>
                      <div className="mt-1 text-sm text-gray-500">出勤数: {summary.attendanceCount}</div>
                      <div className="mt-1 text-sm text-gray-700">门店总销售额: ¥{summary.storeCurrentTotalSales.toLocaleString()}</div>
                      <div className="mt-1 text-sm text-gray-700">销售阈值标准: ¥{summary.storeMonthlyTarget.toLocaleString()}</div>
                      <div className="mt-1 text-sm text-gray-700">目前执行工资百分比: {summary.currentWagePercentage}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        门店
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        日期
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        门店总销售额
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        当日报上人数
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        个人销售额
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {statsData.map((record, index) => (
                      <tr key={`${record.storeId}-${record.date}-${index}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.storeName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ¥{record.totalDailySales.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.reporterCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-blue-600">
                          ¥{record.personalSales.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeSalesStatsPage;