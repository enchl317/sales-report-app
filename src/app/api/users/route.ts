// src/app/api/users/route.ts
import { NextRequest } from 'next/server';
import { query } from '../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    // 获取所有用户信息
    const users = await query('SELECT id, name, username, role FROM users ORDER BY name');
    
    return Response.json({ 
      success: true, 
      users: users
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return Response.json({ success: false, message: '获取用户列表失败' }, { status: 500 });
  }
}