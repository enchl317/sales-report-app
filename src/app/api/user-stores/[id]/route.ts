// src/app/api/user-stores/[id]/route.ts
import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return Response.json({ success: false, message: 'Invalid user ID' }, { status: 400 });
    }

    // 获取与该用户关联的门店
    const stores = await query(`
      SELECT s.id, s.name, s.short_name, s.address 
      FROM stores s 
      INNER JOIN user_stores us ON s.id = us.store_id 
      WHERE us.user_id = ?
      ORDER BY s.id
    `, [userId]);

    return Response.json({ 
      success: true, 
      stores 
    });
  } catch (error) {
    console.error('获取用户门店失败:', error);
    return Response.json({ success: false, message: '获取用户门店失败' }, { status: 500 });
  }
}