// src/app/api/stores/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 查询所有门店
    const stores = await query('SELECT id, name, short_name FROM stores ORDER BY id ASC');
    
    return NextResponse.json({ 
      success: true, 
      stores: stores.map((store: any) => ({
        id: store.id,
        name: store.name,
        short_name: store.short_name
      })) 
    });
  } catch (error) {
    console.error('获取门店列表失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '获取门店列表失败' 
    }, { status: 500 });
  }
}