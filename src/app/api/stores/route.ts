// src/app/api/stores/route.ts
import { NextRequest } from 'next/server';
import { query } from '../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    // 获取所有门店信息
    const stores = await query('SELECT id, name, short_name, address FROM stores ORDER BY id');
    
    return Response.json({ 
      success: true, 
      stores: stores
    });
  } catch (error) {
    console.error('获取门店列表失败:', error);
    return Response.json({ success: false, message: '获取门店列表失败' }, { status: 500 });
  }
}