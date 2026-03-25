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
      const user = users.find((u: any) => u.id === employeeId);
      if (!user) {
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
            totalSales += parseFloat(record.total_sales);
            totalAttendance += 1; // 每次参与销售算作一天出勤
          }
        } catch (e) {
          console.error('解析上报人ID失败:', e, '原始数据:', record.reporter_ids);
        }
      });
      
      // 计算预算工资
      // 根据员工在不同门店的销售情况和工资标准来计算
      // 遍历所有销售记录，为该员工计算工资
      salesRecords.forEach((record: any) => {
        try {
          // reporter_ids 可能已经是数组，也可能还是字符串
          let reporterIds = record.reporter_ids;
          if (typeof reporterIds === 'string') {
            reporterIds = JSON.parse(reporterIds);
          }
          
          if (Array.isArray(reporterIds) && reporterIds.includes(employeeId)) {
            const storeId = record.store_id;
            
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
              
              // 根据销售情况计算工资
              let wagePercentage = wageStandard.wage_percentage_below_target;
              
              // 计算该员工在该门店的总销售额
              const employeeStoreSales = salesRecords
                .filter((sr: any) => {
                  try {
                    // sr.reporter_ids 可能已经是数组，也可能还是字符串
                    let srReporterIds = sr.reporter_ids;
                    if (typeof srReporterIds === 'string') {
                      srReporterIds = JSON.parse(srReporterIds);
                    }
                    return sr.store_id === storeId && Array.isArray(srReporterIds) && srReporterIds.includes(employeeId);
                  } catch (e) {
                    console.error('过滤销售记录时解析上报人ID失败:', e);
                    return false;
                  }
                })
                .reduce((sum: number, sr: any) => sum + parseFloat(sr.total_sales), 0);
              
              // 获取该门店的总销售额（用于判断是否达到门店阈值）
              const storeTotalSales = salesRecords
                .filter((sr: any) => sr.store_id === storeId)
                .reduce((sum: number, sr: any) => sum + parseFloat(sr.total_sales), 0);
              
              if (storeThreshold && storeTotalSales >= parseFloat(storeThreshold.threshold_amount)) {
                wagePercentage = wageStandard.wage_percentage_above_target;
              } else if (monthlyTarget && storeTotalSales >= parseFloat(monthlyTarget.target_amount)) {
                wagePercentage = wageStandard.wage_percentage_above_target;
              }
              
              // 计算该笔销售对应的工资
              budgetWage += (parseFloat(record.total_sales) * wagePercentage) / 100;
            }
          }
        } catch (e) {
          console.error('解析上报人ID失败:', e, '原始数据:', record.reporter_ids);
        }
      });
      
      console.log(`员工 ${user.name} (ID: ${employeeId}) - 总销售额: ${totalSales}, 出勤数: ${totalAttendance}, 预算工资: ${budgetWage}`);
      
      return {
        id: employeeId,
        name: user.name,
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