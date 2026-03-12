// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StoreSelector from '@/components/StoreSelector';
import SalesInputField from '@/components/SalesInputField';
import NavigationMenu from '@/components/NavigationMenu';
import { getCurrentUser } from '@/lib/client-auth';
import dayjs from 'dayjs';

interface Store {
  id: number;
  name: string;
  short_name: string;
  address?: string;
}

interface FormData {
  storeId: number;
  reportDate: string;
  totalSales: string;
  cashSales: string;
  cardSales: string;
  onlineSales: string;
  customerCount: string;
  notes: string;
}

export default function HomePage() {
  const [formData, setFormData] = useState<FormData>({
    storeId: 0,
    reportDate: dayjs().format('YYYY-MM-DD'),
    totalSales: '',
    cashSales: '',
    cardSales: '',
    onlineSales: '',
    customerCount: '',
    notes: ''
  });
  const [selectedStore, setSelectedStore] = useState<Store | undefined>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
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

  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store);
    setFormData(prev => ({ ...prev, storeId: store.id }));
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 自动计算总销售额
    if (['cashSales', 'cardSales', 'onlineSales'].includes(field)) {
      const cash = field === 'cashSales' ? parseFloat(value) || 0 : parseFloat(formData.cashSales) || 0;
      const card = field === 'cardSales' ? parseFloat(value) || 0 : parseFloat(formData.cardSales) || 0;
      const online = field === 'onlineSales' ? parseFloat(value) || 0 : parseFloat(formData.onlineSales) || 0;
      const total = cash + card + online;
      setFormData(prev => ({ ...prev, totalSales: total.toString() }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStore) {
      setMessage('请选择门店');
      setMessageType('error');
      return;
    }
    
    if (!formData.reportDate || !formData.totalSales) {
      setMessage('请填写必填项');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/sales-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          ...formData,
          storeId: selectedStore.id,
          totalSales: parseFloat(formData.totalSales),
          cashSales: parseFloat(formData.cashSales) || 0,
          cardSales: parseFloat(formData.cardSales) || 0,
          onlineSales: parseFloat(formData.onlineSales) || 0,
          customerCount: parseInt(formData.customerCount) || 0,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage('提交成功！');
        setMessageType('success');
        // 重置表单
        setFormData({
          storeId: 0,
          reportDate: dayjs().format('YYYY-MM-DD'),
          totalSales: '',
          cashSales: '',
          cardSales: '',
          onlineSales: '',
          customerCount: '',
          notes: ''
        });
        setSelectedStore(undefined);
      } else {
        setMessage(result.message || '提交失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('提交失败，请重试');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
    router.push('/login');
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 max-w-md flex flex-col min-h-screen pb-16">
      <div className="flex items-center justify-between bg-white p-4 border-b mb-4">
        <span className="font-medium">销售报告填报</span>
        <button onClick={handleLogout} className="text-blue-500">
          退出
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-grow">
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <StoreSelector 
            userId={currentUser?.id}
            onSelect={handleStoreSelect} 
            selectedStore={selectedStore}
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              报告日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded"
              value={formData.reportDate}
              onChange={(e) => handleInputChange('reportDate', e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h3 className="font-medium mb-4">销售数据</h3>
          
          <SalesInputField
            label="总销售额"
            value={formData.totalSales}
            onChange={(val) => handleInputChange('totalSales', val)}
            type="number"
            placeholder="请输入总销售额"
            required
          />

          <SalesInputField
            label="现金销售额"
            value={formData.cashSales}
            onChange={(val) => handleInputChange('cashSales', val)}
            type="number"
            placeholder="请输入现金销售额"
          />

          <SalesInputField
            label="刷卡销售额"
            value={formData.cardSales}
            onChange={(val) => handleInputChange('cardSales', val)}
            type="number"
            placeholder="请输入刷卡销售额"
          />

          <SalesInputField
            label="线上销售额"
            value={formData.onlineSales}
            onChange={(val) => handleInputChange('onlineSales', val)}
            type="number"
            placeholder="请输入线上销售额"
          />

          <SalesInputField
            label="顾客数量"
            value={formData.customerCount}
            onChange={(val) => handleInputChange('customerCount', val)}
            type="number"
            placeholder="请输入顾客数量"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <SalesInputField
            label="备注"
            value={formData.notes}
            onChange={(val) => handleInputChange('notes', val)}
            type="textarea"
            placeholder="请输入备注信息"
          />
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 bg-blue-500 text-white rounded font-medium disabled:bg-gray-400"
        >
          {loading ? '提交中...' : '提交报告'}
        </button>
      </form>

      <NavigationMenu />
    </div>
  );
}