import { NextRequest } from 'next/server';
import { query, transaction } from '@/lib/db';
// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!year || !month) {
      return new Response(
        JSON.stringify({ error: '缺少年份或月份参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const querySql = `
      SELECT store_id, target_amount
      FROM monthly_targets
      WHERE year = ? AND month = ?
    `;
    
    const rows = await query(querySql, [parseInt(year), parseInt(month)]);
    
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('获取月度目标失败:', error);
    return new Response(
      JSON.stringify({ error: '获取月度目标失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { year, month, targets } = await request.json();

    if (!year || !month || !Array.isArray(targets)) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    await transaction(async (connection) => {
      for (const target of targets) {
        const { storeId, targetAmount } = target;
        
        // 使用 INSERT ... ON DUPLICATE KEY UPDATE 来处理插入或更新
        const querySql = `
          INSERT INTO monthly_targets (store_id, year, month, target_amount)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE target_amount = ?
        `;
        
        await connection.execute(querySql, [storeId, year, month, targetAmount, targetAmount]);
      }
    });
      
    return new Response(
      JSON.stringify({ message: '月度目标保存成功' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('保存月度目标失败:', error);
    return new Response(
      JSON.stringify({ error: '保存月度目标失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}