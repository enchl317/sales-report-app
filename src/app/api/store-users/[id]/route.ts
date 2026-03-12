// src/app/api/store-users/[id]/route.ts
import { NextRequest } from 'next/server';
import { query } from '../../../../lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const storeId = parseInt(params.id);
    
    if (isNaN(storeId)) {
      return Response.json({ success: false, message: 'Invalid store ID' }, { status: 400 });
    }

    // 获取与该门店关联的用户
    const users = await query(`
      SELECT u.id, u.name, u.username, u.role
      FROM users u 
      INNER JOIN user_stores us ON u.id = us.user_id 
      WHERE us.store_id = ?
      ORDER BY u.name
    `, [storeId]);

    // 提取用户ID数组
    const userIds = users.map((user: any) => user.id);

    return Response.json({ 
      success: true, 
      userIds,
      users
    });
  } catch (error) {
    console.error('获取门店关联用户失败:', error);
    return Response.json({ success: false, message: '获取门店关联用户失败' }, { status: 500 });
  }
}