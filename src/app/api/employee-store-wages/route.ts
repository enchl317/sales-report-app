// src/app/api/employee-store-wages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 使用 request.nextUrl 替代 new URL(request.url) 以避免静态生成错误
    const { searchParams } = request.nextUrl;
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json({ 
        success: false, 
        message: '缺少员工ID参数' 
      }, { status: 400 });
    }

    // 查询指定员工的门店工资标准
    const standards = await query(`
      SELECT 
        esws.id,
        esws.employee_id,
        u.name as employee_name,
        esws.store_id,
        s.name as store_name,
        esws.wage_percentage_above_target,
        esws.wage_percentage_below_target,
        esws.created_at,
        esws.updated_at
      FROM employee_store_wage_standards esws
      LEFT JOIN users u ON esws.employee_id = u.id
      LEFT JOIN stores s ON esws.store_id = s.id
      WHERE esws.employee_id = ?
      ORDER BY s.id ASC
    `, [parseInt(employeeId)]);
    
    return NextResponse.json({ 
      success: true, 
      standards: standards.map((standard: any) => ({
        id: standard.id,
        employee_id: standard.employee_id,
        employee_name: standard.employee_name,
        store_id: standard.store_id,
        store_name: standard.store_name,
        wage_percentage_above_target: parseFloat(standard.wage_percentage_above_target),
        wage_percentage_below_target: parseFloat(standard.wage_percentage_below_target),
        created_at: standard.created_at,
        updated_at: standard.updated_at
      })) 
    });
  } catch (error) {
    console.error('获取员工门店工资标准数据失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '获取员工门店工资标准数据失败' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, storeId, wagePercentageAboveTarget, wagePercentageBelowTarget } = body;

    if (!employeeId || !storeId || wagePercentageAboveTarget === undefined || wagePercentageBelowTarget === undefined) {
      return NextResponse.json({ 
        success: false, 
        message: '参数不完整' 
      }, { status: 400 });
    }

    if (wagePercentageAboveTarget < 0 || wagePercentageBelowTarget < 0) {
      return NextResponse.json({ 
        success: false, 
        message: '工资百分比不能为负数' 
      }, { status: 400 });
    }

    // 检查是否已存在相同记录，如果存在则更新，否则插入
    const result = await query(`
      INSERT INTO employee_store_wage_standards (employee_id, store_id, wage_percentage_above_target, wage_percentage_below_target) 
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      wage_percentage_above_target = VALUES(wage_percentage_above_target),
      wage_percentage_below_target = VALUES(wage_percentage_below_target),
      updated_at = CURRENT_TIMESTAMP
    `, [employeeId, storeId, wagePercentageAboveTarget, wagePercentageBelowTarget]);

    return NextResponse.json({ 
      success: true, 
      message: '员工门店工资标准保存成功' 
    });
  } catch (error) {
    console.error('保存员工门店工资标准失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '保存员工门店工资标准失败' 
    }, { status: 500 });
  }
}