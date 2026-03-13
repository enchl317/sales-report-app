import cron from 'node-cron';
import { generateDailySalesReportData, generateMonthlySalesReportData, writeExcelToFile } from './excel-service';

// 生成日销售报告
async function generateDailySalesReport(): Promise<string> {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
  const fileName = `dailysales${todayStr.replace(/-/g, '')}.xlsx`;

  const excelData = await generateDailySalesReportData(todayStr);
  await writeExcelToFile(excelData, fileName, "当日销售");

  return fileName;
}

// 生成月销售汇总报告
async function generateMonthlySalesReport(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 月份从0开始，需要+1
  const fileName = `monthlysales_${year}_${month.toString().padStart(2, '0')}.xlsx`;

  const { excelData } = await generateMonthlySalesReportData(year, month);
  await writeExcelToFile(excelData, fileName, "当月销售汇总");

  return fileName;
}

// 启动定时任务
export function startScheduledTasks() {
  // 每天14:10执行
  const task = cron.schedule('10 14 * * *', async () => {
    console.log(`开始执行定时任务: ${new Date().toISOString()}`);
    
    try {
      // 生成日销售报告
      const dailyFileName = await generateDailySalesReport();
      console.log(`日销售报告生成成功: ${dailyFileName}`);
      
      // 生成月销售汇总报告
      const monthlyFileName = await generateMonthlySalesReport();
      console.log(`月销售汇总报告生成成功: ${monthlyFileName}`);
      
      console.log('定时任务执行完成');
    } catch (error) {
      console.error('定时任务执行失败:', error);
    }
  }, {
    timezone: "Asia/Shanghai" // 设置为中国时区
  });
  
  console.log('定时任务已启动，将在每天14:10执行');
}

// 立即执行一次（用于测试）
export async function runOnce() {
  console.log('立即执行一次定时任务...');
  
  try {
    const dailyFileName = await generateDailySalesReport();
    console.log(`日销售报告生成成功: ${dailyFileName}`);
    
    const monthlyFileName = await generateMonthlySalesReport();
    console.log(`月销售汇总报告生成成功: ${monthlyFileName}`);
    
    console.log('立即执行完成');
  } catch (error) {
    console.error('立即执行失败:', error);
  }
}