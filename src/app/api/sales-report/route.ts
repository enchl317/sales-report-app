// src/app/api/sales-report/route.ts
import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!storeId || !startDate || !endDate) {
      return Response.json({ success: false, message: '缺少必需参数' }, { status: 400 });
    }

    // 查询指定门店和日期范围内的销售记录
    const records = await query(
      `
      SELECT 
        id,
        store_id,
        store_short_name,
        report_date,
        total_sales,
        meat_floss_sales,
        other_sales,
        reporter_ids,
        reporter_names,
        created_at,
        updated_at
      FROM store_sales_records 
      WHERE store_id = ? AND report_date BETWEEN ? AND ?
      ORDER BY report_date DESC
      `,
      [storeId, startDate, endDate]
    );

    // 格式化日期，只显示日期部分，使用中国时区
    const formattedRecords = records.map((record: any) => {
      // 将日期转换为中国时区（UTC+8）
      const date = new Date(record.report_date);
      date.setHours(date.getHours() + 8); // 加8小时以补偿时区差异
      
      // 格式化为 YYYY-MM-DD 格式
      const formattedDate = date.toISOString().split('T')[0];
      
      return {
        ...record,
        report_date: formattedDate,
        // MySQL的JSON字段已经被自动解析为JavaScript对象，无需再次解析
        reporter_ids: record.reporter_ids,
        reporter_names: record.reporter_names
      };
    });

    return Response.json({ success: true, data: formattedRecords });
  } catch (error) {
    console.error('获取销售记录时出错:', error);
    return Response.json({ success: false, message: error instanceof Error ? error.message : '获取数据失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // 验证必需字段
    if (!data.storeId || !data.storeShortName || !data.reportDate || data.totalSales === undefined || data.reporterIds?.length === 0) {
      return Response.json({ success: false, message: '缺少必需字段' }, { status: 400 });
    }

    // 获取有效的上报人信息
    const placeholders = data.reporterIds.map(() => '?').join(',');
    const validReporters = await query(
      `SELECT id, name FROM users WHERE id IN (${placeholders})`,
      data.reporterIds
    ) as { id: number; name: string }[];

    if (validReporters.length === 0) {
      return Response.json({ success: false, message: '无效的上报人ID' }, { status: 400 });
    }

    // 提取上报人ID和姓名
    const reporterIds = validReporters.map(r => r.id);
    const reporterNames = validReporters.map(r => r.name);

    // 开始数据库事务 - 检查是否已存在同一天的报告，如果存在则更新，否则插入新记录
    // 使用参数化查询防止SQL注入
    const existingRecord = await query(
      'SELECT id FROM store_sales_records WHERE store_id = ? AND report_date = ?',
      [data.storeId, data.reportDate]
    );

    if (existingRecord.length > 0) {
      // 更新现有记录
      await query(
        `
        UPDATE store_sales_records 
        SET 
          total_sales = ?,
          meat_floss_sales = ?,
          other_sales = ?,
          reporter_ids = ?,
          reporter_names = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE store_id = ? AND report_date = ?
        `,
        [
          data.totalSales,
          data.meatFlossSales || 0,
          data.otherSales || 0,
          JSON.stringify(reporterIds),
          JSON.stringify(reporterNames),
          data.storeId,
          data.reportDate
        ]
      );
    } else {
      // 插入新记录
      await query(
        `
        INSERT INTO store_sales_records 
        (store_id, store_short_name, report_date, total_sales, meat_floss_sales, other_sales, reporter_ids, reporter_names)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          data.storeId,
          data.storeShortName,
          data.reportDate,
          data.totalSales,
          data.meatFlossSales || 0,
          data.otherSales || 0,
          JSON.stringify(reporterIds),
          JSON.stringify(reporterNames)
        ]
      );
    }

    return Response.json({ success: true, message: '报告提交成功' });
  } catch (error) {
    console.error('提交报告时出错:', error);
    return Response.json({ success: false, message: error instanceof Error ? error.message : '提交失败' }, { status: 500 });
  }
}