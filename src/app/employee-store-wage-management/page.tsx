'use client';

import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import axios from 'axios';

interface User {
  id: number;
  name: string;
}

interface Store {
  id: number;
  name: string;
  short_name: string;
}

interface EmployeeStoreWage {
  id: number;
  employee_id: number;
  employee_name: string;
  store_id: number;
  store_name: string;
  wage_percentage_above_target: number;
  wage_percentage_below_target: number;
  created_at: string;
  updated_at: string;
}

const EmployeeStoreWageManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [wageStandards, setWageStandards] = useState<EmployeeStoreWage[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState<{[key: number]: boolean}>({});

  // 获取所有员工
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/users');
        if (response.data.success) {
          setUsers(response.data.users);
        } else {
          alert('获取员工列表失败');
        }
      } catch (error) {
        console.error('获取员工列表失败:', error);
        alert('获取员工列表失败');
      }
    };

    fetchUsers();
  }, []);

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

  // 获取指定员工的工资标准
  const fetchWageStandards = async () => {
    if (!selectedEmployee) {
      alert('请选择员工');
      return;
    }

    setFetching(true);
    try {
      const response = await axios.get(`/api/employee-store-wages?employeeId=${selectedEmployee}`);
      if (response.data.success) {
        // 确保每个门店都有数据（即使数据库中没有）
        const allStoreStandards = stores.map(store => {
          const existingStandard = response.data.standards.find(
            (standard: EmployeeStoreWage) => standard.store_id === store.id
          );
          
          if (existingStandard) {
            return existingStandard;
          } else {
            return {
              id: 0,
              employee_id: selectedEmployee,
              employee_name: users.find(u => u.id === selectedEmployee)?.name || '',
              store_id: store.id,
              store_name: store.name,
              wage_percentage_above_target: 0,
              wage_percentage_below_target: 0,
              created_at: '',
              updated_at: ''
            };
          }
        });
        
        setWageStandards(allStoreStandards);
      } else {
        alert('获取工资标准数据失败');
      }
    } catch (error) {
      console.error('获取工资标准数据失败:', error);
      alert('获取工资标准数据失败');
    } finally {
      setFetching(false);
    }
  };

  // 保存单个门店的工资标准
  const saveWageStandard = async (
    storeId: number, 
    aboveTarget: number, 
    belowTarget: number
  ) => {
    if (aboveTarget < 0 || belowTarget < 0) {
      alert('工资百分比不能为负数');
      return;
    }

    setSaving(prev => ({ ...prev, [storeId]: true }));

    try {
      const response = await axios.post('/api/employee-store-wages', {
        employeeId: selectedEmployee,
        storeId,
        wagePercentageAboveTarget: aboveTarget,
        wagePercentageBelowTarget: belowTarget
      });

      if (response.data.success) {
        // 更新本地状态
        setWageStandards(prev => prev.map(standard => 
          standard.store_id === storeId 
            ? { 
                ...standard, 
                wage_percentage_above_target: aboveTarget,
                wage_percentage_below_target: belowTarget,
                updated_at: new Date().toISOString()
              } 
            : standard
        ));
        alert('保存成功');
      } else {
        alert(response.data.message || '保存失败');
      }
    } catch (error) {
      console.error('保存工资标准失败:', error);
      alert('保存失败');
    } finally {
      setSaving(prev => ({ ...prev, [storeId]: false }));
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">员工门店销售工资百分比标准维护</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择员工</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={selectedEmployee || ''}
              onChange={(e) => setSelectedEmployee(Number(e.target.value))}
              disabled={users.length === 0}
            >
              <option value="">请选择员工</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button 
              className="w-full px-4 py-2 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700"
              onClick={fetchWageStandards}
              disabled={!selectedEmployee || fetching}
            >
              {fetching ? '加载中...' : '查询'}
            </button>
          </div>
        </div>
        
        {wageStandards.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    门店
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    高于销售目标工资百分比(%)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    低于销售目标工资百分比(%)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {wageStandards.map((standard) => (
                  <tr key={standard.store_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {standard.store_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <input
                        type="number"
                        className="w-32 px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={standard.wage_percentage_above_target}
                        onChange={(e) => {
                          const newValue = Number(e.target.value);
                          if (newValue >= 0) {
                            setWageStandards(prev => 
                              prev.map(s => 
                                s.store_id === standard.store_id 
                                  ? { ...s, wage_percentage_above_target: newValue } 
                                  : s
                              )
                            );
                          }
                        }}
                        min="0"
                        step="0.01"
                        placeholder="高于目标百分比"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <input
                        type="number"
                        className="w-32 px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={standard.wage_percentage_below_target}
                        onChange={(e) => {
                          const newValue = Number(e.target.value);
                          if (newValue >= 0) {
                            setWageStandards(prev => 
                              prev.map(s => 
                                s.store_id === standard.store_id 
                                  ? { ...s, wage_percentage_below_target: newValue } 
                                  : s
                              )
                            );
                          }
                        }}
                        min="0"
                        step="0.01"
                        placeholder="低于目标百分比"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button 
                        className={`px-3 py-1 rounded text-white text-sm ${
                          saving[standard.store_id] 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                        onClick={() => 
                          saveWageStandard(
                            standard.store_id, 
                            standard.wage_percentage_above_target, 
                            standard.wage_percentage_below_target
                          )
                        }
                        disabled={saving[standard.store_id]}
                      >
                        {saving[standard.store_id] ? '保存中...' : '保存'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {wageStandards.length === 0 && selectedEmployee && !fetching && (
          <div className="text-center py-8 text-gray-500">
            该员工暂无门店工资标准数据
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeStoreWageManagementPage;