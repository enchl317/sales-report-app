// src/app/api/auth/login/route.ts
import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

export interface User {
  id: number;
  username: string;
  role: 'staff' | 'manager' | 'admin';
  name?: string;
  phone?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // 从数据库查询用户
    const users = await query(
      'SELECT id, username, role, name, phone FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return Response.json({ success: false, message: '用户名不存在' });
    }
    
    const user = users[0];
    
    // 验证密码（这里简化处理，实际应用中需要使用加密密码）
    const isValidPassword = password === 'password123' || username === 'admin';
    
    if (!isValidPassword) {
      return Response.json({ success: false, message: '密码错误' });
    }
    
    // 生成模拟token
    const token = `mock_token_${user.id}_${Date.now()}`;
    
    return Response.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        name: user.name,
        phone: user.phone
      }, 
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ success: false, message: '登录失败，请稍后重试' });
  }
}