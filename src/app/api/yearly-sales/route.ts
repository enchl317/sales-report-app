// src/app/api/yearly-sales/route.ts
import { NextRequest } from 'next/server';
import { query } from '../../../lib/db';
// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    // 查询指定年份的所有销售记录
    const records = await query(`
      SELECT 
        ssr.*,
        s.name as store_name
      FROM store_sales_records ssr
      LEFT JOIN stores s ON ssr.store_id = s.id
      WHERE YEAR(ssr.report_date) = ?
      ORDER BY ssr.store_id ASC, ssr.report_date ASC
    `, [parseInt(year)]);

    // 查询月度目标
    const targets = await query(`
      SELECT mt.store_id, s.name as store_name, mt.year, mt.month, mt.target_amount
      FROM monthly_targets mt
      LEFT JOIN stores s ON mt.store_id = s.id
      WHERE mt.year = ?
    `, [parseInt(year)]);
    
    // 处理目标数据
    const monthlyTargets: Record<string, Record<string, number>> = {}; // { storeName: { month: targetAmount } }
    targets.forEach((target: any) => {
      const storeName = target.store_name;
      const month = String(target.month).padStart(2, '0');
      
      if (!monthlyTargets[storeName]) {
        monthlyTargets[storeName] = {};
      }
      monthlyTargets[storeName][month] = parseFloat(target.target_amount);
    });
    
    // 计算每月总目标（所有门店目标之和）
    const monthlyTotalTargets: Record<string, number> = {};
    Object.entries(monthlyTargets).forEach(([storeName, months]) => {
      Object.entries(months).forEach(([month, targetAmount]) => {
        if (!monthlyTotalTargets[month]) {
          monthlyTotalTargets[month] = 0;
        }
        monthlyTotalTargets[month] += targetAmount;
      });
    });

    // 按门店和月份组织数据
    const organizedData: Record<string, Record<string, any[]>> = {};

    records.forEach((record: any) => {
      const storeName = record.store_name;
      const reportDate = new Date(record.report_date);
      const month = String(reportDate.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要+1
      const date = String(reportDate.getDate()).padStart(2, '0');

      // 初始化门店数据结构
      if (!organizedData[storeName]) {
        organizedData[storeName] = {};
      }

      // 初始化月份数据结构
      if (!organizedData[storeName][month]) {
        organizedData[storeName][month] = [];
      }

      // 添加记录到对应日期
      organizedData[storeName][month].push({
        ...record,
        date: date,
        reporter_names: Array.isArray(record.reporter_names) 
          ? record.reporter_names 
          : typeof record.reporter_names === 'string'
            ? JSON.parse(record.reporter_names || '[]')
            : record.reporter_names || []
      });
    });

    // 按月份倒序排列（12月在前，1月在后）
    Object.keys(organizedData).forEach(storeName => {
      const months = Object.keys(organizedData[storeName]).sort((a, b) => parseInt(b) - parseInt(a));
      const sortedMonths: Record<string, any[]> = {};
      
      months.forEach(month => {
        // 对每个月内的记录按日期排序
        organizedData[storeName][month].sort((a, b) => parseInt(a.date) - parseInt(b.date));
        sortedMonths[month] = organizedData[storeName][month];
      });
      
      organizedData[storeName] = sortedMonths;
    });

    // 计算每个门店的年度销售额
    const yearlyStoreTotals: Record<string, number> = {};
    Object.keys(organizedData).forEach(storeName => {
      let total = 0;
      Object.values(organizedData[storeName]).forEach(dailyRecords => {
        dailyRecords.forEach(record => {
          total += parseFloat(record.total_sales);
        });
      });
      yearlyStoreTotals[storeName] = total;
    });

    // 计算每个门店每月的销售额
    const monthlyStoreTotals: Record<string, Record<string, number>> = {};
    Object.keys(organizedData).forEach(storeName => {
      monthlyStoreTotals[storeName] = {};
      Object.entries(organizedData[storeName]).forEach(([month, dailyRecords]) => {
        let monthlyTotal = 0;
        dailyRecords.forEach(record => {
          monthlyTotal += parseFloat(record.total_sales);
        });
        monthlyStoreTotals[storeName][month] = monthlyTotal;
      });
    });

    // 计算总销售汇总数据
    const totalData: Record<string, Record<string, any>> = {};

    records.forEach((record: any) => {
      const reportDate = new Date(record.report_date);
      const month = String(reportDate.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要+1
      const date = String(reportDate.getDate()).padStart(2, '0');
      const dateKey = `${month}-${date}`; // 用月-日作为唯一标识

      // 初始化月份数据结构
      if (!totalData[month]) {
        totalData[month] = {};
      }

      // 如果该日期已有数据，则累加；否则初始化
      if (!totalData[month][dateKey]) {
        totalData[month][dateKey] = {
          date: date,
          total_sales: 0,
          meat_floss_sales: 0,
          other_sales: 0,
          combined_reporter_names: [] // 存储所有上报人
        };
      }

      // 累加销售额
      totalData[month][dateKey].total_sales += parseFloat(record.total_sales);
      totalData[month][dateKey].meat_floss_sales += parseFloat(record.meat_floss_sales || 0);
      totalData[month][dateKey].other_sales += parseFloat(record.other_sales || 0);

      // 收集所有上报人
      const reporterNames = Array.isArray(record.reporter_names) 
        ? record.reporter_names 
        : typeof record.reporter_names === 'string'
          ? JSON.parse(record.reporter_names || '[]')
          : record.reporter_names || [];
      
      totalData[month][dateKey].combined_reporter_names = Array.from(
        new Set([...totalData[month][dateKey].combined_reporter_names, ...reporterNames])
      ); // 使用Set去重
    });

    // 按月份倒序排列总销售数据
    const totalMonths = Object.keys(totalData).sort((a, b) => parseInt(b) - parseInt(a));
    const sortedTotalData: Record<string, any[]> = {};
    
    totalMonths.forEach(month => {
      // 将每天的数据转换为数组并按日期排序
      const dailyRecords = Object.values(totalData[month]).sort((a, b) => parseInt(a.date) - parseInt(b.date));
      sortedTotalData[month] = dailyRecords;
    });

    // 计算总销售的年度销售额
    let totalYearlySales = 0;
    records.forEach(record => {
      totalYearlySales += parseFloat(record.total_sales);
    });

    // 计算总销售每月的销售额
    const totalMonthlySales: Record<string, number> = {};
    Object.entries(sortedTotalData).forEach(([month, dailyRecords]) => {
      let monthlyTotal = 0;
      dailyRecords.forEach(record => {
        monthlyTotal += record.total_sales;
      });
      totalMonthlySales[month] = monthlyTotal;
    });

    return Response.json({ 
      success: true, 
      data: organizedData,
      totalData: sortedTotalData,
      yearlyStoreTotals,
      monthlyStoreTotals,
      totalYearlySales,
      totalMonthlySales,
      monthlyTargets, // 添加月度目标数据
      monthlyTotalTargets, // 添加每月总目标数据
      year: parseInt(year)
    });
  } catch (error) {
    console.error('获取年度销售数据失败:', error);
    return Response.json({ success: false, message: error instanceof Error ? error.message : '获取数据失败' }, { status: 500 });
  }
}