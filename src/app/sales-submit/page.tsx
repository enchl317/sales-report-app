'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SalesSubmitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeIdFromUrl = searchParams.get('storeId');
  
  const [formData, setFormData] = useState({
    storeId: storeIdFromUrl || '',
    storeShortName: '',
    reportDate: new Date().toISOString().split('T')[0],
    totalSales: '',
    meatFlossSales: '',
    otherSales: '',
    reporterIds: [] as number[]
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(false);
  const [monthlySales, setMonthlySales] = useState<any[]>([]);
  const [showMonthlySales, setShowMonthlySales] = useState(false);
  const [monthlySalesLoading, setMonthlySalesLoading] = useState(false);
  const [stores, setStores] = useState<{ id: number; name: string; short_name: string; address: string }[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string; username: string; role: string }[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<{ id: number; name: string; username: string; role: string }[]>([]);

  // 获取门店列表
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch('/api/stores');
        const data = await response.json();
        if (data.success) {
          setStores(data.stores);
          
          // 如果URL中有storeId参数，设置对应的门店简称
          if (storeIdFromUrl) {
            const store = data.stores.find((s: any) => s.id == storeIdFromUrl);
            if (store) {
              setFormData(prev => ({
                ...prev,
                storeShortName: store.short_name
              }));
            }
          }
        }
      } catch (error) {
        console.error('获取门店列表失败:', error);
      }
    };

    fetchStores();
  }, [storeIdFromUrl]);

  // 获取所有用户列表
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        if (data.success) {
          setUsers(data.users);
        }
      } catch (error) {
        console.error('获取用户列表失败:', error);
      }
    };

    fetchUsers();
  }, []);

  // 根据门店ID过滤用户
  useEffect(() => {
    if (formData.storeId) {
      const fetchFilteredUsers = async () => {
        try {
          const response = await fetch(`/api/store-users/${formData.storeId}`);
          const data = await response.json();
          if (data.success) {
            // 只显示与当前门店关联的用户
            const filtered = users.filter(user => 
              data.userIds.includes(user.id)
            );
            setFilteredUsers(filtered);
          } else {
            setFilteredUsers([]);
          }
        } catch (error) {
          console.error('获取门店关联用户失败:', error);
          setFilteredUsers([]);
        }
      };

      fetchFilteredUsers();
    } else {
      // 如果没有选择门店，显示空数组，这样就不会显示任何用户
      setFilteredUsers([]);
    }
  }, [formData.storeId, users]);

  // 检查是否需要显示"请选择门店"提示
  const shouldShowPlaceholder = !formData.storeId && !storeIdFromUrl;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'storeId' && stores.length > 0 
        ? value 
        : name === 'reporterIds' 
          ? [...prev.reporterIds, parseInt(value)] 
          : value
    }));

    // 如果选择了门店，自动填充门店简称
    if (name === 'storeId') {
      const selectedStore = stores.find(store => store.id == parseInt(value));
      if (selectedStore) {
        setFormData(prev => ({
          ...prev,
          storeShortName: selectedStore.short_name
        }));
      }
    }
  };

  const handleReporterChange = (userId: number) => {
    setFormData(prev => {
      if (prev.reporterIds.includes(userId)) {
        return {
          ...prev,
          reporterIds: prev.reporterIds.filter(id => id !== userId)
        };
      } else {
        return {
          ...prev,
          reporterIds: [...prev.reporterIds, userId]
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/sales-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId: formData.storeId,
          storeShortName: formData.storeShortName,
          reportDate: formData.reportDate,
          totalSales: parseFloat(formData.totalSales),
          meatFlossSales: parseFloat(formData.meatFlossSales) || 0,
          otherSales: parseFloat(formData.otherSales) || 0,
          reporterIds: formData.reporterIds
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage('销售报告提交成功！');
        setMessageType('success');
        
        // 清空表单
        setFormData({
          storeId: storeIdFromUrl || '',
          storeShortName: storeIdFromUrl && stores.length > 0 ? stores.find(s => s.id == parseInt(storeIdFromUrl))?.short_name || '' : '',
          reportDate: new Date().toISOString().split('T')[0],
          totalSales: '',
          meatFlossSales: '',
          otherSales: '',
          reporterIds: []
        });
        
        // 自动跳转到查看当月销售页面
        setTimeout(() => {
          handleViewMonthlySales();
        }, 1000);
      } else {
        setMessage(result.message || '提交失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('网络错误，请稍后重试');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMonthlySales = async () => {
    if (!formData.storeId) {
      setMessage('请先选择门店');
      setMessageType('error');
      return;
    }

    setMonthlySalesLoading(true);
    setMessage('');

    try {
      // 获取当前月份的第一天和最后一天
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1; // 月份从0开始，需要+1
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      
      // 计算月底日期
      const endDate = new Date(year, month, 0); // 月份从0开始，第0天就是上个月最后一天
      const endDateStr = `${year}-${month.toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`;

      const response = await fetch(`/api/sales-report?storeId=${formData.storeId}&startDate=${startDate}&endDate=${endDateStr}`);
      const result = await response.json();

      if (result.success) {
        setMonthlySales(result.data);
        setShowMonthlySales(true);
        setMessage('');
      } else {
        setMessage(result.message || '获取当月销售数据失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('获取当月销售数据失败');
      setMessageType('error');
    } finally {
      setMonthlySalesLoading(false);
    }
  };

  const handleBackToSubmit = () => {
    setShowMonthlySales(false);
    setMonthlySales([]);
  };

  const formatDate = (dateString: string) => {
    // 将日期字符串转换为 MM-DD 格式（不显示年份）
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要+1
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        {!showMonthlySales ? (
          <>
            <h1 className="text-2xl font-bold text-center mb-6">销售上报</h1>
            
            {message && (
              <div className={`mb-4 p-3 rounded ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {storeIdFromUrl ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      门店
                    </label>
                    <input
                      type="text"
                      value={formData.storeShortName}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="storeId" className="block text-sm font-medium text-gray-700 mb-1">
                      选择门店
                    </label>
                    <select
                      id="storeId"
                      name="storeId"
                      value={formData.storeId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">请选择门店</option>
                      {stores.map(store => (
                        <option key={store.id} value={store.id}>
                          {store.name} ({store.short_name})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label htmlFor="reportDate" className="block text-sm font-medium text-gray-700 mb-1">
                    报告日期
                  </label>
                  <input
                    type="text"
                    id="reportDate"
                    value={new Date(formData.reportDate).toLocaleDateString('zh-CN')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    required
                    readOnly
                  />
                </div>
                
                <div>
                  <label htmlFor="totalSales" className="block text-sm font-medium text-gray-700 mb-1">
                    总销售额 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="totalSales"
                    name="totalSales"
                    value={formData.totalSales}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="meatFlossSales" className="block text-sm font-medium text-gray-700 mb-1">
                    肉松销售额
                  </label>
                  <input
                    type="number"
                    id="meatFlossSales"
                    name="meatFlossSales"
                    value={formData.meatFlossSales}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="otherSales" className="block text-sm font-medium text-gray-700 mb-1">
                    其它销售额
                  </label>
                  <input
                    type="number"
                    id="otherSales"
                    name="otherSales"
                    value={formData.otherSales}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    上报人
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {shouldShowPlaceholder ? (
                      <div className="text-gray-500 italic p-2">请选择门店</div>
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map(user => (
                        <div key={user.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`reporter-${user.id}`}
                            checked={formData.reporterIds.includes(user.id)}
                            onChange={() => handleReporterChange(user.id)}
                            className="mr-2 h-4 w-4 text-blue-600"
                          />
                          <label htmlFor={`reporter-${user.id}`} className="text-sm text-gray-700">
                            {user.name}
                          </label>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 italic p-2">该门店暂无关联员工</div>
                    )}
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? '提交中...' : '提交销售'}
                </button>
                
                <button
                  type="button"
                  onClick={handleViewMonthlySales}
                  disabled={monthlySalesLoading}
                  className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {monthlySalesLoading ? '加载中...' : '查看当月销售'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-center mb-4">当月销售记录</h2>
            
            {message && (
              <div className={`mb-4 p-3 rounded ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message}
              </div>
            )}
            
            {monthlySales.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总销售额</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>上报人</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">肉松销售额</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">其它销售额</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {monthlySales.map((record, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatDate(record.report_date)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">¥{parseFloat(record.total_sales).toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-gray-500" style={{ minWidth: '120px' }}>
                          {record.reporter_names && Array.isArray(record.reporter_names) 
                            ? record.reporter_names.join(', ') 
                            : record.reporter_names}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">¥{parseFloat(record.meat_floss_sales).toFixed(2)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">¥{parseFloat(record.other_sales).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                {monthlySalesLoading ? '加载中...' : '暂无销售记录'}
              </div>
            )}
            
            <button
              type="button"
              onClick={handleBackToSubmit}
              className="w-full mt-4 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              返回提交销售
            </button>
          </div>
        )}
      </div>
    </div>
  );
}