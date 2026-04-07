// src/app/api/employee-wage-summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!year || !month) {
      return NextResponse.json({ 
        success: false, 
        message: '年份和月份参数不能为空' 
      }, { status: 400 });
    }

    // 首先获取所有员工信息
    const users = await query('SELECT id, name FROM users ORDER BY name');
    
    // 获取指定月份的销售数据
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-${new Date(parseInt(year), parseInt(month), 0).getDate()}`;
    
    // 获取销售数据
    const salesRecords = await query(`
      SELECT 
        s.reporter_ids,
        s.total_sales,
        s.report_date,
        s.store_id
      FROM store_sales_records s
      WHERE s.report_date >= ? AND s.report_date <= ?
    `, [startDate, endDate]);
    
    // 获取员工门店工资标准
    const wageStandards = await query(`
      SELECT 
        esws.employee_id,
        esws.store_id,
        esws.wage_percentage_above_target,
        esws.wage_percentage_below_target
      FROM employee_store_wage_standards esws
    `);
    
    // 获取门店月度销售阈值标准
    const storeThresholds = await query(`
      SELECT 
        smt.store_id,
        smt.threshold_amount
      FROM store_monthly_thresholds smt
      WHERE smt.year = ? AND smt.month = ?
    `, [parseInt(year), parseInt(month)]);
    
    // 获取门店月度目标
    const monthlyTargets = await query(`
      SELECT 
        mt.store_id,
        mt.target_amount
      FROM monthly_targets mt
      WHERE mt.year = ? AND mt.month = ?
    `, [parseInt(year), parseInt(month)]);
    
    // 获取所有员工的姓名映射，用于查找员工姓名
    const employeeNameMap: { [key: number]: string } = {};
    users.forEach((user: any) => {
      employeeNameMap[user.id] = user.name;
    });
    
    // 构建员工工资概览数据
    // 首先找出有销售记录的员工
    const employeeIdsWithSales = new Set<number>();
    salesRecords.forEach((record: any) => {
      try {
        // reporter_ids 可能已经是数组，也可能还是字符串
        let reporterIds = record.reporter_ids;
        if (typeof reporterIds === 'string') {
          reporterIds = JSON.parse(reporterIds);
        }
        
        if (Array.isArray(reporterIds)) {
          reporterIds.forEach((id: number) => employeeIdsWithSales.add(id));
        }
      } catch (e) {
        console.error('解析上报人ID失败:', e, '原始数据:', record.reporter_ids);
      }
    });
    
    // 只处理有销售记录的员工
    const employeeSummaries = Array.from(employeeIdsWithSales).map((employeeId: number) => {
      // 找到员工姓名
      const userName = employeeNameMap[employeeId];
      if (!userName) {
        console.log(`未找到ID为${employeeId}的用户信息`);
        return null; // 如果找不到用户信息，则跳过
      }
      
      // 计算该员工的总销售额和出勤天数
      let totalSales = 0;
      let totalAttendance = 0;
      let budgetWage = 0;
      
      // 遍历销售记录，找出该员工参与的销售
      salesRecords.forEach((record: any) => {
        try {
          // reporter_ids 可能已经是数组，也可能还是字符串
          let reporterIds = record.reporter_ids;
          if (typeof reporterIds === 'string') {
            reporterIds = JSON.parse(reporterIds);
          }
          
          if (Array.isArray(reporterIds) && reporterIds.includes(employeeId)) {
            // 计算该员工在该条记录中的个人销售额（按人数平均分配）
            const personalSales = parseFloat(record.total_sales) / reporterIds.length;
            totalSales += personalSales;
            totalAttendance += 1; // 每次参与销售算作一天出勤
          }
        } catch (e) {
          console.error('解析上报人ID失败:', e, '原始数据:', record.reporter_ids);
        }
      });
      
      // 计算预算工资
      // 根据员工在不同门店的销售情况和工资标准来计算
      // 先按门店汇总员工的销售额和门店总销售额
      const storeSalesMap: { [key: number]: number } = {}; // 门店ID -> 员工在该门店的总销售额
      const storeTotalSalesMap: { [key: number]: number } = {}; // 门店ID -> 门店总销售额
      
      // 首先计算每个门店的总销售额和员工在每个门店的销售额
      salesRecords.forEach((record: any) => {
        const storeId = record.store_id;
        
        // 计算门店总销售额
        if (!storeTotalSalesMap[storeId]) {
          storeTotalSalesMap[storeId] = 0;
        }
        storeTotalSalesMap[storeId] += parseFloat(record.total_sales);
        
        try {
          // reporter_ids 可能已经是数组，也可能还是字符串
          let reporterIds = record.reporter_ids;
          if (typeof reporterIds === 'string') {
            reporterIds = JSON.parse(reporterIds);
          }
          
          if (Array.isArray(reporterIds) && reporterIds.includes(employeeId)) {
            // 计算该员工在该条记录中的个人销售额（按人数平均分配）
            const personalSales = parseFloat(record.total_sales) / reporterIds.length;
            
            if (!storeSalesMap[storeId]) {
              storeSalesMap[storeId] = 0;
            }
            storeSalesMap[storeId] += personalSales;
          }
        } catch (e) {
          console.error('解析上报人ID失败:', e, '原始数据:', record.reporter_ids);
        }
      });
      
      // 特殊处理：南东店(1)和杨浦店(5)被视为一个整体
      const combinedStores = [1, 5]; // 南东店和杨浦店
      const processedStores = new Set<number>();
      
      // 处理南东店和杨浦店的组合
      if (combinedStores.every(storeId => storeSalesMap[storeId])) {
        // 如果员工在这两个店都有销售记录
        const nanDongSales = storeSalesMap[1] || 0;
        const yangPuSales = storeSalesMap[5] || 0;
        const nanDongTotalSales = storeTotalSalesMap[1] || 0;
        const yangPuTotalSales = storeTotalSalesMap[5] || 0;
        
        // 合并销售额
        const combinedEmployeeSales = nanDongSales + yangPuSales;
        const combinedStoreTotalSales = nanDongTotalSales + yangPuTotalSales;
        
        // 查找南东店的工资标准（两个店的工资标准应该是一样的）
        const nanDongWageStandard = wageStandards.find(
          (ws: any) => ws.employee_id === employeeId && ws.store_id === 1
        );
        
        if (nanDongWageStandard) {
          // 查找南东店和杨浦店的月度销售阈值
          const nanDongThreshold = storeThresholds.find(
            (st: any) => st.store_id === 1
          );
          const yangPuThreshold = storeThresholds.find(
            (st: any) => st.store_id === 5
          );
          
          // 查找南东店和杨浦店的月度销售目标
          const nanDongTarget = monthlyTargets.find(
            (mt: any) => mt.store_id === 1
          );
          const yangPuTarget = monthlyTargets.find(
            (mt: any) => mt.store_id === 5
          );
          
          // 计算合并阈值
          const combinedThreshold = (nanDongThreshold ? parseFloat(nanDongThreshold.threshold_amount) : 0) +
                                   (yangPuThreshold ? parseFloat(yangPuThreshold.threshold_amount) : 0);
          const combinedTarget = (nanDongTarget ? parseFloat(nanDongTarget.target_amount) : 0) +
                                (yangPuTarget ? parseFloat(yangPuTarget.target_amount) : 0);
          
          // 根据合并后的销售情况确定工资百分比
          let wagePercentage = nanDongWageStandard.wage_percentage_below_target;
          
          if (combinedThreshold > 0 && combinedStoreTotalSales >= combinedThreshold) {
            wagePercentage = nanDongWageStandard.wage_percentage_above_target;
          } else if (combinedTarget > 0 && combinedStoreTotalSales >= combinedTarget) {
            wagePercentage = nanDongWageStandard.wage_percentage_above_target;
          }
          
          // 计算合并门店的预算工资
          budgetWage += (combinedEmployeeSales * wagePercentage) / 100;
        }
        
        // 标记这两个门店已处理
        processedStores.add(1);
        processedStores.add(5);
      }
      
      // 处理其他门店
      for (const storeIdStr in storeSalesMap) {
        const storeId = parseInt(storeIdStr);
        
        // 跳过已处理的门店
        if (processedStores.has(storeId)) {
          continue;
        }
        
        const employeeStoreSales = storeSalesMap[storeId];
        const storeTotalSales = storeTotalSalesMap[storeId] || 0;
        
        // 查找该员工在该门店的工资标准
        const wageStandard = wageStandards.find(
          (ws: any) => ws.employee_id === employeeId && ws.store_id === storeId
        );
        
        if (wageStandard) {
          // 查找该门店的月度销售阈值
          const storeThreshold = storeThresholds.find(
            (st: any) => st.store_id === storeId
          );
          
          // 查找该门店的月度销售目标
          const monthlyTarget = monthlyTargets.find(
            (mt: any) => mt.store_id === storeId
          );
          
          // 根据门店整体销售情况确定工资百分比
          let wagePercentage = wageStandard.wage_percentage_below_target;
          
          if (storeThreshold && storeTotalSales >= parseFloat(storeThreshold.threshold_amount)) {
            wagePercentage = wageStandard.wage_percentage_above_target;
          } else if (monthlyTarget && storeTotalSales >= parseFloat(monthlyTarget.target_amount)) {
            wagePercentage = wageStandard.wage_percentage_above_target;
          }
          
          // 计算该门店的预算工资
          budgetWage += (employeeStoreSales * wagePercentage) / 100;
        }
      }
      
      console.log(`员工 ${userName} (ID: ${employeeId}) - 总销售额: ${totalSales}, 出勤数: ${totalAttendance}, 预算工资: ${budgetWage}`);
      
      return {
        id: employeeId,
        name: userName,
        budgetWage: parseFloat(budgetWage.toFixed(2)),
        totalAttendance,
        totalSales: parseFloat(totalSales.toFixed(2))
      };
    }).filter(Boolean); // 移除null值
    
    console.log(`总共找到 ${employeeSummaries.length} 位有销售记录的员工`);
    
    return NextResponse.json({ 
      success: true, 
      employees: employeeSummaries 
    });
  } catch (error) {
    console.error('获取员工工资概览数据失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '获取员工工资概览数据失败' 
    }, { status: 500 });
  }
}