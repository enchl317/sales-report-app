// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    const result = await login(username, password);
    
    if (result.success) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', result.token!);
        localStorage.setItem('userRole', result.user!.role);
        localStorage.setItem('userId', result.user!.id.toString());
        localStorage.setItem('username', result.user!.username);
      }
      router.push('/');
    } else {
      setError(result.error || '登录失败');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">门店销售报告系统</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
              type="password"
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-600 rounded text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className="w-full p-3 bg-blue-500 text-white rounded font-medium"
          >
            登录
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-500">
          <p className="font-medium mb-2">测试账号：</p>
          <ul className="space-y-1">
            <li>门店员工: store1_staff / password123</li>
            <li>门店经理: store1_manager / password123</li>
            <li>管理员: admin / password123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}