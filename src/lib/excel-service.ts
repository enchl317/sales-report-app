import { write } from 'xlsx';
import { query } from './db';
import fs from 'fs/promises';
import path from 'path';

// 生成日销售报告数据
export async function generateDailySalesReportData(todayStr?: string) {
  const date = todayStr || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const querySql = `
    SELECT ssr.*, s.name as store_name, s.short_name as store_short_name
    FROM store_sales_records ssr
    LEFT JOIN stores s ON ssr.store_id = s.id
    WHERE DATE(ssr.report_date) = ?
    ORDER BY ssr.store_id, ssr.report_date
  `;

  const rows = await query(querySql, [date]);

  // 准備Excel數據
  const excelData = [
    ['门店简称', '日期', '总销售额', '肉松销售额', '其他销售额', '上报人']
  ];

  (rows as any[]).forEach((row: any) => {
    const reporterNames = Array.isArray(row.reporter_names) 
      ? row.reporter_names.join(', ')
      : typeof row.reporter_names === 'string'
        ? JSON.parse(row.reporter_names || '[]').join(', ')
        : row.reporter_names || '';
    
    excelData.push([
      row.store_short_name,
      new Date(row.report_date).toLocaleDateString(),
      parseFloat(row.total_sales),
      parseFloat(row.meat_floss_sales),
      parseFloat(row.other_sales),
      reporterNames
    ]);
  });

  return excelData;
}

// 生成月销售汇总报告数据
export async function generateMonthlySalesReportData(year?: number, month?: number) {
  const now = new Date();
  const reportYear = year || now.getFullYear();
  const reportMonth = month || (now.getMonth() + 1); // 月份从0开始，需要+1

  const querySql = `
    SELECT ssr.*, s.name as store_name, s.short_name as store_short_name
    FROM store_sales_records ssr
    LEFT JOIN stores s ON ssr.store_id = s.id
    WHERE YEAR(ssr.report_date) = ? AND MONTH(ssr.report_date) = ?
    ORDER BY ssr.report_date, ssr.store_id
  `;

  const rows = await query(querySql, [reportYear, reportMonth]);

  // 按日期和门店整理数据
  const dailySales: Record<string, Record<string, any>> = {};
  const stores: Set<string> = new Set();
  const storeNames: Record<string, string> = {};

  (rows as any[]).forEach((row: any) => {
    const date = new Date(row.report_date).getDate(); // 只取日期部分
    const dateKey = date.toString().padStart(2, '0');
    const storeId = row.store_id.toString(); // 确保storeId是字符串
    
    if (!dailySales[dateKey]) {
      dailySales[dateKey] = {};
    }
    
    dailySales[dateKey][storeId] = {
      total_sales: parseFloat(row.total_sales),
      meat_floss_sales: parseFloat(row.meat_floss_sales),
      other_sales: parseFloat(row.other_sales)
    };
    
    stores.add(storeId);
    storeNames[storeId] = row.store_name;
  });

  // 准備Excel數據
  const storeList = Array.from(stores).sort();
  const headerRow = ['日期', '总销售金额', ...storeList.map(id => storeNames[id] || id)];
  const excelData = [headerRow];

  // 按日期填充数据
  const sortedDates = Object.keys(dailySales).sort((a, b) => parseInt(a) - parseInt(b));
  
  let grandTotal = 0;
  const storeTotals: Record<string, number> = {};
  
  sortedDates.forEach(date => {
    const dateData = dailySales[date];
    const row: any[] = [`${reportMonth}/${date}`];
    let dailyTotal = 0;
    
    storeList.forEach(storeId => {
      const storeSales = dateData[storeId] || { total_sales: 0 };
      const sales = storeSales.total_sales || 0;
      row.push(sales);
      dailyTotal += sales;
      
      if (!storeTotals[storeId]) storeTotals[storeId] = 0;
      storeTotals[storeId] += sales;
    });
    
    row.splice(1, 0, dailyTotal); // 在第二个位置插入总销售额
    excelData.push(row);
    grandTotal += dailyTotal;
  });

  // 添加汇总行
  const totalRow: any[] = ['汇总', grandTotal];
  storeList.forEach(storeId => {
    totalRow.push(storeTotals[storeId] || 0);
  });
  excelData.push(totalRow);

  return { excelData, year: reportYear, month: reportMonth };
}

// 将Excel数据写入文件
export async function writeExcelToFile(excelData: any[][], fileName: string, sheetName: string = 'Sheet1') {
  const xlsx = await import('xlsx');
  
  // 创建工作簿和工作表
  const worksheet = xlsx.utils.aoa_to_sheet(excelData);
  
  // 特殊处理月度汇总表的列宽
  if (sheetName === '当月销售汇总') {
    const storeCount = excelData[0]?.length - 2 || 0; // 减去日期和总销售金额列
    const colWidths = [{ wch: 12 }]; // 日期列宽
    colWidths.push({ wch: 15 }); // 总销售金额列宽
    for (let i = 0; i < storeCount; i++) {
      colWidths.push({ wch: 15 }); // 门店列宽
    }
    worksheet['!cols'] = colWidths;
  }
  
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 将工作簿转换为二进制数据
  const buffer = write(workbook, { bookType: 'xlsx', type: 'buffer' });

  // 写入文件到报告目录
  const reportDir = path.join(process.cwd(), 'report');
  await fs.mkdir(reportDir, { recursive: true });
  const filePath = path.join(reportDir, fileName);
  await fs.writeFile(filePath, buffer);

  return filePath;
}