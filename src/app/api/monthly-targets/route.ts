// src/app/api/monthly-targets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';

// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    let sql = `
      SELECT 
        mt.id,
        mt.store_id,
        s.name as store_name,
        mt.year,
        mt.month,
        mt.target_amount,
        mt.created_at,
        mt.updated_at
      FROM monthly_targets mt
      LEFT JOIN stores s ON mt.store_id = s.id
    `;
    
    const params: any[] = [];
    
    if (year && month) {
      sql += ` WHERE mt.year = ? AND mt.month = ?`;
      params.push(parseInt(year), parseInt(month));
    } else if (year) {
      sql += ` WHERE mt.year = ?`;
      params.push(parseInt(year));
    } else if (month) {
      sql += ` WHERE mt.month = ?`;
      params.push(parseInt(month));
    }
    
    sql += ` ORDER BY mt.year DESC, mt.month DESC, s.id ASC`;
    
    // 查询月度目标
    const targets = await query(sql, params);
    
    return NextResponse.json({ 
      success: true, 
      targets: targets.map((target: any) => ({
        id: target.id,
        store_id: target.store_id,
        store_name: target.store_name,
        year: target.year,
        month: target.month,
        target_amount: parseFloat(target.target_amount),
        created_at: target.created_at,
        updated_at: target.updated_at
      })) 
    });
  } catch (error) {
    console.error('获取月度目标数据失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '获取月度目标数据失败' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 支持批量保存格式 { year, month, targets: [{ storeId, targetAmount }, ...] }
    if (body.year && body.month && body.targets && Array.isArray(body.targets)) {
      const { year, month, targets } = body;

      // 批量保存
      for (const target of targets) {
        const { storeId, targetAmount } = target;

        if (!storeId || targetAmount === undefined || targetAmount < 0) {
          return NextResponse.json({
            success: false,
            message: '参数不完整或销售阈值不能为负数'
          }, { status: 400 });
        }

        await query(`
          INSERT INTO monthly_targets (store_id, year, month, target_amount)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          target_amount = VALUES(target_amount),
          updated_at = CURRENT_TIMESTAMP
        `, [storeId, year, month, targetAmount]);
      }

      return NextResponse.json({
        success: true,
        message: '月度目标保存成功'
      });
    }

    // 支持单个记录格式 { storeId, year, month, targetAmount }
    const { storeId, year, month, targetAmount } = body;

    if (!storeId || !year || !month || targetAmount === undefined || targetAmount < 0) {
      return NextResponse.json({
        success: false,
        message: '参数不完整或销售阈值不能为负数'
      }, { status: 400 });
    }

    // 检查是否已存在相同记录，如果存在则更新，否则插入
    const result = await query(`
      INSERT INTO monthly_targets (store_id, year, month, target_amount)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      target_amount = VALUES(target_amount),
      updated_at = CURRENT_TIMESTAMP
    `, [storeId, year, month, targetAmount]);

    return NextResponse.json({
      success: true,
      message: '月度目标保存成功'
    });
  } catch (error) {
    console.error('保存月度目标失败:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : '保存月度目标失败'
    }, { status: 500 });
  }
}