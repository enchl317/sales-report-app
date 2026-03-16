import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { utils, write } from 'xlsx';
import fs from 'fs/promises';
import path from 'path';

// 禁用静态生成，标记为动态路由
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year')?.toString() || new Date().getFullYear().toString();
    const month = searchParams.get('month')?.toString() || (new Date().getMonth() + 1).toString();
    const type = searchParams.get('type')?.toString() || 'monthly'; // 'monthly' or 'daily'

    let fileName = '';

    if (type === 'daily') {
      // 生成当日销售数据
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
      fileName = `dailysales${todayStr.replace(/-/g, '')}.xlsx`;

      const querySql = `
        SELECT ssr.*, s.name as store_name, s.short_name as store_short_name
        FROM store_sales_records ssr
        LEFT JOIN stores s ON ssr.store_id = s.id
        WHERE DATE(ssr.report_date) = ?
        ORDER BY ssr.store_id, ssr.report_date
      `;

      const rows = await query(querySql, [todayStr]);

      // 准備Excel數據
      const excelData = [
        ['门店', '门店简称', '日期', '总销售额', '肉松销售额', '其他销售额', '上报人']
      ];

      (rows as any[]).forEach((row: any) => {
        const reporterNames = Array.isArray(row.reporter_names) 
          ? row.reporter_names.join(', ')
          : typeof row.reporter_names === 'string'
            ? JSON.parse(row.reporter_names || '[]').join(', ')
            : row.reporter_names || '';
        
        excelData.push([
          row.store_name,
          row.store_short_name,
          new Date(row.report_date).toLocaleDateString(),
          parseFloat(row.total_sales),
          parseFloat(row.meat_floss_sales),
          parseFloat(row.other_sales),
          reporterNames
        ]);
      });

      // 创建工作簿和工作表
      const worksheet = utils.aoa_to_sheet(excelData); // 使用 aoa_to_sheet (array of arrays) 而不是 json_to_sheet
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "当日销售");

      // 将工作簿转换为二进制数据
      const buffer = write(workbook, { bookType: 'xlsx', type: 'buffer' });

      // 写入文件到报告目录
      const reportDir = path.join(process.cwd(), 'report');
      await fs.mkdir(reportDir, { recursive: true });
      const filePath = path.join(reportDir, fileName);
      await fs.writeFile(filePath, buffer);

      // 返回下载URL
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Excel文件生成成功',
          fileName: fileName,
          downloadUrl: `/api/download/${fileName}`
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      // 生成当月销售汇总
      fileName = `monthlysales_${year}_${month.padStart(2, '0')}.xlsx`;

      const querySql = `
        SELECT ssr.*, s.name as store_name, s.short_name as store_short_name
        FROM store_sales_records ssr
        LEFT JOIN stores s ON ssr.store_id = s.id
        WHERE YEAR(ssr.report_date) = ? AND MONTH(ssr.report_date) = ?
        ORDER BY ssr.report_date, ssr.store_id
      `;

      const rows = await query(querySql, [parseInt(year), parseInt(month)]);

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
        const row: any[] = [`${month}/${date}`];
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

      // 创建工作簿和工作表
      const worksheet = utils.aoa_to_sheet(excelData); // 使用 aoa_to_sheet (array of arrays) 而不是 json_to_sheet
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "当月销售汇总");

      // 设置列宽
      const colWidths = [{ wch: 12 }]; // 日期列宽
      colWidths.push({ wch: 15 }); // 总销售金额列宽
      storeList.forEach(() => colWidths.push({ wch: 15 })); // 门店列宽
      worksheet['!cols'] = colWidths;

      // 将工作簿转换为二进制数据
      const buffer = write(workbook, { bookType: 'xlsx', type: 'buffer' });

      // 写入文件到报告目录
      const reportDir = path.join(process.cwd(), 'report');
      await fs.mkdir(reportDir, { recursive: true });
      const filePath = path.join(reportDir, fileName);
      await fs.writeFile(filePath, buffer);

      // 返回下载URL
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Excel文件生成成功',
          fileName: fileName,
          downloadUrl: `/api/download/${fileName}`
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('生成Excel失败:', error);
    return new Response(
      JSON.stringify({ error: '生成Excel失败', details: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}