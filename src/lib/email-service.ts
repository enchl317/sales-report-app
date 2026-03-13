import { getConnection } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

// 获取当日销售数据
export async function getDailySalesData(todayStr?: string) {
  const date = todayStr || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const connection = await getConnection();

  const query = `
    SELECT ssr.*, s.name as store_name, s.short_name as store_short_name
    FROM store_sales_records ssr
    LEFT JOIN stores s ON ssr.store_id = s.id
    WHERE DATE(ssr.report_date) = ?
    ORDER BY ssr.store_id, ssr.report_date
  `;

  const [rows] = await connection.execute(query, [date]) as [any[], any];

  // 准備Excel數據
  const excelData = [
    ['门店', '门店简称', '日期', '总销售额', '肉松销售额', '其他销售额', '上报人']
  ];

  let totalSalesSum = 0; // 计算总销售额

  (rows as any[]).forEach((row: any) => {
    const reporterNames = Array.isArray(row.reporter_names) 
      ? row.reporter_names.join(', ')
      : typeof row.reporter_names === 'string'
        ? JSON.parse(row.reporter_names || '[]').join(', ')
        : row.reporter_names || '';
    
    const totalSales = parseFloat(row.total_sales);
    totalSalesSum += totalSales;
    
    excelData.push([
      row.store_name,
      row.store_short_name,
      new Date(row.report_date).toLocaleDateString(),
      totalSales,
      parseFloat(row.meat_floss_sales),
      parseFloat(row.other_sales),
      reporterNames
    ]);
  });

  return { excelData, totalSalesSum, date };
}

// 获取当天生成的Excel文件路径
export async function getTodayExcelFiles() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  const monthStr = `${today.getFullYear()}_${(today.getMonth() + 1).toString().padStart(2, '0')}`; // YYYY_MM

  const reportDir = path.join(process.cwd(), 'report');
  
  const dailyExcelPath = path.join(reportDir, `dailysales${todayStr}.xlsx`);
  const monthlyExcelPath = path.join(reportDir, `monthlysales_${monthStr}.xlsx`);

  // 检查文件是否存在
  let dailyExists = false;
  let monthlyExists = false;

  try {
    await fs.access(dailyExcelPath);
    dailyExists = true;
  } catch {
    dailyExists = false;
  }

  try {
    await fs.access(monthlyExcelPath);
    monthlyExists = true;
  } catch {
    monthlyExists = false;
  }

  return {
    dailyExcelPath: dailyExists ? dailyExcelPath : null,
    monthlyExcelPath: monthlyExists ? monthlyExcelPath : null
  };
}