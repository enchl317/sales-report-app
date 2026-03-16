// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 查询所有用户
    const users = await query('SELECT id, name FROM users ORDER BY name ASC');
    
    return NextResponse.json({ 
      success: true, 
      users: users.map((user: any) => ({
        id: user.id,
        name: user.name
      })) 
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '获取用户列表失败' 
    }, { status: 500 });
  }
}