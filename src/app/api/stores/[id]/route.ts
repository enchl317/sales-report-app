// src/app/api/stores/[id]/route.ts
import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const storeId = parseInt(params.id);
    
    if (isNaN(storeId)) {
      return Response.json({ success: false, message: 'Invalid store ID' }, { status: 400 });
    }

    // 获取门店信息
    const stores = await query('SELECT id, name, short_name, address FROM stores WHERE id = ?', [storeId]);
    
    if (stores.length === 0) {
      return Response.json({ success: false, message: 'Store not found' }, { status: 404 });
    }

    const store = stores[0];

    // 获取与该门店关联的员工
    const staffResults = await query(`
      SELECT u.id, u.name 
      FROM users u 
      INNER JOIN user_stores us ON u.id = us.user_id 
      WHERE us.store_id = ?
      ORDER BY u.name
    `, [storeId]);

    return Response.json({ 
      success: true, 
      data: {
        store,
        staffList: staffResults
      } 
    });
  } catch (error) {
    console.error('获取门店信息失败:', error);
    return Response.json({ success: false, message: '获取门店信息失败' }, { status: 500 });
  }
}