'use client';

import { useState } from 'react';

export default function DebugPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleGenerateDailyExcel = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/generate-excel?type=daily');
      
      if (response.ok) {
        const result = await response.json();
        setMessage(`Excel文件生成成功: ${result.fileName}`);
        
        // 提供下载链接
        const downloadLink = document.createElement('a');
        downloadLink.href = result.downloadUrl;
        downloadLink.download = result.fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      } else {
        const error = await response.json();
        setMessage(`生成失败: ${error.error}`);
      }
    } catch (error) {
      setMessage(`生成失败: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMonthlyExcel = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // 获取当前年月
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // 月份从0开始，需要+1
      
      const response = await fetch(`/api/generate-excel?type=monthly&year=${year}&month=${month}`);
      
      if (response.ok) {
        const result = await response.json();
        setMessage(`Excel文件生成成功: ${result.fileName}`);
        
        // 提供下载链接
        const downloadLink = document.createElement('a');
        downloadLink.href = result.downloadUrl;
        downloadLink.download = result.fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      } else {
        const error = await response.json();
        setMessage(`生成失败: ${error.error}`);
      }
    } catch (error) {
      setMessage(`生成失败: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        setMessage(`邮件发送成功: ${result.messageId || 'Success'}`);
      } else {
        const error = await response.json();
        setMessage(`发送失败: ${error.message}`);
      }
    } catch (error) {
      setMessage(`发送失败: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">调试页面 - Excel生成和邮件发送</h1>
        
        {message && (
          <div className={`mb-4 p-3 rounded ${
            message.includes('成功') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
        
        <div className="space-y-4">
          <button
            onClick={handleGenerateDailyExcel}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? '生成中...' : '生成当日销售Excel'}
          </button>
          
          <button
            onClick={handleGenerateMonthlyExcel}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? '生成中...' : '生成当月销售汇总Excel'}
          </button>
          
          <button
            onClick={handleSendEmail}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {loading ? '发送中...' : '发送邮件'}
          </button>
        </div>
        
        <div className="mt-8 text-sm text-gray-600">
          <h2 className="font-semibold mb-2">功能说明：</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>点击"生成当日销售Excel"按钮会生成包含当日所有门店销售数据的Excel文件</li>
            <li>点击"生成当月销售汇总Excel"按钮会生成当月每日销售汇总的Excel文件</li>
            <li>点击"发送邮件"按钮会发送包含当日销售数据的邮件，主题为"当天日期+总销售额"</li>
            <li>邮件内容为当日销售数据表格，附件包含当日销售Excel和当月销售Excel</li>
            <li>文件名格式：dailysalesYYYYMMDD.xlsx 或 monthlysales_YYYY_MM.xlsx</li>
            <li>如果存在同名文件，将会被覆盖</li>
          </ul>
        </div>
      </div>
    </div>
  );
}