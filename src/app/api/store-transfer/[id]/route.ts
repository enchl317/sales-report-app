// src/app/api/store-transfer/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic';

// GET 获取调拨单详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    // 获取调拨单主表信息
    const sql = 'SELECT * FROM store_transfers WHERE document_id = ?';
    const transfers = await query(sql, [documentId]);

    if (transfers.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: '调拨单不存在' 
      }, { status: 404 });
    }

    const transfer = transfers[0];

    // 获取调拨明细
    const detailsSql = 'SELECT * FROM store_transfer_details WHERE transfer_id = ?';
    const details = await query(detailsSql, [transfer.id]);

    return NextResponse.json({ 
      success: true, 
      transfer: {
        id: transfer.id,
        documentId: transfer.document_id,
        createdDate: transfer.created_date,
        targetStoreId: transfer.target_store_id,
        targetStoreName: transfer.target_store_name,
        sourceStoreId: transfer.source_store_id,
        sourceStoreName: transfer.source_store_name,
        createdAt: transfer.created_at,
        updatedAt: transfer.updated_at
      },
      details: details.map((detail: any) => ({
        id: detail.id,
        productId: detail.product_id,
        productName: detail.product_name,
        transferQuantity: detail.transfer_quantity
      }))
    });
  } catch (error) {
    console.error('获取门店调拨单详情失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '获取门店调拨单详情失败' 
    }, { status: 500 });
  }
}