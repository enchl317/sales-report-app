// src/app/api/store-sales/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 使用 request.nextUrl 替代 new URL(request.url) 以避免静态生成错误
    const { searchParams } = request.nextUrl;
    const month = searchParams.get('month'); // 格式应为 YYYY-MM

    if (!month) {
      return NextResponse.json({ 
        success: false, 
        message: '缺少月份参数' 
      }, { status: 400 });
    }

    // 构建查询日期范围
    const startDate = `${month}-01`;
    const year = parseInt(month.slice(0, 4));
    const monthNum = parseInt(month.slice(5)) - 1; // JavaScript月份是从0开始的
    const endDate = `${month}-${new Date(year, monthNum + 1, 0).getDate()}`;

    // 查询指定月份的所有销售记录
    const records = await query(`
      SELECT 
        id,
        store_id,
        store_short_name,
        report_date,
        total_sales,
        reporter_ids,
        reporter_names
      FROM store_sales_records 
      WHERE report_date BETWEEN ? AND ?
      ORDER BY report_date DESC, store_id ASC
    `, [startDate, endDate]);
    
    return NextResponse.json({ 
      success: true, 
      records: records.map((record: any) => ({
        id: record.id,
        store_id: record.store_id,
        store_short_name: record.store_short_name,
        report_date: record.report_date,
        total_sales: parseFloat(record.total_sales),
        reporter_ids: record.reporter_ids,
        reporter_names: record.reporter_names
      }))
    });
  } catch (error) {
    console.error('获取销售记录失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '获取销售记录失败' 
    }, { status: 500 });
  }
}