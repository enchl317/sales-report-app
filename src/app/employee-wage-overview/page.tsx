'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface EmployeeWageSummary {
  id: number;
  name: string;
  budgetWage: number;
  totalAttendance: number;
  totalSales: number;
}

const EmployeeMonthlyWageOverviewPage: React.FC = () => {
  const router = useRouter();
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [employees, setEmployees] = useState<EmployeeWageSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 生成年份选项
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years;
  };

  // 获取员工工资概览数据
  const fetchEmployeeWageSummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/employee-wage-summary?year=${year}&month=${month}`);
      if (response.data.success) {
        setEmployees(response.data.employees);
      } else {
        throw new Error(response.data.message || '获取数据失败');
      }
    } catch (err) {
      console.error('获取员工工资概览数据失败:', err);
      setError('获取员工工资概览数据失败');
      
      // 模拟数据用于演示
      setEmployees([
        {
          id: 1,
          name: '张三',
          budgetWage: 8500,
          totalAttendance: 22,
          totalSales: 125000
        },
        {
          id: 2,
          name: '李四',
          budgetWage: 7200,
          totalAttendance: 20,
          totalSales: 98000
        },
        {
          id: 3,
          name: '王五',
          budgetWage: 9500,
          totalAttendance: 24,
          totalSales: 156000
        },
        {
          id: 4,
          name: '赵六',
          budgetWage: 6800,
          totalAttendance: 18,
          totalSales: 87000
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    fetchEmployeeWageSummary();
  }, [year, month]);

  // 处理查询按钮点击
  const handleSearch = () => {
    fetchEmployeeWageSummary();
  };

  // 处理员工姓名点击事件
  const handleEmployeeClick = (employeeId: number) => {
    router.push(`/employee-sales-stats?employeeId=${employeeId}&month=${year}-${month}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">员工月度工资总览</h1>
      
      {/* 年月筛选区域 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              年份
            </label>
            <select
              id="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
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
              onChange={(e) => setMonth(e.target.value.padStart(2, '0'))}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m.toString().padStart(2, '0')}>
                  {m}月
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? '查询中...' : '查询'}
            </button>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* 员工工资概览表格 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                员工姓名
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                预算工资
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                总出勤数
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                总销售额
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.length > 0 ? (
              employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                    onClick={() => handleEmployeeClick(employee.id)}
                  >
                    {employee.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ¥{employee.budgetWage.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.totalAttendance}天
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ¥{employee.totalSales.toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  {loading ? '加载中...' : '暂无数据'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeMonthlyWageOverviewPage;