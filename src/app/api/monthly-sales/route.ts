// src/app/api/monthly-sales/route.ts
import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!storeId || !startDate || !endDate) {
      return Response.json({ success: false, message: '缺少必要参数' }, { status: 400 });
    }

    // 查询指定门店和日期范围内的销售数据
    const salesData = await query(`
      SELECT 
        report_date,
        total_sales,
        meat_floss_sales,
        other_sales,
        reporter_name
      FROM store_sales_records
      WHERE store_id = ? 
        AND report_date BETWEEN ? AND ?
      ORDER BY report_date DESC
    `, [parseInt(storeId), startDate, endDate]);

    return Response.json({ 
      success: true, 
      data: salesData 
    });
  } catch (error) {
    console.error('获取月度销售数据失败:', error);
    return Response.json({ success: false, message: '获取月度销售数据失败' }, { status: 500 });
  }
}