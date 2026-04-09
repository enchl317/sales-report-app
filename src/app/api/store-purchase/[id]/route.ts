// src/app/api/store-purchase/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 强制动态渲染，避免静态处理错误
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const idParam = params.id;
    
    // 检查参数是否为数字（表示ID）还是文档ID格式
    const isNumeric = /^\d+$/.test(idParam);
    
    let storePurchaseResult: any;
    let storePurchaseId: number;
    
    if (isNumeric) {
      // 如果是数字，按ID查询
      const id = parseInt(idParam);
      
      if (isNaN(id)) {
        return NextResponse.json({ 
          success: false, 
          message: '无效的进货记录ID' 
        }, { status: 400 });
      }

      storePurchaseResult = await query(`
        SELECT 
          sp.id,
          sp.document_id,
          sp.created_date,
          sp.store_id,
          s.name as store_name,
          sp.created_at,
          sp.updated_at
        FROM store_purchases sp
        LEFT JOIN stores s ON sp.store_id = s.id
        WHERE sp.id = ?
      `, [id]);
      
      if (storePurchaseResult.length === 0) {
        return NextResponse.json({ 
          success: false, 
          message: '进货记录不存在' 
        }, { status: 404 });
      }
      
      storePurchaseResult = storePurchaseResult[0];
      storePurchaseId = id;
    } else {
      // 如果不是数字，按文档ID查询
      const documentId = decodeURIComponent(idParam);
      
      storePurchaseResult = await query(`
        SELECT 
          sp.id,
          sp.document_id,
          sp.created_date,
          sp.store_id,
          s.name as store_name,
          sp.created_at,
          sp.updated_at
        FROM store_purchases sp
        LEFT JOIN stores s ON sp.store_id = s.id
        WHERE sp.document_id = ?
      `, [documentId]);
      
      if (storePurchaseResult.length === 0) {
        return NextResponse.json({ 
          success: false, 
          message: '进货记录不存在' 
        }, { status: 404 });
      }
      
      storePurchaseResult = storePurchaseResult[0];
      storePurchaseId = storePurchaseResult.id;
    }

    // 获取进货明细记录
    const details = await query(`
      SELECT 
        d.id,
        d.product_id,
        d.product_name,
        d.purchase_quantity,
        d.created_at,
        d.updated_at
      FROM store_purchase_details d
      WHERE d.store_purchase_id = ?
      ORDER BY d.product_id
    `, [storePurchaseId]);

    return NextResponse.json({ 
      success: true, 
      storePurchase: {
        id: storePurchaseResult.id,
        documentId: storePurchaseResult.document_id,
        createdDate: storePurchaseResult.created_date,
        storeId: storePurchaseResult.store_id,
        storeName: storePurchaseResult.store_name,
        createdAt: storePurchaseResult.created_at,
        updatedAt: storePurchaseResult.updated_at
      },
      details: details.map((detail: any) => ({
        id: detail.id,
        productId: detail.product_id,
        productName: detail.product_name,
        purchaseQuantity: detail.purchase_quantity,
        createdAt: detail.created_at,
        updatedAt: detail.updated_at
      }))
    });
  } catch (error) {
    console.error('获取门店进货详情失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '获取门店进货详情失败' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const idParam = params.id;
    
    // 检查参数是否为数字（表示ID）还是文档ID格式
    const isNumeric = /^\d+$/.test(idParam);
    let result: any;
    
    if (isNumeric) {
      // 如果是数字，按ID删除
      const id = parseInt(idParam);
      
      if (isNaN(id)) {
        return NextResponse.json({ 
          success: false, 
          message: '无效的进货记录ID' 
        }, { status: 400 });
      }

      result = await query('DELETE FROM store_purchases WHERE id = ?', [id]);
    } else {
      // 如果不是数字，按文档ID删除
      const documentId = decodeURIComponent(idParam);
      result = await query('DELETE FROM store_purchases WHERE document_id = ?', [documentId]);
    }

    if (result.affectedRows === 0) {
      return NextResponse.json({ 
        success: false, 
        message: '进货记录不存在' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: '进货记录删除成功'
    });
  } catch (error) {
    console.error('删除进货记录失败:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : '删除进货记录失败' 
    }, { status: 500 });
  }
}