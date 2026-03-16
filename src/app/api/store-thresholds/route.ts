// src/app/api/store-thresholds/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const storeId = searchParams.get('storeId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    // 查询门店月度销售阈值标准
    let sql = `
      SELECT 
        st.id,
        st.store_id,
        s.name as store_name,
        st.year,
        st.month,
        st.threshold_amount,
        st.created_at,
        st.updated_at
      FROM store_monthly_thresholds st
      LEFT JOIN stores s ON st.store_id = s.id
    `;
    
    const params: any[] = [];
    
    if (storeId) {
      sql += ` WHERE st.store_id = ?`;
      params.push(parseInt(storeId));
    }
    
    if (year) {
      if (params.length > 0) {
        sql += ` AND st.year = ?`;
      } else {
        sql += ` WHERE st.year = ?`;
      }
      params.push(parseInt(year));
    }
    
    if (month) {
      if (params.length > 0) {
        sql += ` AND st.month = ?`;
      } else {
        sql += ` WHERE st.month = ?`;
      }
      params.push(parseInt(month));
    }
    
    sql += ` ORDER BY st.year DESC, st.month DESC, s.id ASC`;
    
    const thresholds = await query(sql, params);
    
    return NextResponse.json({ 
      success: true, 
      thresholds: thresholds.map((threshold: any) => ({
        id: threshold.id,
        store_id: threshold.store_id,
        store_name: threshold.store_name,
        year: threshold.year,
        month: threshold.month,
        threshold_amount: parseFloat(threshold.threshold_amount),
        created_at: threshold.created_at,
        updated_at: threshold.updated_at
      })) 
    });
  } catch (error) {
    console.error('获取门店月度销售阈值标准数据失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '获取门店月度销售阈值标准数据失败' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, year, month, thresholdAmount } = body;

    if (!storeId || !year || !month || thresholdAmount === undefined || thresholdAmount < 0) {
      return NextResponse.json({ 
        success: false, 
        message: '参数不完整或销售阈值不能为负数' 
      }, { status: 400 });
    }

    // 检查是否已存在相同记录，如果存在则更新，否则插入
    const result = await query(`
      INSERT INTO store_monthly_thresholds (store_id, year, month, threshold_amount) 
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      threshold_amount = VALUES(threshold_amount),
      updated_at = CURRENT_TIMESTAMP
    `, [storeId, year, month, thresholdAmount]);

    return NextResponse.json({ 
      success: true, 
      message: '门店月度销售阈值标准保存成功' 
    });
  } catch (error) {
    console.error('保存门店月度销售阈值标准失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '保存门店月度销售阈值标准失败' 
    }, { status: 500 });
  }
}