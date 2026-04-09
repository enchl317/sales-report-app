// src/app/api/store-transfer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic';

// 生成调拨单据ID
// 格式：MDDB+目标门店id+来源门店id+日期，如MDDB010220260406
function generateDocumentId(targetStoreId: number, sourceStoreId: number, date: string): string {
  const targetStoreIdStr = String(targetStoreId).padStart(2, '0');
  const sourceStoreIdStr = String(sourceStoreId).padStart(2, '0');
  const dateStr = date.replace(/-/g, '');
  return `MDDB${targetStoreIdStr}${sourceStoreIdStr}${dateStr}`;
}

// GET 获取调拨单列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const storeId = searchParams.get('storeId');
    const date = searchParams.get('date');

    let sql = 'SELECT * FROM store_transfers WHERE 1=1';
    const params: any[] = [];

    if (storeId) {
      sql += ' AND target_store_id = ?';
      params.push(parseInt(storeId));
    }

    if (date) {
      sql += ' AND created_date = ?';
      params.push(date);
    }

    sql += ' ORDER BY created_at DESC';

    const storeTransfers = await query(sql, params);

    return NextResponse.json({ 
      success: true, 
      storeTransfers: storeTransfers.map((transfer: any) => ({
        id: transfer.id,
        documentId: transfer.document_id,
        createdDate: transfer.created_date,
        targetStoreId: transfer.target_store_id,
        targetStoreName: transfer.target_store_name,
        sourceStoreId: transfer.source_store_id,
        sourceStoreName: transfer.source_store_name,
        createdAt: transfer.created_at,
        updatedAt: transfer.updated_at
      })) 
    });
  } catch (error) {
    console.error('获取门店调拨单列表失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '获取门店调拨单列表失败' 
    }, { status: 500 });
  }
}

// POST 创建/更新调拨单
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetStoreId, targetStoreName, sourceStoreId, sourceStoreName, createdDate, details } = body;

    if (!targetStoreId || !createdDate || !details || details.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: '参数不完整' 
      }, { status: 400 });
    }

    // 生成单据ID
    const documentId = generateDocumentId(targetStoreId, sourceStoreId, createdDate);

    // 检查是否已存在当日该目标门店和来源门店的调拨单
    const checkSql = `
      SELECT id FROM store_transfers 
      WHERE target_store_id = ? AND source_store_id = ? AND created_date = ?
    `;
    const existingTransfers = await query(checkSql, [targetStoreId, sourceStoreId, createdDate]);

    let transferId: number;

    if (existingTransfers.length > 0) {
      // 存在则更新
      transferId = existingTransfers[0].id;
      
      // 更新调拨单主表
      const updateSql = `
        UPDATE store_transfers 
        SET target_store_name = ?, source_store_name = ?
        WHERE id = ?
      `;
      await query(updateSql, [targetStoreName, sourceStoreName, transferId]);

      // 删除原有的明细
      const deleteDetailsSql = 'DELETE FROM store_transfer_details WHERE transfer_id = ?';
      await query(deleteDetailsSql, [transferId]);
    } else {
      // 不存在则新增
      const insertSql = `
        INSERT INTO store_transfers (document_id, created_date, target_store_id, target_store_name, source_store_id, source_store_name)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const result: any = await query(insertSql, [documentId, createdDate, targetStoreId, targetStoreName, sourceStoreId, sourceStoreName]);
      transferId = result.insertId;
    }

    // 插入明细
    const insertDetailSql = `
      INSERT INTO store_transfer_details (transfer_id, product_id, product_name, transfer_quantity)
      VALUES (?, ?, ?, ?)
    `;

    for (const detail of details) {
      await query(insertDetailSql, [
        transferId,
        detail.productId,
        detail.productName,
        detail.transferQuantity || 0
      ]);
    }

    return NextResponse.json({ 
      success: true, 
      message: existingTransfers.length > 0 ? '门店调拨单更新成功' : '门店调拨单创建成功',
      documentId: documentId
    });
  } catch (error) {
    console.error('创建/更新门店调拨单失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '创建/更新门店调拨单失败' 
    }, { status: 500 });
  }
}